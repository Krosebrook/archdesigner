import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCode2, Loader2, Download, CheckCircle2, Code } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { useCopyToClipboard, downloadFile } from "../shared/FileActions";

export const APIDocGenerator = ({ service, project }) => {
  const [generating, setGenerating] = useState(false);
  const [documentation, setDocumentation] = useState(null);
  const { copied, copy } = useCopyToClipboard();

  const generateAPIDocs = async () => {
    setGenerating(true);
    try {
      const result = await invokeLLM(
        `Generate comprehensive API documentation for this microservice.

Service: ${service.name}
Category: ${service.category}
Description: ${service.description}
Technologies: ${service.technologies?.join(', ')}

APIs:
${JSON.stringify(service.apis || [], null, 2)}

Generate:
1. Complete API reference with all endpoints
2. Request/response schemas with examples
3. Authentication requirements
4. Rate limiting and error codes
5. Code examples in multiple languages (curl, JavaScript, Python)
6. Best practices and usage patterns

Format as markdown with proper sections.`,
        {
          type: "object",
          properties: {
            overview: { type: "string" },
            authentication: {
              type: "object",
              properties: {
                method: { type: "string" },
                description: { type: "string" },
                example: { type: "string" }
              }
            },
            endpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  method: { type: "string" },
                  path: { type: "string" },
                  description: { type: "string" },
                  parameters: { type: "array", items: { type: "object" } },
                  request_body: { type: "string" },
                  response: { type: "string" },
                  status_codes: { type: "array", items: { type: "object" } },
                  example_curl: { type: "string" },
                  example_js: { type: "string" },
                  example_python: { type: "string" }
                }
              }
            },
            error_codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            rate_limiting: { type: "string" },
            best_practices: { type: "array", items: { type: "string" } }
          }
        }
      );

      setDocumentation(result);

      // Save to Documentation entity
      const markdown = generateMarkdown(result);
      await base44.entities.Documentation.create({
        project_id: project.id,
        service_id: service.id,
        doc_type: "api",
        content: markdown,
        sections: {
          overview: result.overview,
          authentication: JSON.stringify(result.authentication),
          api_reference: JSON.stringify(result.endpoints)
        }
      });

      // Save to Knowledge Base
      await base44.entities.KnowledgeBase.create({
        project_id: project.id,
        title: `API Documentation: ${service.name}`,
        content: markdown,
        category: "api_docs",
        tags: ["api", "documentation", service.name, "auto-generated"],
        auto_generated: true,
        source_entity: "Service",
        source_id: service.id
      });
    } catch (error) {
      console.error("API doc generation error:", error);
    }
    setGenerating(false);
  };

  const generateMarkdown = (doc) => {
    let md = `# ${service.name} API Documentation\n\n`;
    md += `${doc.overview}\n\n`;
    
    if (doc.authentication) {
      md += `## Authentication\n\n`;
      md += `**Method:** ${doc.authentication.method}\n\n`;
      md += `${doc.authentication.description}\n\n`;
      md += `\`\`\`\n${doc.authentication.example}\n\`\`\`\n\n`;
    }

    if (doc.endpoints?.length > 0) {
      md += `## API Endpoints\n\n`;
      doc.endpoints.forEach(endpoint => {
        md += `### ${endpoint.method} ${endpoint.path}\n\n`;
        md += `${endpoint.description}\n\n`;
        
        if (endpoint.parameters?.length > 0) {
          md += `**Parameters:**\n\n`;
          endpoint.parameters.forEach(param => {
            md += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
          });
          md += `\n`;
        }

        if (endpoint.request_body) {
          md += `**Request Body:**\n\`\`\`json\n${endpoint.request_body}\n\`\`\`\n\n`;
        }

        if (endpoint.response) {
          md += `**Response:**\n\`\`\`json\n${endpoint.response}\n\`\`\`\n\n`;
        }

        md += `**Examples:**\n\n`;
        if (endpoint.example_curl) {
          md += `\`\`\`bash\n${endpoint.example_curl}\n\`\`\`\n\n`;
        }
        if (endpoint.example_js) {
          md += `\`\`\`javascript\n${endpoint.example_js}\n\`\`\`\n\n`;
        }
        if (endpoint.example_python) {
          md += `\`\`\`python\n${endpoint.example_python}\n\`\`\`\n\n`;
        }
      });
    }

    if (doc.error_codes?.length > 0) {
      md += `## Error Codes\n\n`;
      doc.error_codes.forEach(error => {
        md += `- **${error.code}**: ${error.description}\n`;
      });
      md += `\n`;
    }

    if (doc.rate_limiting) {
      md += `## Rate Limiting\n\n${doc.rate_limiting}\n\n`;
    }

    if (doc.best_practices?.length > 0) {
      md += `## Best Practices\n\n`;
      doc.best_practices.forEach(practice => {
        md += `- ${practice}\n`;
      });
    }

    return md;
  };

  const downloadDocs = () => {
    const markdown = generateMarkdown(documentation);
    downloadFile(`${service.name}-api-docs.md`, markdown);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-blue-600" />
                API Documentation Generator
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Auto-generate comprehensive API docs from service definitions
              </p>
            </div>
            <Button
              onClick={generateAPIDocs}
              disabled={generating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileCode2 className="w-4 h-4 mr-2" />
              )}
              Generate Docs
            </Button>
          </div>
        </CardHeader>
      </Card>

      {documentation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overview */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">{documentation.overview}</p>
            </CardContent>
          </Card>

          {/* Authentication */}
          {documentation.authentication && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div>
                  <Badge className="mb-2">{documentation.authentication.method}</Badge>
                  <p className="text-sm text-gray-700">{documentation.authentication.description}</p>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{documentation.authentication.example}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Endpoints */}
          {documentation.endpoints?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle>API Endpoints ({documentation.endpoints.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(generateMarkdown(documentation), 'docs')}
                    >
                      {copied === 'docs' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : 'Copy'}
                    </Button>
                    <Button size="sm" onClick={downloadDocs}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {documentation.endpoints.map((endpoint, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={
                          endpoint.method === 'GET' ? "bg-green-100 text-green-800" :
                          endpoint.method === 'POST' ? "bg-blue-100 text-blue-800" :
                          endpoint.method === 'PUT' ? "bg-yellow-100 text-yellow-800" :
                          endpoint.method === 'DELETE' ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-semibold text-gray-900">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{endpoint.description}</p>

                      {endpoint.parameters?.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Parameters</h5>
                          <div className="space-y-1">
                            {endpoint.parameters.map((param, j) => (
                              <div key={j} className="text-xs bg-gray-50 p-2 rounded">
                                <code className="text-indigo-700">{param.name}</code>
                                <span className="text-gray-500 mx-2">({param.type})</span>
                                <span className="text-gray-600">{param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(endpoint.request_body || endpoint.response) && (
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          {endpoint.request_body && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-700 mb-1">Request</h5>
                              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                <code>{endpoint.request_body}</code>
                              </pre>
                            </div>
                          )}
                          {endpoint.response && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-700 mb-1">Response</h5>
                              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                <code>{endpoint.response}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <Code className="w-3 h-3" />
                          Code Examples
                        </h5>
                        {endpoint.example_curl && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">cURL</p>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              <code>{endpoint.example_curl}</code>
                            </pre>
                          </div>
                        )}
                        {endpoint.example_js && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">JavaScript</p>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              <code>{endpoint.example_js}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Codes & Best Practices */}
          <div className="grid md:grid-cols-2 gap-6">
            {documentation.error_codes?.length > 0 && (
              <Card className="border-l-4 border-red-600">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="text-lg">Error Codes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {documentation.error_codes.map((error, i) => (
                      <div key={i} className="text-sm">
                        <code className="text-red-700 font-semibold">{error.code}</code>
                        <span className="text-gray-600 ml-2">{error.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {documentation.best_practices?.length > 0 && (
              <Card className="border-l-4 border-green-600">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-lg">Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2">
                    {documentation.best_practices.map((practice, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {practice}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};