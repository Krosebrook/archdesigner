/**
 * Shared Utilities for Backend Functions
 * 
 * AXIS: Architecture, Observability, Performance
 * - Structured logging with correlation IDs
 * - Error classification and handling
 * - Response helpers
 * - Chain-of-Thought (CoT) reasoning utilities
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