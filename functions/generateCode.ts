import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  executeAdvancedCoTReasoning,
  validateRequired,
  sanitiseString,
  filterSensitiveForLLM,
  enforceOwnership
} from './lib/utils.js';

/**
 * AI Code Generator — Production Grade
 * AXIS: Architecture, CoT Reasoning, Security
 * 
 * Features:
 * - Complete microservice scaffolding with API structures
 * - Dockerfiles and docker-compose configs
 * - Unit and integration tests
 * - Project context-aware generation
 * - Advanced CoT reasoning with validation
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

    const { 
      service_id, 
      language = 'typescript',
      framework = 'express',
      include_tests = true,
      include_docker = true,
      include_api = true,
      architecture_pattern = 'microservices'
    } = body;
    
    logger.info('Generating code', { service_id, language, framework });

    // Fetch service and project data
    const [services, projects] = await Promise.all([
      base44.entities.Service.filter({ id: service_id }),
      base44.entities.Project.list()
    ]);

    const service = services[0];
    if (!service) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Service not found', correlationId);
    }

    const project = projects.find(p => p.id === service.project_id);
    
    // Authorization check
    const ownershipError = enforceOwnership(user, service, correlationId, logger);
    if (ownershipError) return ownershipError;

    // Prepare safe context
    const codeContext = {
      service: filterSensitiveForLLM({
        name: sanitiseString(service.name, 100),
        description: sanitiseString(service.description, 500),
        category: service.category,
        technologies: service.technologies || [],
        apis: service.apis || []
      }),
      project: project ? {
        name: sanitiseString(project.name, 100),
        category: project.category,
        architecture_pattern: project.architecture_pattern || 'microservices'
      } : null,
      options: {
        language,
        framework,
        include_tests,
        include_docker,
        include_api,
        architecture_pattern
      }
    };

    // Generate code using Advanced CoT
    const cotResult = await executeAdvancedCoTReasoning({
      task: 'microservice_code_generation',
      context: codeContext,
      logger,
      executor: async (ctx) => {
        const prompt = buildCodeGenerationPrompt(ctx);
        
        return await base44.integrations.Core.InvokeLLM({
          prompt,
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
                    description: { type: "string" },
                    type: { type: "string", enum: ["source", "test", "config", "docker", "docs"] }
                  },
                  required: ["path", "content", "type"]
                }
              },
              project_structure: { 
                type: "string",
                description: "ASCII tree of the generated project structure"
              },
              dependencies: {
                type: "object",
                properties: {
                  production: { type: "array", items: { type: "string" } },
                  development: { type: "array", items: { type: "string" } }
                }
              },
              setup_commands: {
                type: "array",
                items: { type: "string" },
                description: "Commands to set up and run the service"
              },
              api_documentation: {
                type: "string",
                description: "Generated API documentation in markdown"
              },
              test_coverage_target: {
                type: "number",
                description: "Expected test coverage percentage"
              }
            },
            required: ["files", "project_structure", "dependencies", "setup_commands"]
          }
        });
      },
      validator: (result) => {
        // Validate generated code structure
        if (!result.files || !Array.isArray(result.files)) {
          return { valid: false, issues: ['Missing or invalid files array'] };
        }
        
        // Check required file types
        const fileTypes = result.files.map(f => f.type);
        const requiredTypes = ['source'];
        if (include_tests && !fileTypes.includes('test')) {
          return { valid: false, issues: ['Tests requested but not generated'] };
        }
        if (include_docker && !fileTypes.includes('docker')) {
          return { valid: false, issues: ['Docker files requested but not generated'] };
        }
        
        return { valid: true };
      }
    });

    // Save code generation record
    await base44.entities.CodeGeneration.create({
      service_id,
      project_id: service.project_id,
      language,
      framework,
      architecture_pattern,
      files: cotResult.final_answer.files,
      dependencies: cotResult.final_answer.dependencies,
      project_structure: cotResult.final_answer.project_structure,
      setup_commands: cotResult.final_answer.setup_commands,
      metadata: {
        include_tests,
        include_docker,
        include_api,
        confidence: cotResult.confidence,
        validated: cotResult.validated
      }
    });

    logger.metric('code_generation_complete', Date.now() - startTime, {
      service_id,
      language,
      framework,
      files_count: cotResult.final_answer.files?.length || 0,
      confidence: cotResult.confidence,
      stages_completed: cotResult.stages_completed?.length
    });

    return createSuccessResponse({
      code: cotResult.final_answer,
      generation_metadata: {
        language,
        framework,
        generated_at: new Date().toISOString(),
        files_count: cotResult.final_answer.files?.length,
        confidence: cotResult.confidence,
        validated: cotResult.validated
      },
      reasoning: {
        stages_completed: cotResult.stages_completed,
        confidence: cotResult.confidence,
        execution_time_ms: cotResult.execution_time_ms
      }
    }, correlationId);

  } catch (error) {
    logger.error('Code generation failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Code generation failed', correlationId);
  }
});

/**
 * Build comprehensive code generation prompt with project context
 */
function buildCodeGenerationPrompt(context) {
  const { service, project, options } = context;
  const { language, framework, include_tests, include_docker, include_api, architecture_pattern } = options;

  return `You are an expert software architect generating production-ready microservice code.

CONTEXT:
Project: ${project?.name || 'Standalone Service'}
Project Category: ${project?.category || 'General'}
Architecture: ${architecture_pattern}

Service: ${service.name}
Description: ${service.description}
Category: ${service.category}
Technologies: ${service.technologies.join(', ')}
${service.apis?.length > 0 ? `Existing APIs:\n${JSON.stringify(service.apis, null, 2)}` : ''}

TARGET:
Language: ${language}
Framework: ${framework}

REQUIREMENTS:
Generate a complete, production-ready microservice with:

1. **Core Application Structure**
   - Main application entry point
   - Configuration management (env variables)
   - Logging setup (structured JSON logs)
   - Error handling middleware
   - Health check endpoint (/health)
   - Graceful shutdown handling

${include_api ? `2. **API Layer**
   - RESTful API endpoints with proper HTTP methods
   - Request validation and sanitization
   - Response formatting (success/error)
   - API versioning (v1)
   - Rate limiting middleware
   - CORS configuration
   - OpenAPI/Swagger documentation
   - Example CRUD operations for a sample resource` : ''}

3. **Data Layer**
   - Data models/schemas with validation
   - Database connection setup
   - Migration scripts
   - Repository pattern for data access
   - Transaction handling

${include_tests ? `4. **Testing Suite**
   - Unit tests for business logic (80%+ coverage)
   - Integration tests for API endpoints
   - Test fixtures and mocks
   - Test configuration
   - Example tests showing best practices` : ''}

${include_docker ? `5. **Docker Configuration**
   - Production-optimized Dockerfile (multi-stage build)
   - docker-compose.yml with all dependencies
   - .dockerignore file
   - Environment-specific configs (dev/prod)
   - Health checks in containers
   - Volume mounts for development` : ''}

6. **Security Best Practices**
   - Input validation on all endpoints
   - SQL injection prevention
   - XSS protection
   - CSRF tokens (if needed)
   - Secure headers (Helmet.js or equivalent)
   - Authentication middleware stub
   - Authorization checks

7. **Observability**
   - Structured logging with correlation IDs
   - Metrics endpoints (Prometheus format)
   - Error tracking integration points
   - Performance monitoring hooks

8. **Documentation**
   - README.md with setup instructions
   - API documentation
   - Architecture decision records
   - Contributing guidelines
   - Environment variables documentation

CODE QUALITY STANDARDS:
- Follow ${language} best practices and idioms
- Use ${framework} conventions
- Clean code principles (DRY, SOLID)
- Meaningful variable/function names
- Comprehensive comments for complex logic
- Type safety (TypeScript types, Python type hints, etc.)
- Error handling at every layer
- No hardcoded values (use config)

DELIVERABLES:
Return a complete file structure with:
- All source code files
- Configuration files
- ${include_tests ? 'Test files' : ''}
- ${include_docker ? 'Docker files' : ''}
- Documentation files
- Package/dependency management files

Each file should be production-ready and deployable.`;
}