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
  enforceOwnership,
  Permissions,
  enforcePermission,
  auditLog,
  redactPII,
  filterSensitiveForLLM
} from './lib/utils.js';

/**
 * Project Export Function
 * AXIS: Security (RBAC, PII handling, audit logging)
 * 
 * Security Features:
 * - Export permission enforcement
 * - Ownership validation
 * - PII filtering from exports
 * - Sensitive credential exclusion
 * - Comprehensive audit logging
 * - Safe filename generation
 */

const ALLOWED_FORMATS = ['json', 'markdown'];
const ALLOWED_INCLUDES = ['security_details'];

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'exportProject');
  const startTime = Date.now();

  try {
    logger.info('Export request received');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    // PHASE 2.2: Enforce export permission
    const permError = enforcePermission(user, Permissions.PROJECT_EXPORT, correlationId, logger);
    if (permError) return permError;

    const body = await req.json();
    
    // PHASE 2.1: Input Validation
    const validation = validateRequired(body, ['project_id']);
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing: ${validation.missing.join(', ')}`, correlationId);
    }

    const { project_id, format = 'json', include = [] } = body;

    // Validate format
    const formatValidation = validateEnum(format, ALLOWED_FORMATS, 'format');
    if (!formatValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, formatValidation.error, correlationId);
    }

    // Validate include options
    for (const inc of include) {
      if (!ALLOWED_INCLUDES.includes(inc)) {
        return createErrorResponse(ErrorCodes.VALIDATION, `Invalid include option: ${inc}`, correlationId);
      }
    }

    const [
      projects,
      services,
      tasks,
      securityFindings,
      apis,
      cicd,
      documentation
    ] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.Task.filter({ project_id }),
      base44.entities.SecurityFinding.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id }),
      base44.entities.Documentation.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // PHASE 2.2: RBAC - Ownership check
    const ownershipError = enforceOwnership(user, project, correlationId, logger);
    if (ownershipError) return ownershipError;

    // PHASE 2.3: Audit log for data export (compliance requirement)
    auditLog(logger, 'EXPORT_PROJECT', user, { 
      project_id, 
      format,
      include,
      services_count: services.length,
      tasks_count: tasks.length,
      findings_count: securityFindings.length
    });

    // PHASE 2.3: Build export data with sensitive fields filtered
    const exportData = {
      project: {
        name: sanitiseString(project.name, 200),
        description: sanitiseString(project.description, 2000),
        category: project.category,
        status: project.status,
        architecture_pattern: project.architecture_pattern,
        created_date: project.created_date
      },
      services: services.map(s => ({
        name: sanitiseString(s.name, 100),
        description: sanitiseString(s.description, 500),
        category: s.category,
        technologies: s.technologies,
        // PHASE 2.3: Filter sensitive API configs
        apis: filterSensitiveForLLM(s.apis)
      })),
      tasks: tasks.map(t => ({
        title: sanitiseString(t.title, 200),
        description: sanitiseString(t.description, 2000),
        status: t.status,
        priority_level: t.priority_level,
        due_date: t.due_date
        // Note: assigned_to (email) intentionally excluded for PII protection
      })),
      security: {
        findings_count: securityFindings.length,
        by_severity: {
          critical: securityFindings.filter(f => f.severity === 'critical').length,
          high: securityFindings.filter(f => f.severity === 'high').length,
          medium: securityFindings.filter(f => f.severity === 'medium').length,
          low: securityFindings.filter(f => f.severity === 'low').length
        },
        // Only include details if explicitly requested
        findings: include.includes('security_details') 
          ? securityFindings.map(f => ({
              title: f.title,
              severity: f.severity,
              category: f.category,
              description: f.description,
              remediation: f.remediation,
              status: f.status
              // Note: location excluded as may contain sensitive paths
            }))
          : undefined
      },
      apis: apis.map(a => ({
        name: sanitiseString(a.name, 100),
        base_url: a.base_url,
        auth_type: a.auth_type,
        // PHASE 2.3: Exclude auth_config (contains credentials)
        endpoints: a.endpoints?.map(e => ({
          method: e.method,
          path: e.path,
          description: e.description
          // Exclude request/response schemas which may contain sensitive info
        }))
      })),
      cicd: cicd[0] ? {
        platform: cicd[0].platform,
        pipeline_config: cicd[0].pipeline_config,
        dockerfile: cicd[0].dockerfile
        // Note: credentials and environment variables excluded
      } : null,
      documentation: documentation.map(d => ({
        type: d.doc_type,
        content: d.content,
        version: d.version
      })),
      export_metadata: {
        exported_at: new Date().toISOString(),
        // PHASE 2.3: Only include user ID, not email
        exported_by_id: user.id,
        correlation_id: correlationId
      }
    };

    logger.metric('export_complete', Date.now() - startTime, { 
      project_id, 
      format,
      data_size: JSON.stringify(exportData).length
    });

    if (format === 'json') {
      return createSuccessResponse(exportData, correlationId);
    }

    if (format === 'markdown') {
      // PHASE 2.1: Safe filename generation (no path traversal)
      const safeFilename = project.name
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 50);

      const markdown = `# ${exportData.project.name}

## Overview
${exportData.project.description}

**Category:** ${exportData.project.category}
**Status:** ${exportData.project.status}
**Architecture:** ${exportData.project.architecture_pattern || 'Microservices'}

## Services (${services.length})
${exportData.services.map(s => `
### ${s.name}
${s.description}
- **Technologies:** ${s.technologies?.join(', ') || 'Not specified'}
`).join('\n')}

## Tasks Summary
- Total: ${tasks.length}
- Completed: ${tasks.filter(t => t.status === 'completed').length}
- In Progress: ${tasks.filter(t => t.status === 'in_progress').length}

## Security Overview
- Total Findings: ${exportData.security.findings_count}
- Critical: ${exportData.security.by_severity.critical}
- High: ${exportData.security.by_severity.high}

## APIs (${apis.length})
${exportData.apis.map(a => `- **${a.name}:** ${a.base_url}`).join('\n')}

---
*Exported on ${exportData.export_metadata.exported_at}*
*Correlation ID: ${correlationId}*
`;

      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${safeFilename}_export.md"`
        }
      });
    }

    return createErrorResponse(ErrorCodes.VALIDATION, 'Unsupported format', correlationId);

  } catch (error) {
    logger.error('Export failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Export failed', correlationId);
  }
});