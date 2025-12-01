import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  validateEnum,
  validateSchema,
  sanitiseString,
  sanitiseLLMInput,
  filterSensitiveForLLM,
  enforceOwnership,
  auditLog
} from './lib/utils.js';

/**
 * CI/CD Pipeline Generator
 * AXIS: Security (Schema validation, RBAC, PII filtering)
 * 
 * Security Features:
 * - Schema-based input validation
 * - Platform enum validation
 * - Ownership enforcement
 * - Sensitive data filtering for LLM
 * - Audit logging for compliance
 */

const ALLOWED_PLATFORMS = ['github_actions', 'gitlab_ci', 'jenkins', 'circleci', 'azure_devops', 'bitbucket'];

const OPTIONS_SCHEMA = {
  include_tests: { type: 'boolean' },
  security_scan: { type: 'boolean' },
  docker: { type: 'boolean' },
  auto_deploy_staging: { type: 'boolean' },
  manual_production: { type: 'boolean' }
};

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'generateCICD');
  const startTime = Date.now();

  try {
    logger.info('CI/CD generation requested');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    const body = await req.json();
    
    // PHASE 2.1: Input Validation
    const validation = validateRequired(body, ['project_id']);
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing: ${validation.missing.join(', ')}`, correlationId);
    }

    const { project_id, platform = 'github_actions', options = {} } = body;
    
    // Validate platform enum
    const platformValidation = validateEnum(platform, ALLOWED_PLATFORMS, 'platform');
    if (!platformValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, platformValidation.error, correlationId);
    }

    // Validate options schema
    const optionsValidation = validateSchema(options, OPTIONS_SCHEMA);
    if (!optionsValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, optionsValidation.errors.join('; '), correlationId);
    }

    const [projects, services] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // PHASE 2.2: RBAC - Ownership check
    const ownershipError = enforceOwnership(user, project, correlationId, logger);
    if (ownershipError) return ownershipError;

    // PHASE 2.3: Audit log for sensitive operation
    auditLog(logger, 'GENERATE_CICD', user, { project_id, platform });

    // PHASE 2.3: Filter sensitive data before LLM
    const safeServices = filterSensitiveForLLM(
      services.map(s => ({
        name: sanitiseString(s.name, 100),
        technologies: s.technologies
      }))
    );

    // PHASE 2.1: Sanitise LLM prompt
    const prompt = sanitiseLLMInput(`Generate a production-ready CI/CD pipeline configuration.

Platform: ${platform}
Project: ${sanitiseString(project.name, 200)}
Services: ${JSON.stringify(safeServices, null, 2)}

Options:
- Include tests: ${options.include_tests !== false}
- Security scanning: ${options.security_scan !== false}
- Docker build: ${options.docker !== false}
- Auto deploy staging: ${options.auto_deploy_staging !== false}
- Manual production deploy: ${options.manual_production !== false}

Generate complete pipeline configuration including:
1. Build stage with caching
2. Linting and formatting checks
3. Unit and integration tests
4. Security scanning (SAST, dependency scan)
5. Docker image build and push
6. Deployment stages (staging/production)
7. Rollback procedures
8. Notifications`);

    const cicdConfig = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          pipeline_config: { type: "string" },
          dockerfile: { type: "string" },
          docker_compose: { type: "string" },
          kubernetes_manifests: {
            type: "object",
            properties: {
              deployment: { type: "string" },
              service: { type: "string" },
              ingress: { type: "string" }
            }
          },
          setup_instructions: { type: "string" },
          environment_variables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                required: { type: "boolean" }
              }
            }
          }
        }
      }
    });

    await base44.entities.CICDConfiguration.create({
      project_id,
      platform,
      pipeline_config: cicdConfig.pipeline_config,
      dockerfile: cicdConfig.dockerfile,
      docker_compose: cicdConfig.docker_compose,
      kubernetes_manifests: cicdConfig.kubernetes_manifests,
      setup_instructions: cicdConfig.setup_instructions,
      pipeline_stages: {
        linting: { enabled: true },
        testing: { enabled: true, unit_tests: true, integration_tests: true },
        security_scanning: { enabled: true, sast: true, dependency_scan: true },
        build: { enabled: true, docker: true },
        deploy: { enabled: true, auto_staging: true, manual_production: true }
      }
    });

    logger.metric('cicd_generated', Date.now() - startTime, { project_id, platform });

    return createSuccessResponse({ config: cicdConfig }, correlationId);

  } catch (error) {
    logger.error('CI/CD generation failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'CI/CD generation failed', correlationId);
  }
});