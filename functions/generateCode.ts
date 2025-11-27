import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI Code Generator
 * Generates boilerplate and scaffold code for services
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_id, code_type = 'scaffold', language = 'typescript' } = await req.json();

    if (!service_id) {
      return Response.json({ error: 'service_id is required' }, { status: 400 });
    }

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

    return Response.json({
      success: true,
      code: generatedCode
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});