import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI Architecture Analysis Function
 * Analyzes project architecture and provides recommendations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    // Fetch project and services
    const [projects, services] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use LLM for architecture analysis
    const analysis = await base44.integrations.Core.InvokeLLM({
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

    return Response.json({
      success: true,
      project_id,
      analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});