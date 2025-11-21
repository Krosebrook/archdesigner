import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code, Sparkles, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { useCopyToClipboard } from "../shared/FileActions";

const snippetTypes = [
  { value: "api_endpoint", label: "API Endpoint", icon: "🔌" },
  { value: "database_model", label: "Database Model", icon: "💾" },
  { value: "middleware", label: "Middleware", icon: "🔀" },
  { value: "utility", label: "Utility Function", icon: "🛠️" },
  { value: "error_handler", label: "Error Handler", icon: "⚠️" },
  { value: "validation", label: "Validation Schema", icon: "✅" },
  { value: "test", label: "Test Suite", icon: "🧪" },
  { value: "config", label: "Configuration", icon: "⚙️" }
];

export const SnippetGenerator = ({ project, services }) => {
  const [request, setRequest] = useState("");
  const [generating, setGenerating] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const { copied, copy } = useCopyToClipboard();

  const generateSnippet = async () => {
    if (!request.trim()) return;

    setGenerating(true);
    try {
      // Get project context
      const [cicd, flags, kb] = await Promise.all([
        base44.entities.CICDConfiguration.filter({ project_id: project.id }),
        base44.entities.FeatureFlag.filter({ project_id: project.id }),
        base44.entities.KnowledgeBase.filter({ project_id: project.id })
      ]);

      const result = await invokeLLM(
        `Generate production-ready code snippet for: "${request}"
        
        Project Context:
        - Name: ${project.name}
        - Category: ${project.category}
        - Description: ${project.description}
        
        Services: ${services.map(s => `${s.name} (${s.category}) - ${s.technologies?.join(', ')}`).join('\n')}
        
        Existing Patterns:
        - CI/CD: ${cicd.map(c => c.platform).join(', ')}
        - Feature Flags: ${flags.length} active
        - Documentation: ${kb.length} articles
        
        Return multiple code snippets with:
        - Type (api_endpoint, database_model, middleware, utility, error_handler, validation, test, config)
        - Language/framework
        - Description
        - Code with proper error handling, logging, and best practices
        - Usage example
        - Dependencies needed`,
        {
          type: "object",
          properties: {
            snippets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  language: { type: "string" },
                  framework: { type: "string" },
                  description: { type: "string" },
                  code: { type: "string" },
                  usage_example: { type: "string" },
                  dependencies: { type: "array", items: { type: "string" } },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      );

      setSnippets(result.snippets || []);
      
      // Save to knowledge base
      await base44.entities.KnowledgeBase.create({
        project_id: project.id,
        title: `Code Snippet: ${request}`,
        content: `# Code Snippets for: ${request}\n\n${result.snippets.map(s => `## ${s.title}\n**Type:** ${s.type}\n**Language:** ${s.language}\n\n${s.description}\n\n\`\`\`${s.language}\n${s.code}\n\`\`\`\n\n**Usage:**\n\`\`\`${s.language}\n${s.usage_example}\n\`\`\``).join('\n\n---\n\n')}`,
        category: "best_practices",
        tags: ["code-snippet", "ai-generated", request],
        auto_generated: true
      });
    } catch (error) {
      console.error("Generation error:", error);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            AI Code Snippet Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Describe what you need... (e.g., 'JWT authentication middleware', 'REST API with pagination', 'Error logger with Sentry integration')"
            className="h-24"
          />
          <Button
            onClick={generateSnippet}
            disabled={generating || !request.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Code
          </Button>
        </CardContent>
      </Card>

      {snippets.length > 0 && (
        <div className="space-y-4">
          {snippets.map((snippet, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-l-4 border-indigo-600">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {snippetTypes.find(t => t.value === snippet.type)?.icon || "💻"}
                        </span>
                        <CardTitle className="text-lg">{snippet.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{snippet.language}</Badge>
                        {snippet.framework && (
                          <Badge variant="outline">{snippet.framework}</Badge>
                        )}
                        <Badge className="bg-indigo-100 text-indigo-800">
                          {snippetTypes.find(t => t.value === snippet.type)?.label || snippet.type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copy(snippet.code, `snippet-${i}`)}
                    >
                      {copied === `snippet-${i}` ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-gray-700">{snippet.description}</p>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Code</span>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm">{snippet.code}</code>
                    </pre>
                  </div>

                  {snippet.usage_example && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700 block mb-2">Usage Example</span>
                      <pre className="bg-indigo-50 text-gray-900 rounded-lg p-4 overflow-x-auto border border-indigo-200">
                        <code className="text-sm">{snippet.usage_example}</code>
                      </pre>
                    </div>
                  )}

                  {snippet.dependencies?.length > 0 && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700 block mb-2">Dependencies</span>
                      <div className="flex flex-wrap gap-2">
                        {snippet.dependencies.map((dep, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {snippet.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-900">
                        <strong>Note:</strong> {snippet.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};