import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI Documentation Generator
 * Generates comprehensive documentation for projects and services
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, doc_type = 'full' } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    const [projects, services, cicd, apis] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const docPrompts = {
      full: `Generate comprehensive project documentation including overview, architecture, setup, and deployment.`,
      readme: `Generate a professional README.md with badges, installation, and usage sections.`,
      api: `Generate OpenAPI/Swagger documentation for all API endpoints.`,
      architecture: `Generate detailed architecture documentation with diagrams (mermaid syntax).`
    };

    const documentation = await base44.integrations.Core.InvokeLLM({
      prompt: `${docPrompts[doc_type] || docPrompts.full}

Project: ${project.name}
Description: ${project.description}
Category: ${project.category}
Architecture: ${project.architecture_pattern || 'microservices'}

Services:
${services.map(s => `- ${s.name}: ${s.description} (${s.technologies?.join(', ')})`).join('\n')}

CI/CD: ${cicd.length > 0 ? cicd[0].platform : 'Not configured'}

APIs:
${apis.map(a => `- ${a.name}: ${a.base_url} (${a.endpoints?.length || 0} endpoints)`).join('\n')}

Generate professional documentation in Markdown format.`,
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

    // Save documentation
    await base44.entities.Documentation.create({
      project_id,
      doc_type,
      content: documentation.content,
      sections: documentation.sections,
      version: "1.0.0"
    });

    return Response.json({
      success: true,
      documentation
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});