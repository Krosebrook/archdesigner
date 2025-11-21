import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2, Sparkles, Download } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import ReactMarkdown from "react-markdown";
import { downloadFile } from "../shared/FileActions";

export const ReleaseNoteGenerator = ({ project, services }) => {
  const [generating, setGenerating] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState(null);

  const generateReleaseNotes = async () => {
    setGenerating(true);
    try {
      // Gather recent project activity
      const [tasks, cicd, flags, docs] = await Promise.all([
        base44.entities.Task.filter({ project_id: project.id }),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }),
        base44.entities.FeatureFlag.filter({ project_id: project.id }),
        base44.entities.KnowledgeBase.filter({ project_id: project.id })
      ]);

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const activeFlags = flags.filter(f => f.status === 'active');

      const result = await invokeLLM(
        `Generate professional release notes for this project.
        
        Project: ${project.name}
        Description: ${project.description}
        Category: ${project.category}
        
        Services (${services.length}):
        ${services.map(s => `- ${s.name}: ${s.description || 'N/A'}`).join('\n')}
        
        Recently Completed Features:
        ${completedTasks.slice(0, 10).map(t => `- ${t.title}: ${t.description || 'N/A'}`).join('\n')}
        
        Active Feature Flags:
        ${activeFlags.map(f => `- ${f.name}: ${f.description}`).join('\n')}
        
        CI/CD Configurations: ${cicd.length} pipelines configured
        Documentation Articles: ${docs.length} articles
        
        Create comprehensive release notes with:
        - Version number suggestion
        - New features
        - Improvements
        - Bug fixes
        - Breaking changes (if any)
        - Upgrade instructions
        Use professional markdown formatting.`,
        {
          type: "object",
          properties: {
            version: { type: "string" },
            release_date: { type: "string" },
            summary: { type: "string" },
            new_features: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            bug_fixes: { type: "array", items: { type: "string" } },
            breaking_changes: { type: "array", items: { type: "string" } },
            upgrade_instructions: { type: "string" },
            full_markdown: { type: "string" }
          }
        }
      );

      setReleaseNotes(result);
    } catch (error) {
      console.error("Generation error:", error);
    }
    setGenerating(false);
  };

  const saveToKnowledgeBase = async () => {
    try {
      await base44.entities.KnowledgeBase.create({
        project_id: project.id,
        title: `Release Notes ${releaseNotes.version}`,
        content: releaseNotes.full_markdown,
        category: "release_notes",
        tags: ["release", releaseNotes.version, "auto-generated"],
        auto_generated: true
      });
      alert("Release notes saved to knowledge base!");
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-600" />
            AI Release Note Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Generate comprehensive release notes based on completed tasks, new features, and project activity.
          </p>
          <Button
            onClick={generateReleaseNotes}
            disabled={generating}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Release Notes
          </Button>
        </CardContent>
      </Card>

      {releaseNotes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Release {releaseNotes.version}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{releaseNotes.release_date}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(`release-notes-${releaseNotes.version}.md`, releaseNotes.full_markdown)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveToKnowledgeBase}
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    Save to KB
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <Badge className="bg-blue-600 mb-2">Summary</Badge>
                <p className="text-gray-700">{releaseNotes.summary}</p>
              </div>

              {releaseNotes.new_features.length > 0 && (
                <div className="mb-6">
                  <Badge className="bg-green-600 mb-2">✨ New Features</Badge>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {releaseNotes.new_features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {releaseNotes.improvements.length > 0 && (
                <div className="mb-6">
                  <Badge className="bg-blue-600 mb-2">🚀 Improvements</Badge>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {releaseNotes.improvements.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}

              {releaseNotes.bug_fixes.length > 0 && (
                <div className="mb-6">
                  <Badge className="bg-yellow-600 mb-2">🐛 Bug Fixes</Badge>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {releaseNotes.bug_fixes.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {releaseNotes.breaking_changes.length > 0 && (
                <div className="mb-6">
                  <Badge className="bg-red-600 mb-2">⚠️ Breaking Changes</Badge>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {releaseNotes.breaking_changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {releaseNotes.upgrade_instructions && (
                <div>
                  <Badge className="bg-purple-600 mb-2">📖 Upgrade Instructions</Badge>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{releaseNotes.upgrade_instructions}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};