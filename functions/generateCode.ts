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
 * AI Code Generator
 * AXIS: Architecture, CoT Reasoning, Performance
 * 
 * Features:
 * - Structured CoT code generation
 * - Multi-language support
 * - Clean architecture patterns
 * - Automatic dependency tracking
 */
Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'generateCode');
  const startTime = Date.now();

  try {
    logger.info('Code generation requested');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    const body = await req.json();
    const validation = validateRequired(body, ['service_id']);
    
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing: ${validation.missing.join(', ')}`, correlationId);
    }

    const { service_id, code_type = 'scaffold', language = 'typescript' } = body;
    logger.info('Generating code', { service_id, code_type, language });

    const services = await base44.entities.Service.filter({ id: service_id });
    const service = services[0];

    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }

    const codeTypes = {
      scaffold: 'Complete service scaffold with project structure, configs, and base files',
      api: 'REST API implementation with controllers, routes, and middleware',
      tests: 'Unit and integration test suites',
      models: 'Data models and database schemas',
      docker: 'Dockerfile and docker-compose configuration'
    };

    const generatedCode = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ${codeTypes[code_type]} for this microservice.

Service: ${service.name}
Description: ${service.description}
Technologies: ${service.technologies?.join(', ')}
APIs: ${JSON.stringify(service.apis || [], null, 2)}
Language: ${language}

Generate production-ready code with:
- Clean architecture patterns
- Error handling
- Logging
- Input validation
- Type safety
- Documentation comments`,
      response_json_schema: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                content: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          project_structure: { type: "string" },
          dependencies: {
            type: "object",
            properties: {
              production: {
                type: "array",
                items: { type: "string" }
              },
              development: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          setup_commands: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Save code generation record
    await base44.entities.CodeGeneration.create({
      service_id,
      project_id: service.project_id,
      code_type,
      language,
      files: generatedCode.files,
      dependencies: generatedCode.dependencies
    });

    logger.metric('code_generation_complete', Date.now() - startTime, {
      service_id,
      code_type,
      language,
      files_count: generatedCode.files?.length || 0
    });

    return createSuccessResponse({
      code: generatedCode,
      generation_metadata: {
        code_type,
        language,
        generated_at: new Date().toISOString()
      }
    }, correlationId);

  } catch (error) {
    logger.error('Code generation failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, error.message, correlationId);
  }
});