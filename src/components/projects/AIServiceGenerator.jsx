import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Server, 
  Database, 
  Code, 
  FileJson,
  Loader2,
  CheckCircle2,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PropTypes from "prop-types";

function AIServiceGenerator({ projectData, industryContext, onComplete, onSkip }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [copied, setCopied] = useState({});

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const industryInfo = industryContext ? `
INDUSTRY: ${industryContext.industry?.label}
COMPLIANCE: ${industryContext.industry?.compliance?.join(", ")}
SECURITY REQUIREMENTS: ${industryContext.template?.security_compliance?.authentication}
` : "";

      const prompt = `You are an expert software architect. Generate production-ready microservices with complete boilerplate code for this project:

PROJECT NAME: ${projectData.name}
DESCRIPTION: ${projectData.description}
CATEGORY: ${projectData.category}
${industryInfo}

Generate 3-5 core microservices with:

1. SERVICE ARCHITECTURE:
   - Service name, purpose, and technology (Node.js, Python, Go, or Java)
   - Complete REST API endpoints with:
     * HTTP methods, paths, descriptions
     * Request/response JSON schemas
     * Authentication requirements
     * Rate limiting suggestions

2. DATABASE SCHEMA:
   - Database type (PostgreSQL, MongoDB, Redis)
   - Complete table/collection definitions
   - Field types, constraints, indexes
   - Migration scripts
   - Seed data examples

3. PRODUCTION-READY BOILERPLATE CODE:
   - Complete server setup with Express/FastAPI/Gin/Spring
   - Database connection and ORM/ODM configuration
   - API route handlers with validation
   - Authentication middleware
   - Error handling and logging
   - Environment variable configuration
   - Health check endpoints

4. DOCKER & DEPLOYMENT:
   - Multi-stage Dockerfile optimized for production
   - Docker Compose configuration
   - Environment variables
   - Volume mounts for development

5. DEPENDENCIES & PACKAGES:
   - All required npm/pip/go.mod/Maven packages
   - Version specifications

Return detailed JSON with complete, copy-paste-ready code.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  purpose: { type: "string" },
                  category: { type: "string" },
                  technology: { type: "string" },
                  icon: { type: "string" },
                  api_endpoints: {
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
                  database_schema: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      collections: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            fields: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string" },
                                  type: { type: "string" },
                                  required: { type: "boolean" }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  dependencies: {
                    type: "array",
                    items: { type: "string" }
                  },
                  boilerplate_code: { type: "string" },
                  dockerfile: { type: "string" }
                }
              }
            },
            architecture_notes: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      setSelectedServices(result.services.map(s => s.name));
      toast.success("AI service suggestions generated!");
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleService = (serviceName) => {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const copyToClipboard = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
  };

  const handleComplete = () => {
    const selected = suggestions.services.filter(s => 
      selectedServices.includes(s.name)
    );
    onComplete(selected);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          AI Service Generation
        </h3>
        <p className="text-gray-600">
          Let AI design your microservices architecture, APIs, and schemas
        </p>
      </div>

      {!suggestions ? (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-0">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center py-8">
              <Server className="w-12 h-12 text-violet-600 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">
                AI will analyze your project requirements and generate a complete
                microservices architecture with APIs, database schemas, and code.
              </p>
              <Button
                onClick={generateSuggestions}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Architecture...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Services
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Architecture Notes */}
            {suggestions.architecture_notes && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Architecture Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-900">{suggestions.architecture_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Service Selection */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                Select Services ({selectedServices.length} of {suggestions.services.length})
              </h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServices(suggestions.services.map(s => s.name))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedServices([])}
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Service Cards */}
            <div className="space-y-4">
              {suggestions.services.map((service, idx) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`transition-all duration-200 ${
                    selectedServices.includes(service.name)
                      ? 'border-violet-500 shadow-lg bg-violet-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-2xl">{service.icon || "⚙️"}</div>
                          <div>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {service.purpose}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{service.category}</Badge>
                              <Badge variant="secondary">{service.technology}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={selectedServices.includes(service.name) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleService(service.name)}
                          className={selectedServices.includes(service.name) 
                            ? "bg-violet-600 hover:bg-violet-700" 
                            : ""}
                        >
                          {selectedServices.includes(service.name) ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            "Select"
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="apis" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="apis">APIs</TabsTrigger>
                          <TabsTrigger value="schema">Schema</TabsTrigger>
                          <TabsTrigger value="code">Code</TabsTrigger>
                          <TabsTrigger value="docker">Docker</TabsTrigger>
                        </TabsList>

                        <TabsContent value="apis" className="space-y-2">
                          {service.api_endpoints?.map((endpoint, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                              <Badge className={
                                endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                                endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {endpoint.method}
                              </Badge>
                              <div className="flex-1">
                                <code className="text-sm font-mono text-gray-900">
                                  {endpoint.path}
                                </code>
                                <p className="text-xs text-gray-600 mt-1">
                                  {endpoint.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </TabsContent>

                        <TabsContent value="schema">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">
                                {service.database_schema?.type || "MongoDB"}
                              </Badge>
                            </div>
                            {service.database_schema?.collections?.map((collection, i) => (
                              <div key={i} className="p-3 bg-white rounded-lg border">
                                <h5 className="font-semibold text-sm mb-2">{collection.name}</h5>
                                <div className="space-y-1">
                                  {collection.fields?.map((field, j) => (
                                    <div key={j} className="flex items-center justify-between text-xs">
                                      <span className="font-mono text-gray-700">{field.name}</span>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {field.type}
                                        </Badge>
                                        {field.required && (
                                          <Badge variant="outline" className="text-xs">
                                            required
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="code">
                          <div className="relative">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                              {service.boilerplate_code}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                              onClick={() => copyToClipboard(service.boilerplate_code, `code-${idx}`)}
                            >
                              {copied[`code-${idx}`] ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          {service.dependencies?.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <h5 className="text-xs font-semibold text-blue-900 mb-2">
                                Dependencies:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {service.dependencies.map((dep, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {dep}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="docker">
                          <div className="relative">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                              {service.dockerfile}
                            </pre>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                              onClick={() => copyToClipboard(service.dockerfile, `docker-${idx}`)}
                            >
                              {copied[`docker-${idx}`] ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedServices.length === 0}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Project with {selectedServices.length} Services
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

AIServiceGenerator.propTypes = {
  projectData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  }).isRequired,
  industryContext: PropTypes.object,
  onComplete: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};

export default AIServiceGenerator;