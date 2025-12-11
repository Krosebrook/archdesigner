import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  validateEnum,
  hasPermission,
  Permissions,
  sanitiseString,
  redactPII,
  auditLog
} from './lib/utils.js';

/**
 * API Gateway
 * AXIS: Security, Performance, Observability
 * 
 * Features:
 * - Coarse-grained RBAC authorization
 * - Rate limiting per user/IP
 * - Request/response logging
 * - Intelligent routing to backend functions
 * - Correlation ID propagation
 * - Structured error handling
 */

// ============================================
// RATE LIMITING
// ============================================

const rateLimiter = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per user

function checkRateLimit(identifier, logger) {
  const now = Date.now();
  const userLimit = rateLimiter.get(identifier) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  // Reset if window expired
  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  userLimit.count++;
  rateLimiter.set(identifier, userLimit);

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - userLimit.count);
  const resetIn = Math.ceil((userLimit.resetAt - now) / 1000);

  if (userLimit.count > RATE_LIMIT_MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', { identifier, count: userLimit.count });
    return {
      allowed: false,
      remaining: 0,
      resetIn
    };
  }

  return {
    allowed: true,
    remaining,
    resetIn
  };
}

// ============================================
// ROUTE CONFIGURATION
// ============================================

const ROUTES = {
  'analyze-architecture': {
    function: 'analyzeArchitecture',
    permission: Permissions.PROJECT_READ,
    description: 'Analyze microservices architecture'
  },
  'security-scan': {
    function: 'securityScan',
    permission: Permissions.SECURITY_SCAN,
    description: 'Perform security vulnerability scan'
  },
  'generate-documentation': {
    function: 'generateDocumentation',
    permission: Permissions.PROJECT_READ,
    description: 'Generate project documentation'
  },
  'generate-cicd': {
    function: 'generateCICD',
    permission: Permissions.PROJECT_WRITE,
    description: 'Generate CI/CD pipeline configuration'
  },
  'generate-code': {
    function: 'generateCode',
    permission: Permissions.PROJECT_WRITE,
    description: 'Generate service code scaffolding'
  },
  'project-health-check': {
    function: 'projectHealthCheck',
    permission: Permissions.PROJECT_READ,
    description: 'Check project health metrics'
  },
  'export-project': {
    function: 'exportProject',
    permission: Permissions.PROJECT_EXPORT,
    description: 'Export project data'
  }
};

const ALLOWED_ROUTES = Object.keys(ROUTES);

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateRoute(route) {
  return validateEnum(route, ALLOWED_ROUTES, 'route');
}

function getRouteConfig(route) {
  return ROUTES[route];
}

function sanitizePayload(payload, maxSize = 50000) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const stringified = JSON.stringify(payload);
  if (stringified.length > maxSize) {
    throw new Error(`Payload too large: ${stringified.length} bytes (max ${maxSize})`);
  }

  return payload;
}

function buildRequestLog(method, route, payload, user) {
  return {
    method,
    route,
    user_email: user?.email,
    user_role: user?.role,
    payload_size: JSON.stringify(payload || {}).length,
    payload_keys: payload ? Object.keys(payload) : []
  };
}

function buildResponseLog(statusCode, executionTime, route) {
  return {
    route,
    status_code: statusCode,
    execution_time_ms: executionTime,
    success: statusCode >= 200 && statusCode < 300
  };
}

// ============================================
// MAIN GATEWAY HANDLER
// ============================================

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'apiGateway');
  const startTime = Date.now();

  try {
    logger.info('Gateway request received', { 
      method: req.method,
      url: req.url 
    });

    // Only accept POST requests
    if (req.method !== 'POST') {
      return createErrorResponse(
        ErrorCodes.VALIDATION, 
        'Only POST requests are allowed', 
        correlationId
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      logger.warn('Unauthenticated request');
      return createErrorResponse(
        ErrorCodes.UNAUTHORIZED, 
        'Authentication required', 
        correlationId
      );
    }

    // Rate limiting
    const clientIdentifier = user.email;
    const rateCheck = checkRateLimit(clientIdentifier, logger);

    if (!rateCheck.allowed) {
      return Response.json({
        success: false,
        error: {
          code: ErrorCodes.RATE_LIMITED.code,
          message: 'Rate limit exceeded. Please try again later.',
          retryable: true,
          correlationId,
          rate_limit: {
            remaining: 0,
            reset_in_seconds: rateCheck.resetIn
          }
        }
      }, { 
        status: ErrorCodes.RATE_LIMITED.status,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateCheck.resetIn.toString()
        }
      });
    }

    // Parse request body
    const body = await req.json();
    const validation = validateRequired(body, ['route', 'payload']);

    if (!validation.valid) {
      return createErrorResponse(
        ErrorCodes.VALIDATION, 
        `Missing required fields: ${validation.missing.join(', ')}`, 
        correlationId
      );
    }

    const { route, payload } = body;

    // Validate route
    const routeValidation = validateRoute(route);
    if (!routeValidation.valid) {
      return createErrorResponse(
        ErrorCodes.VALIDATION, 
        routeValidation.error, 
        correlationId
      );
    }

    const routeConfig = getRouteConfig(route);

    // RBAC: Check permission
    if (!hasPermission(user, routeConfig.permission)) {
      logger.warn('Permission denied', { 
        user: user.email, 
        route, 
        required_permission: routeConfig.permission 
      });
      
      return createErrorResponse(
        ErrorCodes.FORBIDDEN, 
        `Permission denied: ${routeConfig.permission} required for ${route}`, 
        correlationId
      );
    }

    // Sanitize and validate payload
    const sanitizedPayload = sanitizePayload(payload);

    // Log incoming request
    const requestLog = buildRequestLog(req.method, route, sanitizedPayload, user);
    logger.info('Routing request', requestLog);

    // Audit log for sensitive operations
    if (route === 'security-scan' || route === 'export-project') {
      auditLog(logger, `GATEWAY_${route.toUpperCase()}`, user, {
        route,
        project_id: sanitizedPayload.project_id
      });
    }

    // Propagate correlation ID in payload
    const enrichedPayload = {
      ...sanitizedPayload,
      _correlation_id: correlationId,
      _gateway_timestamp: new Date().toISOString()
    };

    // Route to target function
    logger.info('Invoking backend function', { 
      function: routeConfig.function,
      correlation_id: correlationId 
    });

    const functionResponse = await base44.asServiceRole.functions.invoke(
      routeConfig.function, 
      enrichedPayload
    );

    const executionTime = Date.now() - startTime;

    // Log response
    const responseLog = buildResponseLog(
      functionResponse.status || 200, 
      executionTime, 
      route
    );
    logger.info('Function response received', responseLog);

    // Metrics
    logger.metric('gateway_request_complete', executionTime, {
      route,
      function: routeConfig.function,
      user_role: user.role,
      status: functionResponse.status || 200,
      rate_limit_remaining: rateCheck.remaining
    });

    // Return response with gateway metadata
    return Response.json({
      success: true,
      correlationId,
      gateway_metadata: {
        route,
        function: routeConfig.function,
        execution_time_ms: executionTime,
        rate_limit: {
          remaining: rateCheck.remaining,
          reset_in_seconds: rateCheck.resetIn
        }
      },
      data: functionResponse.data || functionResponse
    }, {
      status: functionResponse.status || 200,
      headers: {
        'X-Correlation-ID': correlationId,
        'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        'X-RateLimit-Reset': rateCheck.resetIn.toString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Gateway error', error, { execution_time_ms: executionTime });

    // Classify error type
    let errorType = ErrorCodes.INTERNAL;
    let statusCode = 500;

    if (error.message.includes('Payload too large')) {
      errorType = ErrorCodes.VALIDATION;
      statusCode = 413;
    } else if (error.message.includes('timeout')) {
      errorType = ErrorCodes.TIMEOUT;
    }

    return Response.json({
      success: false,
      error: {
        code: errorType.code,
        message: 'Gateway processing failed',
        retryable: errorType.retryable,
        correlationId,
        details: error.message
      }
    }, { 
      status: statusCode,
      headers: {
        'X-Correlation-ID': correlationId
      }
    });
  }
});