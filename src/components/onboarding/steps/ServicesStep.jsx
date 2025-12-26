import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Sparkles, Loader2, FileCode, Wand2, TestTube } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

export default function ServicesStep({ data, onComplete, onSkipToReview }) {
  const [services, setServices] = useState(data.services || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customFeature, setCustomFeature] = useState("");
  const [isGeneratingFeature, setIsGeneratingFeature] = useState(false);

  useEffect(() => {
    if (services.length === 0 && data.projectInfo?.name) {
      generateServices();
    } else {
      setSelectedServices(services.map((_, i) => i));
    }
  }, []);

  useEffect(() => {
    const selected = services.filter((_, i) => selectedServices.includes(i));
    onComplete(selected);
  }, [selectedServices, services]);

  const generateServices = async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are an expert microservices architect with access to latest development best practices. Based on this project, design the optimal microservices architecture:

PROJECT: ${data.projectInfo.name}
DESCRIPTION: ${data.projectInfo.description}
CATEGORY: ${data.projectInfo.category}
ARCHITECTURE: ${data.architecture?.pattern}
TECHNOLOGIES: ${data.architecture?.technologies?.join(', ')}
GOALS: ${data.projectInfo.goals}

Design 4-8 core microservices with MODERN STACK (2024-2025):
1. Service name and purpose
2. Category (api, database, frontend, backend, auth, analytics, messaging, storage)
3. Recommended technologies using:
   - Languages: TypeScript, Python 3.12+, Go 1.22+, Rust, Java 21+
   - Frameworks: Express, NestJS, FastAPI, Django, Spring Boot, Fiber
   - Databases: PostgreSQL, MongoDB, Redis, Prisma ORM, Drizzle
   - Auth: Clerk, Auth0, Supabase Auth, Firebase Auth
   - APIs: REST, GraphQL (Apollo), gRPC, tRPC
4. Key API endpoints with OpenAPI specs
5. Database schema with migrations
6. Production-ready boilerplate code with error handling
7. Multi-stage Dockerfile with security best practices
8. Service dependencies and communication patterns

Use latest stable versions and industry-standard patterns. Make it production-ready.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  technologies: { type: "array", items: { type: "string" } },
                  endpoints: { 
                    type: "array", 
                    items: {
                      type: "object",
                      properties: {
                        method: { type: "string" },
                        path: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  },
                  database_schema: { type: "string" },
                  boilerplate_code: { type: "string" },
                  test_code: { type: "string" },
                  dockerfile: { type: "string" },
                  dependencies: { type: "array", items: { type: "string" } },
                  environment_variables: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setServices(result.services);
      setSelectedServices(result.services.map((_, i) => i));
      toast.success(`Generated ${result.services.length} services!`);
    } catch (error) {
      console.error("Service generation failed:", error);
      toast.error("Failed to generate services");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleService = (index) => {
    setSelectedServices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const generateCustomFeature = async () => {
    if (!customFeature.trim()) {
      toast.error("Please describe the feature you want to build");
      return;
    }

    setIsGeneratingFeature(true);
    try {
      const prompt = `You are a senior full-stack engineer with expertise in ${data.architecture?.technologies?.join(', ')}. Generate a COMPLETE, PRODUCTION-READY implementation for this feature:

FEATURE REQUEST: ${customFeature}

PROJECT CONTEXT:
- Architecture: ${data.architecture?.pattern}
- Tech Stack: ${data.architecture?.technologies?.join(', ')}
- Existing Services: ${services.map(s => s.name).join(', ')}

Generate a FULLY FUNCTIONAL microservice/module with:

1. SERVICE DETAILS:
   - Descriptive name and clear purpose
   - Category (api, database, frontend, backend, auth, analytics, messaging, storage, payment, notification)
   - Modern tech stack selection (latest stable versions)

2. COMPLETE WORKING CODE:
   - Full implementation with error handling
   - Input validation and sanitization
   - Security best practices (rate limiting, auth checks, SQL injection prevention)
   - Logging and monitoring hooks
   - Database models/schemas with migrations
   - Business logic layer
   - API controllers/handlers
   - Use modern patterns: async/await, dependency injection, middleware

3. COMPREHENSIVE TESTS:
   - Unit tests (80%+ coverage)
   - Integration tests
   - E2E tests for critical paths
   - Mock data and fixtures
   - Test utilities and helpers

4. API SPECIFICATION:
   - RESTful endpoints with proper HTTP methods
   - Request/response schemas with validation
   - Authentication requirements
   - Rate limiting rules
   - Error response formats
   - Example curl commands

5. DATABASE SCHEMA:
   - Table definitions with indexes
   - Relationships and foreign keys
   - Migration scripts (up/down)
   - Seed data for development

6. DOCKER & DEPLOYMENT:
   - Multi-stage Dockerfile with optimization
   - Docker Compose service definition
   - Health check endpoints
   - Environment variables list
   - Resource limits

7. INTEGRATION:
   - How it connects to existing services
   - Message queue patterns if needed
   - API gateway configuration
   - Service discovery setup

8. DOCUMENTATION:
   - Inline code comments
   - API documentation
   - Setup instructions
   - Troubleshooting guide

Make it PRODUCTION-READY - someone should be able to deploy this immediately.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            boilerplate_code: { type: "string" },
            test_code: { type: "string" },
            endpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  method: { type: "string" },
                  path: { type: "string" },
                  description: { type: "string" },
                  request_body: { type: "string" },
                  response_example: { type: "string" }
                }
              }
            },
            database_schema: { type: "string" },
            dockerfile: { type: "string" },
            docker_compose: { type: "string" },
            dependencies: { type: "array", items: { type: "string" } },
            environment_variables: { type: "array", items: { type: "string" } },
            integration_notes: { type: "string" },
            setup_instructions: { type: "string" }
          }
        }
      });

      const newService = {
        ...result,
        custom: true,
        feature_description: customFeature
      };

      setServices(prev => [...prev, newService]);
      setSelectedServices(prev => [...prev, services.length]);
      setCustomFeature("");
      
      toast.success(`Generated ${result.name} with full implementation!`);
    } catch (error) {
      console.error("Feature generation failed:", error);
      toast.error("Failed to generate feature");
    } finally {
      setIsGeneratingFeature(false);
    }
  };

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">Generating Microservices...</h3>
          <p className="text-gray-600">AI is designing your optimal architecture</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Code2 className="w-5 h-5" />
            Generated Microservices
          </CardTitle>
          <CardDescription className="text-blue-700">
            AI has designed {services.length} services with boilerplate code, APIs, and Docker configs
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedServices.length} of {services.length} services selected
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedServices(services.map((_, i) => i))}
        >
          Select All
        </Button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {services.map((service, index) => (
          <Card
            key={index}
            className={`transition-all ${
              selectedServices.includes(index)
                ? "border-2 border-blue-500 bg-blue-50/50"
                : "border border-gray-200"
            }`}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedServices.includes(index)}
                  onCheckedChange={() => toggleService(index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Technologies</div>
                <div className="flex flex-wrap gap-2">
                  {service.technologies?.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {service.feature_description && (
                <div className="p-2 bg-purple-50 rounded border border-purple-200">
                  <div className="text-xs font-semibold text-purple-900 mb-1">
                    🎯 Custom Feature
                  </div>
                  <div className="text-xs text-purple-700">{service.feature_description}</div>
                </div>
              )}

              {service.endpoints?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">API Endpoints</div>
                  <div className="space-y-1">
                    {service.endpoints.slice(0, 3).map((ep, i) => (
                      <div key={i} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        <span className="text-blue-600 font-bold">{ep.method}</span> {ep.path}
                        {ep.description && (
                          <div className="text-gray-600 mt-0.5">{ep.description}</div>
                        )}
                      </div>
                    ))}
                    {service.endpoints.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{service.endpoints.length - 3} more endpoints
                      </div>
                    )}
                  </div>
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold mb-2">
                  <FileCode className="w-3 h-3 inline mr-1" />
                  View Implementation Code
                </summary>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs max-h-80">
                  {service.boilerplate_code}
                </pre>
              </details>

              {service.test_code && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-green-600 hover:text-green-700 font-semibold mb-2">
                    <TestTube className="w-3 h-3 inline mr-1" />
                    View Test Suite
                  </summary>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs max-h-80">
                    {service.test_code}
                  </pre>
                </details>
              )}

              {service.environment_variables?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">Environment Variables</div>
                  <div className="text-xs font-mono text-gray-600 space-y-0.5">
                    {service.environment_variables.map((env, i) => (
                      <div key={i}>• {env}</div>
                    ))}
                  </div>
                </div>
              )}

              {service.dependencies?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">Dependencies</div>
                  <div className="text-xs text-gray-600">
                    {service.dependencies.join(", ")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Add Custom Feature
          </CardTitle>
          <CardDescription className="text-purple-700">
            Describe any feature in natural language and AI will generate complete, production-ready code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Example: 'Implement user authentication with JWT and refresh tokens'&#10;Example: 'Add shopping cart with Stripe payment integration'&#10;Example: 'Create real-time chat with WebSocket and message persistence'"
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              rows={3}
              className="border-purple-200 focus:border-purple-400"
            />
            <div className="text-xs text-purple-600">
              💡 Be specific about technologies, security requirements, and integrations
            </div>
          </div>
          
          <Button
            onClick={generateCustomFeature}
            disabled={isGeneratingFeature || !customFeature.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isGeneratingFeature ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Full Implementation...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Feature with Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Button
          onClick={generateServices}
          variant="outline"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Regenerate Services
        </Button>
        <Button
          onClick={onSkipToReview}
          variant="outline"
        >
          Skip to Review
        </Button>
      </div>
    </div>
  );
}

ServicesStep.propTypes = {
  data: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onSkipToReview: PropTypes.func.isRequired
};