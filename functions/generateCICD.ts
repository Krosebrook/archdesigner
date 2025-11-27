import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * CI/CD Pipeline Generator
 * Generates complete CI/CD configurations for various platforms
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, platform = 'github_actions', options = {} } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    const [projects, services] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const cicdConfig = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a production-ready CI/CD pipeline configuration.

Platform: ${platform}
Project: ${project.name}
Services: ${JSON.stringify(services.map(s => ({
  name: s.name,
  technologies: s.technologies
})), null, 2)}

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
8. Notifications`,
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

    // Save CI/CD configuration
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

    return Response.json({
      success: true,
      config: cicdConfig
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});