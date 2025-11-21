import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Network, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const ServiceDocumenter = ({ project, services }) => {
  const [generating, setGenerating] = useState(false);
  const [documentation, setDocumentation] = useState(null);

  const generateServiceDocs = async () => {
    setGenerating(true);
    try {
      const result = await invokeLLM(
        `Generate comprehensive service and architectural documentation for this project.

Project: ${project.name}
Category: ${project.category}
Description: ${project.description}

Services (${services.length}):
${services.map(s => `
- ${s.name} (${s.category})
  Description: ${s.description}
  Technologies: ${s.technologies?.join(', ')}
  APIs: ${s.apis?.length || 0}
  Dependencies: ${s.depends_on?.length || 0}
`).join('\n')}

Generate:
1. Project overview and purpose
2. Architecture overview with service interactions
3. Detailed service descriptions with responsibilities
4. Data flow and communication patterns
5. Technology stack breakdown
6. Deployment architecture
7. Scaling considerations
8. Security model`,
        {
          type: "object",
          properties: {
            project_overview: { type: "string" },
            architecture_summary: { type: "string" },
            service_descriptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  purpose: { type: "string" },
                  responsibilities: { type: "array", items: { type: "string" } },
                  key_features: { type: "array", items: { type: "string" } },
                  dependencies: { type: "array", items: { type: "string" } },
                  scaling_notes: { type: "string" }
                }
              }
            },
            communication_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  protocol: { type: "string" },
                  purpose: { type: "string" }
                }
              }
            },
            tech_stack: {
              type: "object",
              properties: {
                languages: { type: "array", items: { type: "string" } },
                frameworks: { type: "array", items: { type: "string" } },
                databases: { type: "array", items: { type: "string" } },
                infrastructure: { type: "array", items: { type: "string" } }
              }
            },
            deployment_strategy: { type: "string" },
            security_model: { type: "string" }
          }
        }
      );

      setDocumentation(result);

      // Save to Documentation entity
      const markdown = generateMarkdown(result);
      await base44.entities.Documentation.create({
        project_id: project.id,
        doc_type: "architecture",
        content: markdown,
        sections: {
          overview: result.project_overview,
          architecture: result.architecture_summary,
          services: JSON.stringify(result.service_descriptions)
        }
      });

      // Save to Knowledge Base
      await base44.entities.KnowledgeBase.create({
        project_id: project.id,
        title: `Architecture Overview: ${project.name}`,
        content: markdown,
        category: "architecture",
        tags: ["architecture", "services", "documentation", "auto-generated"],
        auto_generated: true,
        is_pinned: true
      });
    } catch (error) {
      console.error("Service doc generation error:", error);
    }
    setGenerating(false);
  };

  const generateMarkdown = (doc) => {
    let md = `# ${project.name} - Architecture Documentation\n\n`;
    md += `## Project Overview\n\n${doc.project_overview}\n\n`;
    md += `## Architecture Summary\n\n${doc.architecture_summary}\n\n`;

    if (doc.service_descriptions?.length > 0) {
      md += `## Service Descriptions\n\n`;
      doc.service_descriptions.forEach(service => {
        md += `### ${service.service_name}\n\n`;
        md += `**Purpose:** ${service.purpose}\n\n`;
        
        if (service.responsibilities?.length > 0) {
          md += `**Responsibilities:**\n`;
          service.responsibilities.forEach(r => md += `- ${r}\n`);
          md += `\n`;
        }

        if (service.key_features?.length > 0) {
          md += `**Key Features:**\n`;
          service.key_features.forEach(f => md += `- ${f}\n`);
          md += `\n`;
        }

        if (service.scaling_notes) {
          md += `**Scaling:** ${service.scaling_notes}\n\n`;
        }
      });
    }

    if (doc.communication_patterns?.length > 0) {
      md += `## Communication Patterns\n\n`;
      doc.communication_patterns.forEach(pattern => {
        md += `- **${pattern.from}** → **${pattern.to}** (${pattern.protocol}): ${pattern.purpose}\n`;
      });
      md += `\n`;
    }

    if (doc.tech_stack) {
      md += `## Technology Stack\n\n`;
      if (doc.tech_stack.languages?.length > 0) {
        md += `**Languages:** ${doc.tech_stack.languages.join(', ')}\n\n`;
      }
      if (doc.tech_stack.frameworks?.length > 0) {
        md += `**Frameworks:** ${doc.tech_stack.frameworks.join(', ')}\n\n`;
      }
      if (doc.tech_stack.databases?.length > 0) {
        md += `**Databases:** ${doc.tech_stack.databases.join(', ')}\n\n`;
      }
    }

    if (doc.deployment_strategy) {
      md += `## Deployment\n\n${doc.deployment_strategy}\n\n`;
    }

    if (doc.security_model) {
      md += `## Security\n\n${doc.security_model}\n\n`;
    }

    return md;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Service & Architecture Documentation
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Generate comprehensive service descriptions and architectural overviews
              </p>
            </div>
            <Button
              onClick={generateServiceDocs}
              disabled={generating || services.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
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
          {/* Overview Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-purple-600">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg">Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">{documentation.project_overview}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-600">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-lg">Architecture Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700">{documentation.architecture_summary}</p>
              </CardContent>
            </Card>
          </div>

          {/* Service Descriptions */}
          {documentation.service_descriptions?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-600" />
                  Service Descriptions ({documentation.service_descriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {documentation.service_descriptions.map((service, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-indigo-50"
                    >
                      <h4 className="font-semibold text-gray-900 text-lg mb-2">
                        {service.service_name}
                      </h4>
                      <p className="text-sm text-gray-700 mb-4">{service.purpose}</p>

                      {service.responsibilities?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Responsibilities</h5>
                          <ul className="space-y-1">
                            {service.responsibilities.map((resp, j) => (
                              <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-indigo-600 mt-0.5">•</span>
                                {resp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {service.key_features?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Key Features</h5>
                          <div className="flex flex-wrap gap-2">
                            {service.key_features.map((feature, j) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {service.dependencies?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Dependencies</h5>
                          <div className="flex flex-wrap gap-2">
                            {service.dependencies.map((dep, j) => (
                              <Badge key={j} className="bg-blue-100 text-blue-800 text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {service.scaling_notes && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <h5 className="text-xs font-semibold text-green-900 mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Scaling Considerations
                          </h5>
                          <p className="text-sm text-green-800">{service.scaling_notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Communication Patterns */}
          {documentation.communication_patterns?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyan-600" />
                  Communication Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {documentation.communication_patterns.map((pattern, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge className="bg-cyan-100 text-cyan-800">{pattern.from}</Badge>
                      <span className="text-gray-400">→</span>
                      <Badge className="bg-blue-100 text-blue-800">{pattern.to}</Badge>
                      <div className="flex-1">
                        <Badge variant="outline" className="text-xs">{pattern.protocol}</Badge>
                        <p className="text-sm text-gray-600 mt-1">{pattern.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tech Stack & Additional Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {documentation.tech_stack && (
              <Card className="border-l-4 border-orange-600">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                  <CardTitle className="text-lg">Technology Stack</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {documentation.tech_stack.languages?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Languages</h5>
                      <div className="flex flex-wrap gap-2">
                        {documentation.tech_stack.languages.map((lang, i) => (
                          <Badge key={i} className="bg-orange-100 text-orange-800">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {documentation.tech_stack.frameworks?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Frameworks</h5>
                      <div className="flex flex-wrap gap-2">
                        {documentation.tech_stack.frameworks.map((fw, i) => (
                          <Badge key={i} className="bg-blue-100 text-blue-800">{fw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {documentation.tech_stack.databases?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Databases</h5>
                      <div className="flex flex-wrap gap-2">
                        {documentation.tech_stack.databases.map((db, i) => (
                          <Badge key={i} className="bg-green-100 text-green-800">{db}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {documentation.deployment_strategy && (
                <Card className="border-l-4 border-green-600">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="text-lg">Deployment</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-700">{documentation.deployment_strategy}</p>
                  </CardContent>
                </Card>
              )}

              {documentation.security_model && (
                <Card className="border-l-4 border-red-600">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                    <CardTitle className="text-lg">Security Model</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-700">{documentation.security_model}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};