import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Lightbulb, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const insightIcons = {
  suggestion: Lightbulb,
  warning: AlertCircle,
  optimization: CheckCircle2,
  best_practice: Brain
};

const insightColors = {
  suggestion: "bg-blue-50 border-blue-200",
  warning: "bg-orange-50 border-orange-200",
  optimization: "bg-green-50 border-green-200",
  best_practice: "bg-purple-50 border-purple-200"
};

export default function AICollaborationAssistant({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [project?.id]);

  const loadInsights = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.AICollaborationInsight.filter(
        { project_id: project.id },
        '-created_date',
        20
      );
      setInsights(data);
    } catch (error) {
      console.error("Error loading insights:", error);
    }
    setIsLoading(false);
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const servicesContext = services.map(s => `
${s.name}: ${s.description} (${(s.technologies || []).join(', ')})
      `).join('\n');

      const prompt = `You are an AI collaboration assistant for architecture teams. Analyze this project and generate insights to help the team collaborate better.

PROJECT: ${project.name}
SERVICES:
${servicesContext}

Generate 3-5 actionable insights across these types:
- suggestion: Ideas for improvement
- warning: Potential issues to address
- optimization: Performance/efficiency tips
- best_practice: Industry best practices

For each insight provide:
- insight_type
- title: Short, clear title
- description: Detailed explanation
- context: Why this matters now
- actionable_steps: Array of specific actions team can take
- confidence: 0.0-1.0 score

Return as JSON with insights array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  insight_type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  context: { type: "string" },
                  actionable_steps: { type: "array", items: { type: "string" } },
                  confidence: { type: "number" }
                }
              }
            }
          }
        }
      });

      const createPromises = (result.insights || []).map(insight =>
        base44.entities.AICollaborationInsight.create({
          project_id: project.id,
          insight_type: insight.insight_type,
          title: insight.title,
          description: insight.description,
          context: insight.context,
          actionable_steps: insight.actionable_steps || [],
          confidence: insight.confidence || 0.8,
          accepted: false
        })
      );

      await Promise.all(createPromises);
      await loadInsights();
    } catch (error) {
      console.error("Error generating insights:", error);
    }
    setIsGenerating(false);
  };

  const acceptInsight = async (id) => {
    try {
      await base44.entities.AICollaborationInsight.update(id, { accepted: true });
      await loadInsights();
    } catch (error) {
      console.error("Error accepting insight:", error);
    }
  };

  const dismissInsight = async (id) => {
    try {
      await base44.entities.AICollaborationInsight.delete(id);
      await loadInsights();
    } catch (error) {
      console.error("Error dismissing insight:", error);
    }
  };

  const pendingInsights = insights.filter(i => !i.accepted);
  const acceptedInsights = insights.filter(i => i.accepted);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            AI Collaboration Assistant
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Get intelligent suggestions to improve team collaboration
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateInsights}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate AI Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {pendingInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">New Insights</h3>
          {pendingInsights.map((insight, i) => {
            const Icon = insightIcons[insight.insight_type] || Lightbulb;
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`${insightColors[insight.insight_type]} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-white rounded-lg">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                          <Badge variant="outline" className="mb-2">{insight.insight_type}</Badge>
                          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                          <p className="text-xs text-gray-600 italic mb-3">{insight.context}</p>
                          
                          {insight.actionable_steps && insight.actionable_steps.length > 0 && (
                            <div className="bg-white rounded p-3">
                              <p className="text-xs font-semibold text-gray-900 mb-2">Action Steps:</p>
                              <ul className="space-y-1">
                                {insight.actionable_steps.map((step, j) => (
                                  <li key={j} className="text-xs text-gray-700 flex items-start gap-2">
                                    <span className="text-gray-400">{j + 1}.</span>
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button onClick={() => acceptInsight(insight.id)} size="sm" className="bg-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => dismissInsight(insight.id)} size="sm" variant="outline">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {acceptedInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Accepted Insights</h3>
          {acceptedInsights.map((insight) => {
            const Icon = insightIcons[insight.insight_type] || Lightbulb;
            
            return (
              <Card key={insight.id} className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">{insight.title}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}