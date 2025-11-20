import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, Loader2, Sparkles, Download, Copy, CheckCircle2,
  FileCode, TestTube, Package, Rocket, Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function ServiceScaffoldGenerator({ project, services }) {
  const [selectedService, setSelectedService] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [scaffold, setScaffold] = useState(null);
  const [copied, setCopied] = useState("");

  const generateScaffold = async () => {
    if (!selectedService) return;
    
    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    setIsGenerating(true);
    try {
      const prompt = `Generate production-ready microservice boilerplate for:

SERVICE: ${service.name}
CATEGORY: ${service.category}
DESCRIPTION: ${service.description}
TECHNOLOGIES: ${(service.technologies || []).join(', ')}
APIs: ${(service.apis || []).map(a => `${a.method} ${a.path}`).join(', ')}

Generate complete, deployable code structure:

1. SERVICE CODE:
   - Main application entry point with proper structure
   - API route handlers for all endpoints
   - Database models/schemas
   - Business logic layer
   - Middleware (auth, logging, error handling)
   - Configuration management
   - Dependencies/requirements file

2. UNIT TESTS:
   - Test suite covering all API endpoints
   - Mock data fixtures
   - Integration tests
   - Test configuration
   - >80% code coverage approach

3. DOCKERFILE:
   - Multi-stage build for optimization
   - Security best practices
   - Health check endpoint
   - Proper caching layers
   - Non-root user
   - .dockerignore file

4. DOCKER-COMPOSE:
   - Service definition
   - Database dependencies
   - Network configuration
   - Volume mounts
   - Environment variables

5. CI/CD PIPELINE:
   - Build and test stages
   - Linting and security scanning
   - Docker image build and push
   - Deployment configuration

6. README:
   - Setup instructions
   - API documentation
   - Development guide
   - Environment variables

Choose the best framework based on technologies (e.g., Express.js for Node, FastAPI for Python, Spring Boot for Java).
Make it production-ready with logging, monitoring, and proper error handling.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            language: { type: "string" },
            framework: { type: "string" },
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
            setup_instructions: { type: "string" },
            environment_variables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string" },
                  description: { type: "string" },
                  example: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newScaffold = await base44.entities.CodeGeneration.create({
        project_id: project.id,
        service_id: service.id,
        generation_type: "full_service",
        language: result.language,
        framework: result.framework,
        file_structure: result.files || [],
        setup_instructions: result.setup_instructions
      });

      setScaffold({
        ...newScaffold,
        environment_variables: result.environment_variables
      });
    } catch (error) {
      console.error("Error generating scaffold:", error);
    }
    setIsGenerating(false);
  };

  const copyContent = (fileName, content) => {
    navigator.clipboard.writeText(content);
    setCopied(fileName);
    setTimeout(() => setCopied(""), 2000);
  };

  const downloadFile = (fileName, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    if (!scaffold?.file_structure) return;
    scaffold.file_structure.forEach(file => {
      downloadFile(file.path, file.content);
    });
  };

  const getFileIcon = (path) => {
    if (path.includes('test')) return TestTube;
    if (path.includes('Docker')) return Package;
    if (path.includes('README')) return FileCode;
    return Code;
  };

  const categorizeFiles = (files) => {
    const categories = {
      core: [],
      tests: [],
      docker: [],
      config: [],
      docs: []
    };

    files.forEach(file => {
      if (file.path.includes('test')) categories.tests.push(file);
      else if (file.path.includes('Docker') || file.path.includes('docker')) categories.docker.push(file);
      else if (file.path.includes('README') || file.path.includes('.md')) categories.docs.push(file);
      else if (file.path.includes('config') || file.path.includes('.env') || file.path.includes('.yml')) categories.config.push(file);
      else categories.core.push(file);
    });

    return categories;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-violet-900 to-purple-900 border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Rocket className="w-7 h-7 text-white" />
              </motion.div>
              AI Service Scaffold Generator
            </CardTitle>
            <p className="text-violet-100 mt-2">
              Generate production-ready boilerplate, tests, and Docker configuration
            </p>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-violet-200 mb-2 block">Select Service</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedService && (
                <div className="flex items-end">
                  <Button
                    onClick={generateScaffold}
                    disabled={isGenerating}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Full Scaffold
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {scaffold && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-violet-600" />
                    Generated Scaffold
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-violet-600">{scaffold.language}</Badge>
                    <Badge className="bg-purple-600">{scaffold.framework}</Badge>
                    <Badge variant="outline">{scaffold.file_structure?.length || 0} files</Badge>
                  </div>
                </div>
                <Button onClick={downloadAll} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs defaultValue="core" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0">
                  <TabsTrigger value="core" className="rounded-none">
                    <Code className="w-4 h-4 mr-2" />
                    Core Files
                  </TabsTrigger>
                  <TabsTrigger value="tests" className="rounded-none">
                    <TestTube className="w-4 h-4 mr-2" />
                    Tests
                  </TabsTrigger>
                  <TabsTrigger value="docker" className="rounded-none">
                    <Package className="w-4 h-4 mr-2" />
                    Docker
                  </TabsTrigger>
                  <TabsTrigger value="config" className="rounded-none">
                    <Zap className="w-4 h-4 mr-2" />
                    Config
                  </TabsTrigger>
                  <TabsTrigger value="setup" className="rounded-none">
                    <FileCode className="w-4 h-4 mr-2" />
                    Setup
                  </TabsTrigger>
                </TabsList>

                {scaffold.file_structure && (() => {
                  const categories = categorizeFiles(scaffold.file_structure);
                  
                  return (
                    <>
                      {Object.entries(categories).map(([category, files]) => (
                        files.length > 0 && (
                          <TabsContent key={category} value={category} className="p-6 space-y-4">
                            {files.map((file, i) => {
                              const FileIcon = getFileIcon(file.path);
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <Card className="shadow-md hover:shadow-lg transition-shadow">
                                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b pb-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <FileIcon className="w-5 h-5 text-violet-600" />
                                          <div>
                                            <h4 className="font-mono text-sm font-semibold">{file.path}</h4>
                                            {file.description && (
                                              <p className="text-xs text-gray-600 mt-1">{file.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={() => copyContent(file.path, file.content)}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            {copied === file.path ? (
                                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                          <Button
                                            onClick={() => downloadFile(file.path, file.content)}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                      <pre className="bg-slate-900 text-gray-100 p-6 text-sm overflow-x-auto max-h-96 m-0">
                                        {file.content}
                                      </pre>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </TabsContent>
                        )
                      ))}

                      <TabsContent value="setup" className="p-6 space-y-6">
                        <Card className="shadow-md">
                          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                            <CardTitle className="text-lg">Setup Instructions</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 prose prose-sm max-w-none">
                            <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                              {scaffold.setup_instructions}
                            </pre>
                          </CardContent>
                        </Card>

                        {scaffold.environment_variables?.length > 0 && (
                          <Card className="shadow-md">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                              <CardTitle className="text-lg">Environment Variables</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="space-y-3">
                                {scaffold.environment_variables.map((env, i) => (
                                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="font-mono font-semibold text-sm text-gray-900 mb-1">
                                      {env.key}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{env.description}</p>
                                    {env.example && (
                                      <code className="text-xs bg-white px-2 py-1 rounded border">
                                        {env.example}
                                      </code>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    </>
                  );
                })()}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}