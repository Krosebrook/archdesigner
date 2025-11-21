import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Code2, GitCompare, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { useCopyToClipboard, downloadFile } from "../shared/FileActions";


export const RefactoringEngine = ({ smell, originalCode, project }) => {
  const [refactoring, setRefactoring] = useState(false);
  const [result, setResult] = useState(null);
  const { copied, copy } = useCopyToClipboard();

  const generateRefactoring = async () => {
    setRefactoring(true);
    try {
      const context = smell ? 
        `Code Smell: ${smell.title}\nIssue: ${smell.description}\nRecommendation: ${smell.recommendation}` :
        `General refactoring request`;

      const refactorResult = await invokeLLM(
        `Refactor this code to address the identified issues and improve quality.
        
        Project Context: ${project.name} (${project.category})
        
        ${context}
        
        Original Code:
        \`\`\`
        ${originalCode}
        \`\`\`
        
        Provide:
        1. Fully refactored code with best practices
        2. Step-by-step explanation of changes
        3. Benefits of the refactoring
        4. Any new patterns introduced
        5. Testing recommendations
        6. Migration notes if breaking changes
        
        Apply SOLID principles, clean code practices, and modern patterns.`,
        {
          type: "object",
          properties: {
            refactored_code: { type: "string" },
            changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  pattern_used: { type: "string" }
                }
              }
            },
            benefits: {
              type: "array",
              items: { type: "string" }
            },
            new_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            testing_recommendations: { type: "string" },
            migration_notes: { type: "string" },
            quality_improvement: { type: "number" }
          }
        }
      );

      setResult(refactorResult);

      // Save to knowledge base
      await base44.entities.KnowledgeBase.create({
        project_id: project.id,
        title: `Refactoring: ${smell?.title || 'Code Improvement'}`,
        content: `# Code Refactoring\n\n## Original Issue\n${smell?.description || 'General code improvement'}\n\n## Changes Made\n${refactorResult.changes.map(c => `### ${c.title}\n${c.description}\n**Pattern:** ${c.pattern_used}`).join('\n\n')}\n\n## Refactored Code\n\`\`\`\n${refactorResult.refactored_code}\n\`\`\`\n\n## Benefits\n${refactorResult.benefits.map(b => `- ${b}`).join('\n')}`,
        category: "best_practices",
        tags: ["refactoring", "ai-generated", "code-quality"],
        auto_generated: true
      });
    } catch (error) {
      console.error("Refactoring error:", error);
    }
    setRefactoring(false);
  };

  return (
    <div className="space-y-6">
      {!result && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Refactor
            </h3>
            <p className="text-gray-600 mb-4">
              AI will analyze and refactor your code using best practices and modern patterns
            </p>
            <Button
              onClick={generateRefactoring}
              disabled={refactoring}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {refactoring ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate Refactored Code
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Quality Improvement */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Quality Improvement</h3>
                  <div className="text-4xl font-bold text-green-600">
                    +{result.quality_improvement}%
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                Refactoring Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {result.changes.map((change, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-l-4 border-indigo-600 pl-4 py-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{change.title}</h4>
                      <Badge variant="outline">{change.pattern_used}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{change.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Comparison */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-indigo-600" />
                  Before & After
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(result.refactored_code, 'refactored')}
                  >
                    {copied === 'refactored' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      'Copy'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadFile('refactored-code.js', result.refactored_code)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="diff">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="diff">Diff View</TabsTrigger>
                  <TabsTrigger value="before">Before</TabsTrigger>
                  <TabsTrigger value="after">After</TabsTrigger>
                </TabsList>
                <TabsContent value="diff" className="m-0">
                  <div className="grid md:grid-cols-2 gap-0 border-t">
                    <div className="border-r">
                      <div className="bg-red-50 px-4 py-2 border-b font-semibold text-sm text-red-900">
                        Original
                      </div>
                      <pre className="bg-red-50/30 text-gray-900 p-4 overflow-x-auto text-xs h-96 overflow-y-auto">
                        <code>{originalCode}</code>
                      </pre>
                    </div>
                    <div>
                      <div className="bg-green-50 px-4 py-2 border-b font-semibold text-sm text-green-900">
                        Refactored
                      </div>
                      <pre className="bg-green-50/30 text-gray-900 p-4 overflow-x-auto text-xs h-96 overflow-y-auto">
                        <code>{result.refactored_code}</code>
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="before" className="m-0">
                  <pre className="bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm">
                    <code>{originalCode}</code>
                  </pre>
                </TabsContent>
                <TabsContent value="after" className="m-0">
                  <pre className="bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm">
                    <code>{result.refactored_code}</code>
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="border-l-4 border-green-600">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg">Benefits</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-2">
                {result.benefits.map((benefit, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* New Patterns */}
          {result.new_patterns?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg">New Patterns Introduced</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {result.new_patterns.map((pattern, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <h4 className="font-semibold text-gray-900 mb-1">{pattern.name}</h4>
                      <p className="text-sm text-gray-600">{pattern.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Testing & Migration */}
          <div className="grid md:grid-cols-2 gap-6">
            {result.testing_recommendations && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardTitle className="text-lg">Testing Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-700">{result.testing_recommendations}</p>
                </CardContent>
              </Card>
            )}
            {result.migration_notes && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardTitle className="text-lg">Migration Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-700">{result.migration_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};