import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GitBranch, Loader2, CheckCircle2, Plus, Minus, Code } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const ChangelogGenerator = ({ project }) => {
  const [generating, setGenerating] = useState(false);
  const [changes, setChanges] = useState("");
  const [changelog, setChangelog] = useState(null);

  const generateChangelog = async () => {
    if (!changes.trim()) return;

    setGenerating(true);
    try {
      const result = await invokeLLM(
        `Generate a comprehensive changelog summary from these code changes.

Project: ${project.name}

Changes:
${changes}

Provide:
1. High-level summary of changes
2. Categorized list of changes (features, fixes, improvements, breaking changes)
3. Impact assessment for each change
4. Migration notes if needed
5. Updated documentation sections that need attention

Format as structured changelog.`,
        {
          type: "object",
          properties: {
            summary: { type: "string" },
            version_bump: { type: "string" },
            categories: {
              type: "object",
              properties: {
                features: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string" }
                    }
                  }
                },
                fixes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      issue: { type: "string" }
                    }
                  }
                },
                improvements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      benefit: { type: "string" }
                    }
                  }
                },
                breaking_changes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      migration: { type: "string" }
                    }
                  }
                }
              }
            },
            docs_to_update: { type: "array", items: { type: "string" } },
            testing_recommendations: { type: "string" }
          }
        }
      );

      setChangelog(result);

      // Save to Knowledge Base
      const markdown = generateMarkdown(result);
      await base44.entities.KnowledgeBase.create({
        project_id: project.id,
        title: `Changelog: ${result.version_bump || 'Latest Changes'}`,
        content: markdown,
        category: "release_notes",
        tags: ["changelog", "auto-generated", result.version_bump],
        auto_generated: true
      });
    } catch (error) {
      console.error("Changelog generation error:", error);
    }
    setGenerating(false);
  };

  const generateMarkdown = (log) => {
    let md = `# Changelog\n\n`;
    md += `## ${log.version_bump || 'Version'}\n\n`;
    md += `${log.summary}\n\n`;

    if (log.categories?.features?.length > 0) {
      md += `### ✨ Features\n\n`;
      log.categories.features.forEach(f => {
        md += `- **${f.title}**: ${f.description}\n`;
        if (f.impact) md += `  - Impact: ${f.impact}\n`;
      });
      md += `\n`;
    }

    if (log.categories?.improvements?.length > 0) {
      md += `### 🚀 Improvements\n\n`;
      log.categories.improvements.forEach(i => {
        md += `- **${i.title}**: ${i.description}\n`;
        if (i.benefit) md += `  - Benefit: ${i.benefit}\n`;
      });
      md += `\n`;
    }

    if (log.categories?.fixes?.length > 0) {
      md += `### 🐛 Fixes\n\n`;
      log.categories.fixes.forEach(f => {
        md += `- **${f.title}**: ${f.description}\n`;
        if (f.issue) md += `  - Resolves: ${f.issue}\n`;
      });
      md += `\n`;
    }

    if (log.categories?.breaking_changes?.length > 0) {
      md += `### ⚠️ Breaking Changes\n\n`;
      log.categories.breaking_changes.forEach(bc => {
        md += `- **${bc.title}**: ${bc.description}\n`;
        if (bc.migration) md += `  - Migration: ${bc.migration}\n`;
      });
      md += `\n`;
    }

    if (log.docs_to_update?.length > 0) {
      md += `### 📝 Documentation Updates Needed\n\n`;
      log.docs_to_update.forEach(doc => md += `- ${doc}\n`);
      md += `\n`;
    }

    return md;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-green-600" />
            AI Changelog Generator
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate intelligent summaries from code changes and refactoring tasks
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="changes">Code Changes or Diff</Label>
            <Textarea
              id="changes"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              placeholder="Paste git diff, code changes, or describe refactoring work..."
              className="h-48 font-mono text-sm mt-2"
            />
          </div>
          <Button
            onClick={generateChangelog}
            disabled={generating || !changes.trim()}
            className="bg-gradient-to-r from-green-600 to-emerald-600"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4 mr-2" />
            )}
            Generate Changelog
          </Button>
        </CardContent>
      </Card>

      {changelog && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary */}
          <Card className="border-l-4 border-green-600">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <CardTitle>Summary</CardTitle>
                <Badge className="bg-green-100 text-green-800 text-lg px-3">
                  {changelog.version_bump}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">{changelog.summary}</p>
            </CardContent>
          </Card>

          {/* Features */}
          {changelog.categories?.features?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  New Features ({changelog.categories.features.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {changelog.categories.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-l-4 border-blue-500 pl-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                      {feature.impact && (
                        <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                          <strong>Impact:</strong> {feature.impact}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Improvements */}
          {changelog.categories?.improvements?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  Improvements ({changelog.categories.improvements.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {changelog.categories.improvements.map((improvement, i) => (
                    <div key={i} className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{improvement.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{improvement.description}</p>
                      {improvement.benefit && (
                        <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded">
                          <strong>Benefit:</strong> {improvement.benefit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fixes */}
          {changelog.categories?.fixes?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-green-600" />
                  Bug Fixes ({changelog.categories.fixes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {changelog.categories.fixes.map((fix, i) => (
                    <div key={i} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{fix.title}</h4>
                      <p className="text-sm text-gray-600">{fix.description}</p>
                      {fix.issue && (
                        <p className="text-xs text-green-700 mt-1">Resolves: {fix.issue}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breaking Changes */}
          {changelog.categories?.breaking_changes?.length > 0 && (
            <Card className="border-2 border-red-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Minus className="w-5 h-5" />
                  Breaking Changes ({changelog.categories.breaking_changes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {changelog.categories.breaking_changes.map((change, i) => (
                    <div key={i} className="border-l-4 border-red-500 pl-4 bg-red-50 p-3 rounded">
                      <h4 className="font-semibold text-red-900 mb-1">{change.title}</h4>
                      <p className="text-sm text-red-800 mb-2">{change.description}</p>
                      {change.migration && (
                        <div className="bg-white border border-red-200 p-3 rounded mt-2">
                          <p className="text-xs font-semibold text-red-900 mb-1">Migration Guide:</p>
                          <p className="text-xs text-red-800">{change.migration}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Docs & Testing */}
          <div className="grid md:grid-cols-2 gap-6">
            {changelog.docs_to_update?.length > 0 && (
              <Card className="border-l-4 border-yellow-600">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardTitle className="text-lg">Documentation Updates</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-1">
                    {changelog.docs_to_update.map((doc, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {changelog.testing_recommendations && (
              <Card className="border-l-4 border-indigo-600">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="text-lg">Testing Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-700">{changelog.testing_recommendations}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};