import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  executeCoTReasoning,
  validateRequired 
} from './lib/utils.js';

/**
 * AI Architecture Analysis Function
 * AXIS: Performance, Architecture, CoT Reasoning
 * 
 * Features:
 * - Structured CoT reasoning pipeline
 * - Correlation IDs for tracing
 * - Error classification
 * - Parallel data fetching
 */
Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'analyzeArchitecture');
  const startTime = Date.now();

  try {
    logger.info('Request received');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      logger.warn('Unauthorized access attempt');
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    const body = await req.json();
    const validation = validateRequired(body, ['project_id']);
    
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing required fields: ${validation.missing.join(', ')}`, correlationId);
    }

    const { project_id } = body;
    logger.info('Analyzing project', { project_id, user: user.email });

    // PERFORMANCE: Parallel data fetching
    const [projects, services] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // CoT REASONING PIPELINE: Structured analysis
    const cotResult = await executeCoTReasoning({
      task: 'architecture_analysis',
      context: { project, services },
      logger,
      executor: async (ctx) => {
        return await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this microservices architecture and provide recommendations.

Project: ${project.name}
Description: ${project.description}
Category: ${project.category}
Services: ${JSON.stringify(services.map(s => ({
  name: s.name,
  category: s.category,
  technologies: s.technologies,
  apis: s.apis
})), null, 2)}

Provide:
1. Architecture health score (0-100)
2. Identified bottlenecks
3. Security concerns
4. Scalability recommendations
5. Performance optimizations
6. Missing services suggestions`,
      response_json_schema: {
        type: "object",
        properties: {
          health_score: { type: "number" },
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service: { type: "string" },
                issue: { type: "string" },
                severity: { type: "string" },
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
          }
        }
      }
    });

      },
      validator: (result) => {
        // Validate the LLM output has required structure
        return result && 
               typeof result.health_score === 'number' && 
               Array.isArray(result.bottlenecks);
      }
    });

    logger.metric('analysis_complete', Date.now() - startTime, { 
      project_id, 
      services_count: services.length,
      health_score: cotResult.final_answer?.health_score 
    });

    return createSuccessResponse({
      project_id,
      analysis: cotResult.final_answer,
      reasoning: {
        steps: cotResult.reasoning_steps,
        confidence: cotResult.confidence,
        execution_time_ms: cotResult.execution_time_ms
      }
    }, correlationId);

  } catch (error) {
    logger.error('Analysis failed', error);
    const errorType = classifyError(error);
    return createErrorResponse(errorType, error.message, correlationId);
  }
});