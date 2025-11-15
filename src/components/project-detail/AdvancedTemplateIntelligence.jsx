import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, TrendingUp, GitMerge } from "lucide-react";
import { motion } from "framer-motion";

export default function AdvancedTemplateIntelligence({ project }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [intelligence, setIntelligence] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.ProjectTemplate.list();
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const analyzeIntelligence = async () => {
    setIsAnalyzing(true);
    try {
      const templatesContext = templates.map(t => `
${t.name} (${t.category}): ${t.usage_count || 0} uses
      `).join('\n');

      const prompt = `Analyze template ecosystem and provide intelligent recommendations.

PROJECT CONTEXT: ${project.name} - ${project.category}
AVAILABLE TEMPLATES:
${templatesContext}

Provide:
1. recommendations: Top 3 templates for this project with scores and reasons
2. evolution_insights: Trends and predictions about template usage
3. merge_suggestions: Templates that could be combined for better results

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template_id: { type: "string" },
                  score: { type: "number" },
                  reasons: { type: "array", items: { type: "string" } }
                }
              }
            },
            evolution_insights: {
              type: "object",
              properties: {
                trends: { type: "array", items: { type: "string" } },
                predictions: { type: "array", items: { type: "string" } }
              }
            },
            merge_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  template_ids: { type: "array", items: { type: "string" } },
                  new_name: { type: "string" },
                  benefits: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newIntel = await base44.entities.TemplateIntelligence.create({
        analysis_type: "recommendation",
        context: project.id,
        recommendations: result.recommendations || [],
        evolution_insights: result.evolution_insights || {},
        merge_suggestions: result.merge_suggestions || []
      });

      setIntelligence(newIntel);
    } catch (error) {
      console.error("Error analyzing intelligence:", error);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Advanced Template Intelligence
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered template recommendations and insights
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzeIntelligence}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Templates...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Template Ecosystem
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {intelligence && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {intelligence.recommendations && intelligence.recommendations.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Recommended Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intelligence.recommendations.map((rec, i) => {
                  const template = templates.find(t => t.id === rec.template_id || t.name.includes(rec.template_id));
                  return (
                    <div key={i} className="border-l-4 border-l-purple-500 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{template?.name || "Template"}</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          Score: {Math.round(rec.score)}/100
                        </Badge>
                      </div>
                      <ul className="text-sm space-y-1">
                        {rec.reasons?.map((reason, j) => (
                          <li key={j} className="text-gray-700">✓ {reason}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {intelligence.evolution_insights && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Evolution Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intelligence.evolution_insights.trends?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-2">Trends:</p>
                    <ul className="text-sm space-y-1">
                      {intelligence.evolution_insights.trends.map((trend, i) => (
                        <li key={i} className="text-blue-800">• {trend}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {intelligence.evolution_insights.predictions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-2">Predictions:</p>
                    <ul className="text-sm space-y-1">
                      {intelligence.evolution_insights.predictions.map((pred, i) => (
                        <li key={i} className="text-blue-800">→ {pred}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {intelligence.merge_suggestions && intelligence.merge_suggestions.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-green-600" />
                  Merge Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intelligence.merge_suggestions.map((sug, i) => (
                  <div key={i} className="bg-white rounded p-3">
                    <h4 className="font-semibold text-green-900 mb-1">{sug.new_name}</h4>
                    <p className="text-sm text-gray-700 mb-2">{sug.benefits}</p>
                    <Badge variant="outline">{sug.template_ids?.length || 0} templates</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}