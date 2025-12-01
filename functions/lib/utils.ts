/**
 * Shared Utilities for Backend Functions
 * 
 * AXIS: Architecture, Observability, Performance, Security
 * - Structured logging with correlation IDs
 * - Error classification and handling
 * - Response helpers
 * - Chain-of-Thought (CoT) reasoning utilities
 * - Input validation & sanitisation (Phase 2.1)
 * - RBAC enforcement (Phase 2.2)
 * - PII protection (Phase 2.3)
 */

// ============================================
// CORRELATION & LOGGING
// ============================================

export function generateCorrelationId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createLogger(correlationId, functionName) {
  const baseContext = { correlationId, fn: functionName, ts: Date.now() };
  
  return {
    info: (message, data = {}) => {
      console.log(JSON.stringify({ level: 'INFO', ...baseContext, message, ...data }));
    },
    warn: (message, data = {}) => {
      console.warn(JSON.stringify({ level: 'WARN', ...baseContext, message, ...data }));
    },
    error: (message, error = null, data = {}) => {
      console.error(JSON.stringify({ 
        level: 'ERROR', 
        ...baseContext, 
        message, 
        error: error?.message || error,
        stack: error?.stack,
        ...data 
      }));
    },
    metric: (name, value, tags = {}) => {
      console.log(JSON.stringify({ level: 'METRIC', ...baseContext, metric: name, value, tags }));
    }
  };
}

// ============================================
// ERROR CLASSIFICATION
// ============================================

export const ErrorCodes = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, retryable: false },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403, retryable: false },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404, retryable: false },
  VALIDATION: { code: 'VALIDATION_ERROR', status: 400, retryable: false },
  RATE_LIMITED: { code: 'RATE_LIMITED', status: 429, retryable: true },
  EXTERNAL_SERVICE: { code: 'EXTERNAL_SERVICE_ERROR', status: 502, retryable: true },
  INTERNAL: { code: 'INTERNAL_ERROR', status: 500, retryable: false },
  TIMEOUT: { code: 'TIMEOUT', status: 504, retryable: true }
};

export function classifyError(error) {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('unauthorized') || message.includes('auth')) {
    return ErrorCodes.UNAUTHORIZED;
  }
  if (message.includes('not found')) {
    return ErrorCodes.NOT_FOUND;
  }
  if (message.includes('timeout')) {
    return ErrorCodes.TIMEOUT;
  }
  if (message.includes('rate limit')) {
    return ErrorCodes.RATE_LIMITED;
  }
  return ErrorCodes.INTERNAL;
}

export function createErrorResponse(errorType, message, correlationId, details = {}) {
  return Response.json({
    success: false,
    error: {
      code: errorType.code,
      message,
      retryable: errorType.retryable,
      correlationId,
      ...details
    }
  }, { status: errorType.status });
}

// ============================================
// RESPONSE HELPERS
// ============================================

export function createSuccessResponse(data, correlationId, meta = {}) {
  return Response.json({
    success: true,
    correlationId,
    timestamp: new Date().toISOString(),
    ...meta,
    data
  });
}

// ============================================
// CHAIN-OF-THOUGHT (CoT) UTILITIES
// ============================================

/**
 * Wraps AI analysis in a structured CoT pipeline
 * 
 * @param {object} params
 * @param {string} params.task - What we're trying to accomplish
 * @param {object} params.context - Input data for analysis
 * @param {function} params.executor - Async function that calls the LLM
 * @param {function} params.validator - Optional validation function
 * @returns {object} Structured CoT result with steps and final_answer
 */
export async function executeCoTReasoning({ task, context, executor, validator = null, logger }) {
  const startTime = Date.now();
  
  const cotResult = {
    task,
    reasoning_steps: [],
    final_answer: null,
    confidence: 0,
    execution_time_ms: 0,
    validated: false
  };

  try {
    // Step 1: Context gathering
    cotResult.reasoning_steps.push({
      step: 1,
      action: 'context_analysis',
      description: 'Analyzing input context and constraints',
      input_summary: Object.keys(context)
    });

    // Step 2: Execute primary reasoning
    const llmResult = await executor(context);
    cotResult.reasoning_steps.push({
      step: 2,
      action: 'llm_reasoning',
      description: 'Primary LLM analysis completed',
      output_type: typeof llmResult
    });

    // Step 3: Validation (if provided)
    if (validator) {
      const isValid = await validator(llmResult);
      cotResult.validated = isValid;
      cotResult.reasoning_steps.push({
        step: 3,
        action: 'validation',
        description: 'Output validation',
        passed: isValid
      });

      if (!isValid) {
        logger?.warn('CoT validation failed', { task });
      }
    } else {
      cotResult.validated = true;
    }

    // Step 4: Finalize
    cotResult.final_answer = llmResult;
    cotResult.confidence = cotResult.validated ? 0.85 : 0.6;
    cotResult.execution_time_ms = Date.now() - startTime;

    cotResult.reasoning_steps.push({
      step: cotResult.reasoning_steps.length + 1,
      action: 'finalize',
      description: 'Reasoning chain complete',
      confidence: cotResult.confidence
    });

    logger?.metric('cot_execution', cotResult.execution_time_ms, { task, validated: cotResult.validated });

    return cotResult;

  } catch (error) {
    cotResult.reasoning_steps.push({
      step: cotResult.reasoning_steps.length + 1,
      action: 'error',
      description: 'Reasoning failed',
      error: error.message
    });
    cotResult.execution_time_ms = Date.now() - startTime;
    throw error;
  }
}

// ============================================
// INPUT VALIDATION
// ============================================

export function validateRequired(params, requiredFields) {
  const missing = requiredFields.filter(field => !params[field]);
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
}

// ============================================
// PHASE 2.1: INPUT VALIDATION & SANITISATION
// ============================================

/**
 * Sanitise string input - removes potential XSS and injection patterns
 */
export function sanitiseString(input, maxLength = 1000) {
  if (typeof input !== 'string') return input;
  
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validates enum values against allowed list
 */
export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    return { 
      valid: false, 
      error: `Invalid ${fieldName}: must be one of [${allowedValues.join(', ')}]` 
    };
  }
  return { valid: true };
}

/**
 * Validates UUID format
 */
export function validateUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Also allow simple alphanumeric IDs that Base44 might use
  const simpleIdRegex = /^[a-zA-Z0-9_-]{1,64}$/;
  return uuidRegex.test(id) || simpleIdRegex.test(id);
}

/**
 * Validates email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Prompt injection defense - strips dangerous patterns from LLM inputs
 * SECURITY: Prevents prompt manipulation attacks
 */
export function sanitiseLLMInput(input) {
  if (typeof input !== 'string') return input;
  
  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /forget\s+(everything|all|your)\s+(instructions?|rules?|training)/gi,
    /you\s+are\s+now\s+(a|an|in)\s+/gi,
    /new\s+instructions?:/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /```\s*(system|assistant|user)/gi
  ];
  
  let sanitised = input;
  for (const pattern of dangerousPatterns) {
    sanitised = sanitised.replace(pattern, '[FILTERED]');
  }
  
  return sanitised;
}

/**
 * Schema-based validation for complex objects
 */
export function validateSchema(data, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value === undefined || value === null) continue;
    
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
    }
    if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} must be a number`);
    }
    if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push(`${field} must be an array`);
    }
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`${field} exceeds max length of ${rules.maxLength}`);
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`${field} has invalid format`);
    }
  }
  
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

// ============================================
// PHASE 2.2: RBAC ENFORCEMENT
// ============================================

export const Roles = {
  ADMIN: 'admin',
  USER: 'user'
};

export const Permissions = {
  // Project permissions
  PROJECT_READ: 'project:read',
  PROJECT_WRITE: 'project:write',
  PROJECT_DELETE: 'project:delete',
  PROJECT_EXPORT: 'project:export',
  
  // Security permissions
  SECURITY_SCAN: 'security:scan',
  SECURITY_VIEW_ALL: 'security:view_all',
  
  // Admin permissions
  USER_MANAGE: 'user:manage',
  SYSTEM_CONFIG: 'system:config',
  
  // Notification permissions
  NOTIFY_ALL: 'notify:all'
};

const RolePermissions = {
  [Roles.ADMIN]: [
    Permissions.PROJECT_READ, Permissions.PROJECT_WRITE, Permissions.PROJECT_DELETE, Permissions.PROJECT_EXPORT,
    Permissions.SECURITY_SCAN, Permissions.SECURITY_VIEW_ALL,
    Permissions.USER_MANAGE, Permissions.SYSTEM_CONFIG,
    Permissions.NOTIFY_ALL
  ],
  [Roles.USER]: [
    Permissions.PROJECT_READ, Permissions.PROJECT_WRITE, Permissions.PROJECT_EXPORT,
    Permissions.SECURITY_SCAN
  ]
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const userPermissions = RolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return user?.role === Roles.ADMIN;
}

/**
 * Check if user owns a resource (created_by check)
 */
export function isOwner(user, resource) {
  if (!user || !resource) return false;
  return resource.created_by === user.email || resource.created_by === user.id;
}

/**
 * Check if user can access a resource (owner OR admin)
 */
export function canAccess(user, resource) {
  return isAdmin(user) || isOwner(user, resource);
}

/**
 * Enforce permission - returns error response if not allowed
 */
export function enforcePermission(user, permission, correlationId, logger = null) {
  if (!hasPermission(user, permission)) {
    logger?.warn('Permission denied', { user: user?.email, permission });
    return createErrorResponse(
      ErrorCodes.FORBIDDEN, 
      `Permission denied: ${permission} required`, 
      correlationId
    );
  }
  return null; // No error, permission granted
}

/**
 * Enforce resource ownership - returns error if user cannot access
 */
export function enforceOwnership(user, resource, correlationId, logger = null) {
  if (!canAccess(user, resource)) {
    logger?.warn('Ownership check failed', { user: user?.email, resource_owner: resource?.created_by });
    return createErrorResponse(
      ErrorCodes.FORBIDDEN, 
      'You do not have access to this resource', 
      correlationId
    );
  }
  return null;
}

// ============================================
// PHASE 2.3: PII & SENSITIVE DATA HANDLING
// ============================================

const PII_FIELDS = ['email', 'phone', 'ssn', 'credit_card', 'password', 'api_key', 'token', 'secret'];
const SENSITIVE_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' },
  { pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, replacement: '[SSN]' },
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD]' },
  { pattern: /(?:api[_-]?key|token|secret|password|bearer)\s*[:=]\s*['"]?[\w\-\.]+['"]?/gi, replacement: '[REDACTED]' }
];

/**
 * Redact PII from objects before logging
 * SECURITY: Prevents sensitive data in logs
 */
export function redactPII(obj, depth = 0) {
  if (depth > 5) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    let redacted = obj;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, replacement);
    }
    return redacted;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactPII(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (PII_FIELDS.some(field => lowerKey.includes(field))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactPII(value, depth + 1);
      }
    }
    return redacted;
  }
  
  return obj;
}

/**
 * Filter sensitive fields from LLM context
 * SECURITY: Prevents PII leakage to AI models
 */
export function filterSensitiveForLLM(data) {
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'credentials', 'auth_config', 'access_token', 'refresh_token'];
  
  if (typeof data !== 'object' || data === null) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveForLLM(item));
  }
  
  const filtered = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      continue; // Skip entirely
    }
    filtered[key] = filterSensitiveForLLM(value);
  }
  return filtered;
}

/**
 * Create safe error response (no internal details exposed)
 * SECURITY: Prevents information disclosure
 */
export function createSafeErrorResponse(errorType, userMessage, correlationId, internalError = null, logger = null) {
  // Log full error internally
  if (logger && internalError) {
    logger.error('Internal error details', internalError, { correlationId });
  }
  
  // Return sanitised error to client
  return Response.json({
    success: false,
    error: {
      code: errorType.code,
      message: userMessage, // User-friendly message only
      retryable: errorType.retryable,
      correlationId
    }
  }, { status: errorType.status });
}

/**
 * Audit log for sensitive operations
 * SECURITY: Creates audit trail for compliance
 */
export function auditLog(logger, action, user, details = {}) {
  if (!logger) return;
  
  logger.info(`AUDIT: ${action}`, {
    audit: true,
    action,
    user_email: user?.email,
    user_role: user?.role,
    timestamp: new Date().toISOString(),
    details: redactPII(details)
  });
}

// ============================================
// PERFORMANCE: Simple in-memory cache (per-request lifecycle)
// ============================================

const cache = new Map();
const CACHE_TTL_MS = 60000; // 1 minute

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}