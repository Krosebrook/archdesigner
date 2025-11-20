import { base44 } from "@/api/base44Client";

export async function autoOnboardProject(project) {
  try {
    const onboardingPrompt = `Analyze this new project and provide comprehensive onboarding setup:

PROJECT: ${project.name}
CATEGORY: ${project.category}
DESCRIPTION: ${project.description}
STATUS: ${project.status}

Generate intelligent initial configurations:

1. CI/CD SETUP:
   - Recommend optimal platform (github_actions, gitlab_ci, jenkins, circleci)
   - Suggest deployment targets based on project type
   - Define pipeline stages with best practices
   - Include security scanning and testing requirements

2. FEATURE FLAGS (3-5 essential flags):
   - Feature name and key
   - Description and use case
   - Initial rollout strategy
   - Target environments (staging/production)
   - Rollout percentages

3. SERVICE DISCOVERY:
   - Suggest 2-4 core microservices based on project category
   - Define communication patterns between services
   - Recommend architectural patterns
   - Identify potential bottlenecks

4. PRIMARY SERVICE SCAFFOLD:
   - Service name and description
   - Recommended technology stack
   - Core API endpoints (3-5)
   - Basic dependencies

Return comprehensive setup as JSON.`;

    const onboarding = await base44.integrations.Core.InvokeLLM({
      prompt: onboardingPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          cicd_config: {
            type: "object",
            properties: {
              platform: { type: "string" },
              deployment_targets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    environment: { type: "string" }
                  }
                }
              },
              pipeline_stages: {
                type: "object",
                properties: {
                  linting: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      tools: { type: "array", items: { type: "string" } }
                    }
                  },
                  testing: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      unit_tests: { type: "boolean" },
                      integration_tests: { type: "boolean" }
                    }
                  },
                  security_scanning: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      dependency_scan: { type: "boolean" },
                      sast: { type: "boolean" }
                    }
                  },
                  build: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      docker: { type: "boolean" }
                    }
                  },
                  deploy: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      auto_staging: { type: "boolean" },
                      manual_production: { type: "boolean" }
                    }
                  }
                }
              },
              rationale: { type: "string" }
            }
          },
          feature_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                flag_key: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                rollout_strategy: { type: "string" },
                environment_config: {
                  type: "object",
                  properties: {
                    staging: {
                      type: "object",
                      properties: {
                        enabled: { type: "boolean" },
                        rollout_percentage: { type: "number" }
                      }
                    },
                    production: {
                      type: "object",
                      properties: {
                        enabled: { type: "boolean" },
                        rollout_percentage: { type: "number" }
                      }
                    }
                  }
                },
                metadata: {
                  type: "object",
                  properties: {
                    tags: { type: "array", items: { type: "string" } },
                    owner: { type: "string" }
                  }
                }
              }
            }
          },
          service_discovery: {
            type: "object",
            properties: {
              suggested_services: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" },
                    rationale: { type: "string" },
                    priority: { type: "string" }
                  }
                }
              },
              communication_patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from_service: { type: "string" },
                    to_service: { type: "string" },
                    pattern: { type: "string" },
                    protocol: { type: "string" }
                  }
                }
              },
              architecture_recommendations: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          primary_service: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              technologies: { type: "array", items: { type: "string" } },
              apis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    method: { type: "string" },
                    path: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Create CI/CD Configuration
    const cicdConfig = await base44.entities.CICDConfiguration.create({
      project_id: project.id,
      platform: onboarding.cicd_config.platform,
      deployment_targets: onboarding.cicd_config.deployment_targets,
      pipeline_stages: onboarding.cicd_config.pipeline_stages
    });

    // Create Feature Flags
    const flagPromises = onboarding.feature_flags.map(flag =>
      base44.entities.FeatureFlag.create({
        project_id: project.id,
        flag_key: flag.flag_key,
        name: flag.name,
        description: flag.description,
        enabled: false,
        environment_config: flag.environment_config,
        rollout_strategy: flag.rollout_strategy,
        metadata: flag.metadata,
        status: "draft"
      })
    );

    // Create Service Discovery
    const serviceDiscovery = await base44.entities.ServiceDiscovery.create({
      project_id: project.id,
      suggested_services: onboarding.service_discovery.suggested_services,
      communication_patterns: onboarding.service_discovery.communication_patterns,
      architecture_recommendations: onboarding.service_discovery.architecture_recommendations
    });

    // Create Primary Service
    const primaryService = await base44.entities.Service.create({
      project_id: project.id,
      name: onboarding.primary_service.name,
      description: onboarding.primary_service.description,
      category: onboarding.primary_service.category,
      technologies: onboarding.primary_service.technologies,
      apis: onboarding.primary_service.apis,
      position: { x: 400, y: 300 }
    });

    // Create initial tasks for the project
    const taskPromises = [
      base44.entities.Task.create({
        project_id: project.id,
        title: "Review CI/CD Pipeline Configuration",
        description: `Review the auto-generated ${onboarding.cicd_config.platform} pipeline and customize as needed.`,
        priority_level: "high",
        status: "backlog"
      }),
      base44.entities.Task.create({
        project_id: project.id,
        title: "Configure Feature Flags",
        description: "Review and activate initial feature flags for controlled rollout.",
        priority_level: "medium",
        status: "backlog"
      }),
      base44.entities.Task.create({
        project_id: project.id,
        title: "Implement Service Architecture",
        description: "Set up the suggested microservices and communication patterns.",
        priority_level: "high",
        status: "backlog"
      })
    ];

    await Promise.all([...flagPromises, ...taskPromises]);

    // Update project with service count
    await base44.entities.Project.update(project.id, {
      services_count: 1
    });

    return {
      success: true,
      cicd: cicdConfig,
      flags: onboarding.feature_flags.length,
      services: 1,
      discovery: serviceDiscovery,
      primary_service: primaryService
    };
  } catch (error) {
    console.error("Error during AI onboarding:", error);
    return {
      success: false,
      error: error.message
    };
  }
}