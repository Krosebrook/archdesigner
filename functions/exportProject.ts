import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Project Export Function
 * Exports complete project data in various formats
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, format = 'json', include = [] } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Fetch all project data
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
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const exportData = {
      project: {
        name: project.name,
        description: project.description,
        category: project.category,
        status: project.status,
        architecture_pattern: project.architecture_pattern,
        created_date: project.created_date
      },
      services: services.map(s => ({
        name: s.name,
        description: s.description,
        category: s.category,
        technologies: s.technologies,
        apis: s.apis
      })),
      tasks: tasks.map(t => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority_level: t.priority_level,
        due_date: t.due_date
      })),
      security: {
        findings_count: securityFindings.length,
        by_severity: {
          critical: securityFindings.filter(f => f.severity === 'critical').length,
          high: securityFindings.filter(f => f.severity === 'high').length,
          medium: securityFindings.filter(f => f.severity === 'medium').length,
          low: securityFindings.filter(f => f.severity === 'low').length
        },
        findings: include.includes('security_details') ? securityFindings : undefined
      },
      apis: apis.map(a => ({
        name: a.name,
        base_url: a.base_url,
        auth_type: a.auth_type,
        endpoints: a.endpoints
      })),
      cicd: cicd[0] ? {
        platform: cicd[0].platform,
        pipeline_config: cicd[0].pipeline_config,
        dockerfile: cicd[0].dockerfile
      } : null,
      documentation: documentation.map(d => ({
        type: d.doc_type,
        content: d.content,
        version: d.version
      })),
      exported_at: new Date().toISOString(),
      exported_by: user.email
    };

    if (format === 'json') {
      return Response.json({
        success: true,
        data: exportData
      });
    }

    if (format === 'markdown') {
      const markdown = `# ${project.name}

## Overview
${project.description}

**Category:** ${project.category}
**Status:** ${project.status}
**Architecture:** ${project.architecture_pattern || 'Microservices'}

## Services (${services.length})
${services.map(s => `
### ${s.name}
${s.description}
- **Technologies:** ${s.technologies?.join(', ') || 'Not specified'}
`).join('\n')}

## Tasks Summary
- Total: ${tasks.length}
- Completed: ${tasks.filter(t => t.status === 'completed').length}
- In Progress: ${tasks.filter(t => t.status === 'in_progress').length}

## Security Overview
- Total Findings: ${securityFindings.length}
- Critical: ${securityFindings.filter(f => f.severity === 'critical').length}
- High: ${securityFindings.filter(f => f.severity === 'high').length}

## APIs (${apis.length})
${apis.map(a => `- **${a.name}:** ${a.base_url}`).join('\n')}

---
*Exported on ${new Date().toISOString()} by ${user.email}*
`;

      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${project.name.replace(/\s+/g, '_')}_export.md"`
        }
      });
    }

    return Response.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});