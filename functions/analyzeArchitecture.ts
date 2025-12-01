import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  sanitiseString,
  sanitiseLLMInput,
  filterSensitiveForLLM,
  enforceOwnership,
  auditLog,
  // Phase 3: Advanced CoT
  executeAdvancedCoTReasoning,
  validateCoTOutput,
  buildCoTPrompt,
  CoTStages
} from './lib/utils.js';

/**
 * AI Architecture Analysis Function
 * AXIS: Quality, CoT Reasoning (Phase 3)
 * 
 * Phase 3 Features:
 * - 3.1: Simplified, single-responsibility functions
 * - 3.3: Explicit 5-stage CoT reasoning
 * - 3.4: Structured CoT output with reasoning_steps
 * - 3.5: Output validation with schema checks
 */

// 3.1: Extracted helper - prepares services for LLM
function prepareServicesContext(services) {
  return services.map(s => ({
    name: sanitiseString(s.name, 100),
    category: s.category,
    technologies: s.technologies || [],
    api_count: s.apis?.length || 0
  }));
}

// 3.1: Extracted helper - builds the analysis prompt
function buildAnalysisPrompt(project, services) {
  const safeProject = filterSensitiveForLLM({
    name: sanitiseString(project.name, 200),
    description: sanitiseString(project.description, 2000),
    category: project.category,
    architecture_pattern: project.architecture_pattern || 'microservices'
  });

  const safeServices = prepareServicesContext(services);

  // 3.3: Explicit CoT stages in prompt
  return sanitiseLLMInput(`You are an expert software architect performing a comprehensive architecture analysis.

TASK: Analyze this microservices architecture and provide recommendations.

REASONING STAGES (follow these explicitly):

1. INPUT GATHERING:
   - List all services and their technologies
   - Note the architecture pattern and project category

2. CONTEXTUAL ANALYSIS:
   - Identify service relationships and dependencies
   - Assess technology stack coherence
   - Evaluate architectural patterns used

3. PROBLEM IDENTIFICATION:
   - Find bottlenecks and single points of failure
   - Identify security vulnerabilities
   - Spot scalability limitations
   - Note missing essential services

4. RECOMMENDATION GENERATION:
   - Prioritize issues by severity
   - Provide actionable remediation steps
   - Suggest missing services with rationale

5. OUTPUT FORMATTING:
   - Calculate overall health score (0-100)
   - Structure findings by category
   - Include confidence levels

PROJECT CONTEXT:
Name: ${safeProject.name}
Description: ${safeProject.description}
Category: ${safeProject.category}
Architecture: ${safeProject.architecture_pattern}

SERVICES (${safeServices.length}):
${JSON.stringify(safeServices, null, 2)}

Provide your analysis following the structured output format.`);
}

// 3.4: Structured output schema for architecture analysis
const ARCHITECTURE_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    health_score: { type: "number" },
    reasoning_steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string" },
          findings: { type: "array", items: { type: "string" } },
          confidence: { type: "number" }
        }
      }
    },
    bottlenecks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          service: { type: "string" },
          issue: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          recommendation: { type: "string" }
        }
      }
    },
    security_concerns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string" }
        }
      }
    },
    scalability: {
      type: "array",
      items: { type: "string" }
    },
    performance: {
      type: "array",
      items: { type: "string" }
    },
    missing_services: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          purpose: { type: "string" },
          priority: { type: "string" }
        }
      }
    },
    overall_confidence: { type: "number" }
  }
};

// 3.5: Validation schema for CoT output
const VALIDATION_SCHEMA = {
  requiredFields: ['health_score', 'bottlenecks'],
  fieldTypes: {
    health_score: 'number',
    bottlenecks: 'array',
    security_concerns: 'array',
    scalability: 'array',
    performance: 'array',
    missing_services: 'array'
  }
};

// 3.1: Extracted helper - validates analysis result
function validateAnalysisResult(result) {
  const cotValidation = validateCoTOutput(result, VALIDATION_SCHEMA);
  
  if (!cotValidation.valid) {
    return { valid: false, issues: cotValidation.issues };
  }

  // Additional business logic validation
  if (result.health_score < 0 || result.health_score > 100) {
    return { valid: false, issues: ['health_score must be between 0 and 100'] };
  }

  return { valid: true, score: cotValidation.score };
}

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'analyzeArchitecture');
  const startTime = Date.now();

  try {
    logger.info('Architecture analysis requested');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    const body = await req.json();
    const validation = validateRequired(body, ['project_id']);
    
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing: ${validation.missing.join(', ')}`, correlationId);
    }

    const { project_id } = body;
    logger.info('Analyzing project', { project_id });

    // Parallel data fetching
    const [projects, services] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // RBAC check
    const ownershipError = enforceOwnership(user, project, correlationId, logger);
    if (ownershipError) return ownershipError;

    // Audit log
    auditLog(logger, 'ANALYZE_ARCHITECTURE', user, { project_id, services_count: services.length });

    // 3.3, 3.4, 3.5: Advanced CoT reasoning with explicit stages
    const cotResult = await executeAdvancedCoTReasoning({
      task: 'architecture_analysis',
      context: { project, services },
      logger,
      outputSchema: VALIDATION_SCHEMA,
      executor: async (ctx) => {
        const prompt = buildAnalysisPrompt(ctx.project, ctx.services);
        
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: ARCHITECTURE_ANALYSIS_SCHEMA
        });
      },
      validator: validateAnalysisResult
    });

    logger.metric('architecture_analysis_complete', Date.now() - startTime, { 
      project_id, 
      services_count: services.length,
      health_score: cotResult.final_answer?.health_score,
      confidence: cotResult.confidence,
      stages_completed: cotResult.stages_completed?.length || 0
    });

    return createSuccessResponse({
      project_id,
      analysis: cotResult.final_answer,
      reasoning: {
        stages_completed: cotResult.stages_completed,
        steps: cotResult.reasoning_steps,
        confidence: cotResult.confidence,
        validated: cotResult.validated,
        validation_issues: cotResult.validation_issues,
        execution_time_ms: cotResult.execution_time_ms
      }
    }, correlationId);

  } catch (error) {
    logger.error('Architecture analysis failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Analysis failed', correlationId);
  }
});