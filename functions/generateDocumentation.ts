import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  validateEnum,
  sanitiseString,
  sanitiseLLMInput,
  filterSensitiveForLLM,
  enforceOwnership,
  auditLog
} from './lib/utils.js';

/**
 * AI Documentation Generator
 * AXIS: Security (Input validation, PII filtering, RBAC)
 * 
 * Security Features:
 * - Input sanitisation
 * - Enum validation for doc_type
 * - PII filtering before LLM calls
 * - Ownership enforcement
 * - Audit logging
 */

const ALLOWED_DOC_TYPES = ['full', 'readme', 'api', 'architecture'];

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'generateDocumentation');
  const startTime = Date.now();

  try {
    logger.info('Documentation generation requested');
    
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

    const { project_id, doc_type = 'full' } = body;
    
    // Validate enum
    const enumValidation = validateEnum(doc_type, ALLOWED_DOC_TYPES, 'doc_type');
    if (!enumValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, enumValidation.error, correlationId);
    }

    const [projects, services, cicd, apis] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // PHASE 2.2: RBAC - Ownership check
    const ownershipError = enforceOwnership(user, project, correlationId, logger);
    if (ownershipError) return ownershipError;

    // PHASE 2.3: Audit log
    auditLog(logger, 'GENERATE_DOCUMENTATION', user, { project_id, doc_type });

    const docPrompts = {
      full: `Generate comprehensive project documentation including overview, architecture, setup, and deployment.`,
      readme: `Generate a professional README.md with badges, installation, and usage sections.`,
      api: `Generate OpenAPI/Swagger documentation for all API endpoints.`,
      architecture: `Generate detailed architecture documentation with diagrams (mermaid syntax).`
    };

    // PHASE 2.1 & 2.3: Sanitise inputs and filter sensitive data before LLM
    const safeProject = filterSensitiveForLLM({
      name: sanitiseString(project.name, 200),
      description: sanitiseString(project.description, 2000),
      category: project.category,
      architecture_pattern: project.architecture_pattern || 'microservices'
    });

    const safeServices = filterSensitiveForLLM(
      services.map(s => ({
        name: sanitiseString(s.name, 100),
        description: sanitiseString(s.description, 500),
        technologies: s.technologies
      }))
    );

    const safeApis = filterSensitiveForLLM(
      apis.map(a => ({
        name: sanitiseString(a.name, 100),
        base_url: a.base_url,
        endpoints_count: a.endpoints?.length || 0
      }))
    );

    // PHASE 2.1: Sanitise LLM prompt
    const prompt = sanitiseLLMInput(`${docPrompts[doc_type]}

Project: ${safeProject.name}
Description: ${safeProject.description}
Category: ${safeProject.category}
Architecture: ${safeProject.architecture_pattern}

Services:
${safeServices.map(s => `- ${s.name}: ${s.description} (${s.technologies?.join(', ')})`).join('\n')}

CI/CD: ${cicd.length > 0 ? cicd[0].platform : 'Not configured'}

APIs:
${safeApis.map(a => `- ${a.name}: ${a.base_url} (${a.endpoints_count} endpoints)`).join('\n')}

Generate professional documentation in Markdown format.`);

    const documentation = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          sections: {
            type: "object",
            properties: {
              overview: { type: "string" },
              installation: { type: "string" },
              architecture: { type: "string" },
              api_reference: { type: "string" },
              deployment: { type: "string" },
              contributing: { type: "string" }
            }
          },
          diagrams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                mermaid_code: { type: "string" }
              }
            }
          }
        }
      }
    });

    await base44.entities.Documentation.create({
      project_id,
      doc_type,
      content: documentation.content,
      sections: documentation.sections,
      version: "1.0.0"
    });

    logger.metric('documentation_generated', Date.now() - startTime, { project_id, doc_type });

    return createSuccessResponse({ documentation }, correlationId);

  } catch (error) {
    logger.error('Documentation generation failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Documentation generation failed', correlationId);
  }
});