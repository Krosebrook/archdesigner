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
  Copy,
  FileText,
  Zap,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PropTypes from "prop-types";

function AIServiceGeneratorV2({ projectData, industryContext, onComplete, onSkip }) {
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
SECURITY: ${industryContext.template?.security_compliance?.authentication}
ARCHITECTURE: ${industryContext.template?.database_architecture?.encryption}
` : "";

      const prompt = `You are an expert software architect specializing in ${industryContext?.industry?.label || "modern"} systems. Generate COMPLETE production-ready microservices with full boilerplate code.

PROJECT: ${projectData.name}
DESCRIPTION: ${projectData.description}
CATEGORY: ${projectData.category}
${industryInfo}

Generate 3-5 microservices with COMPLETE implementations:

1. SERVICE ARCHITECTURE (per service):
   - Service name, purpose, and technology stack
   - Complete REST API with:
     * HTTP method, path, description
     * Full request/response JSON schemas
     * Authentication requirements
     * Validation rules
     * Error response formats

2. DATABASE SCHEMA (production-ready):
   - Database type (PostgreSQL, MongoDB, Redis)
   - Complete table/collection definitions
   - Field names, types, constraints, defaults
   - Indexes for performance
   - Foreign keys and relationships
   - Migration SQL/scripts

3. COMPLETE BOILERPLATE CODE:
   A. Server Setup (Express/FastAPI/Gin):
      - Full server.js/main.py/main.go
      - CORS, body parser, security headers
      - Database connection with pool
      - Error middleware
      - Request logging
   
   B. API Handlers (2-3 examples):
      - Route definitions
      - Request validation
      - Business logic
      - Database queries
      - Error handling
      - Response formatting
   
   C. Authentication Middleware:
      - JWT verification
      - Role-based access
      - Token refresh logic
   
   D. Database Models:
      - ORM/ODM schemas
      - Validation rules
      - Relationships

4. CI/CD PIPELINE (GitHub Actions):
   - Linting, testing, security scanning
   - Docker build and push
   - Deployment to staging/production
   - Environment-specific configs

5. DOCKER CONFIGURATION:
   - Multi-stage production Dockerfile
   - docker-compose.yml for local dev
   - All services, databases, Redis
   - Volume mounts, networks
   - Health checks

6. DOCUMENTATION:
   - Complete README.md
   - Setup instructions
   - API documentation
   - Environment variables
   - Development workflow

Return detailed JSON with FULL, COPY-PASTE-READY code. Every code block should be complete and runnable.`;

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
                        description: { type: "string" },
                        request_schema: { type: "object" },
                        response_schema: { type: "object" },
                        auth_required: { type: "boolean" }
                      }
                    }
                  },
                  database_schema: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      tables: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            fields: { type: "array" },
                            indexes: { type: "array" }
                          }
                        }
                      },
                      migration_sql: { type: "string" }
                    }
                  },
                  boilerplate_code: {
                    type: "object",
                    properties: {
                      server_file: { type: "string" },
                      api_handlers: { type: "string" },
                      auth_middleware: { type: "string" },
                      database_models: { type: "string" }
                    }
                  },
                  dockerfile: { type: "string" },
                  dependencies: { type: "array" },
                  env_variables: { type: "array" }
                }
              }
            },
            cicd_pipeline: { type: "string" },
            docker_compose: { type: "string" },
            readme: { type: "string" },
            architecture_notes: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      setSelectedServices(result.services.map(s => s.name));
      toast.success("Complete microservices architecture generated!");
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast.error("Failed to generate architecture");
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
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
  };

  const handleComplete = () => {
    const selected = suggestions.services.filter(s => 
      selectedServices.includes(s.name)
    );
    onComplete({
      services: selected,
      cicd_pipeline: suggestions.cicd_pipeline,
      docker_compose: suggestions.docker_compose,
      readme: suggestions.readme
    });
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
          AI-Powered Architecture Generator
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate complete production-ready microservices with full boilerplate code, 
          database schemas, CI/CD pipelines, and Docker configurations
        </p>
        {industryContext?.industry && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {industryContext.industry.label}
            </Badge>
            {industryContext.industry.compliance?.map((comp, i) => (
              <Badge key={i} variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {comp}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {!suggestions ? (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-0">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Server className="w-16 h-16 text-violet-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Ready to Generate Your Architecture?
              </h4>
              <p className="text-gray-700 mb-8 max-w-xl mx-auto">
                AI will create a complete microservices architecture with:
              </p>
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 text-left">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Code className="w-5 h-5 text-violet-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Production Code</p>
                    <p className="text-xs text-gray-600">Complete server setup, API handlers, middleware</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Database Schemas</p>
                    <p className="text-xs text-gray-600">Tables, indexes, migrations, relationships</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <Zap className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">CI/CD Pipeline</p>
                    <p className="text-xs text-gray-600">GitHub Actions with testing and deployment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Documentation</p>
                    <p className="text-xs text-gray-600">Setup guides, API docs, Docker configs</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={generateSuggestions}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Complete Architecture...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Full Stack
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
            className="space-y-6"
          >
            {/* Architecture Overview */}
            {suggestions.architecture_notes && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
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
                Microservices ({selectedServices.length}/{suggestions.services.length})
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
                  Clear
                </Button>
              </div>
            </div>

            {/* Service Cards with Full Details */}
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
                      ? 'border-violet-500 shadow-xl bg-violet-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-3xl">{service.icon || "⚙️"}</div>
                          <div>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {service.purpose}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{service.category}</Badge>
                              <Badge variant="secondary">{service.technology}</Badge>
                              {service.database_schema?.tables && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Database className="w-3 h-3 mr-1" />
                                  {service.database_schema.tables.length} tables
                                </Badge>
                              )}
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
                      <Tabs defaultValue="code" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="code">Code</TabsTrigger>
                          <TabsTrigger value="apis">APIs</TabsTrigger>
                          <TabsTrigger value="schema">DB</TabsTrigger>
                          <TabsTrigger value="docker">Docker</TabsTrigger>
                          <TabsTrigger value="env">Config</TabsTrigger>
                        </TabsList>

                        {/* Boilerplate Code */}
                        <TabsContent value="code" className="space-y-4">
                          {service.boilerplate_code?.server_file && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm">Server Setup</h5>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(service.boilerplate_code.server_file, `server-${idx}`)}
                                >
                                  {copied[`server-${idx}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                                {service.boilerplate_code.server_file}
                              </pre>
                            </div>
                          )}
                          {service.boilerplate_code?.api_handlers && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm">API Handlers</h5>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(service.boilerplate_code.api_handlers, `handlers-${idx}`)}
                                >
                                  {copied[`handlers-${idx}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                                {service.boilerplate_code.api_handlers}
                              </pre>
                            </div>
                          )}
                        </TabsContent>

                        {/* API Endpoints */}
                        <TabsContent value="apis" className="space-y-2">
                          {service.api_endpoints?.map((endpoint, i) => (
                            <div key={i} className="p-3 bg-white rounded-lg border">
                              <div className="flex items-start gap-3 mb-2">
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
                                  {endpoint.auth_required && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      🔒 Auth
                                    </Badge>
                                  )}
                                  <p className="text-xs text-gray-600 mt-1">
                                    {endpoint.description}
                                  </p>
                                </div>
                              </div>
                              {endpoint.request_schema && (
                                <details className="text-xs mt-2">
                                  <summary className="cursor-pointer text-gray-700 font-medium">Request Schema</summary>
                                  <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(endpoint.request_schema, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </TabsContent>

                        {/* Database Schema */}
                        <TabsContent value="schema" className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">
                              {service.database_schema?.type || "Database"}
                            </Badge>
                          </div>
                          {service.database_schema?.tables?.map((table, i) => (
                            <div key={i} className="p-3 bg-white rounded-lg border">
                              <h5 className="font-semibold text-sm mb-2">{table.name}</h5>
                              <div className="space-y-1 text-xs">
                                {table.fields?.map((field, j) => (
                                  <div key={j} className="flex items-center justify-between">
                                    <span className="font-mono text-gray-700">
                                      {typeof field === 'string' ? field : field.name}
                                    </span>
                                    {typeof field === 'object' && (
                                      <div className="flex gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {field.type}
                                        </Badge>
                                        {field.required && (
                                          <Badge variant="outline" className="text-xs">required</Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {table.indexes && table.indexes.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs text-gray-600">
                                    <strong>Indexes:</strong> {table.indexes.join(", ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          {service.database_schema?.migration_sql && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-sm">Migration SQL</h5>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(service.database_schema.migration_sql, `sql-${idx}`)}
                                >
                                  {copied[`sql-${idx}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                                {service.database_schema.migration_sql}
                              </pre>
                            </div>
                          )}
                        </TabsContent>

                        {/* Docker */}
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
                              {copied[`docker-${idx}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TabsContent>

                        {/* Environment Variables */}
                        <TabsContent value="env" className="space-y-3">
                          {service.env_variables && service.env_variables.length > 0 && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <h5 className="font-semibold text-sm mb-2">Environment Variables</h5>
                              <div className="space-y-1 text-xs font-mono">
                                {service.env_variables.map((env, i) => (
                                  <div key={i} className="text-gray-700">{env}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {service.dependencies && service.dependencies.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <h5 className="font-semibold text-sm mb-2">Dependencies</h5>
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
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Infrastructure Configurations */}
            <div className="grid md:grid-cols-2 gap-4">
              {suggestions.cicd_pipeline && (
                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      CI/CD Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-48">
                        {suggestions.cicd_pipeline}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                        onClick={() => copyToClipboard(suggestions.cicd_pipeline, 'cicd')}
                      >
                        {copied['cicd'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {suggestions.docker_compose && (
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Docker Compose
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-48">
                        {suggestions.docker_compose}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                        onClick={() => copyToClipboard(suggestions.docker_compose, 'compose')}
                      >
                        {copied['compose'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* README Documentation */}
            {suggestions.readme && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    README.md
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-64">
                      {suggestions.readme}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                      onClick={() => copyToClipboard(suggestions.readme, 'readme')}
                    >
                      {copied['readme'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedServices.length === 0}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Create Project with {selectedServices.length} Services
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

AIServiceGeneratorV2.propTypes = {
  projectData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired
  }).isRequired,
  industryContext: PropTypes.object,
  onComplete: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};

export default AIServiceGeneratorV2;