import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2, Award, Target, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateInsights() {
  const [templates, setTemplates] = useState([]);
  const [insights, setInsights] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadTemplatesAndInsights();
  }, []);

  const loadTemplatesAndInsights = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const allTemplates = await base44.entities.ProjectTemplate.list();
      const myTemplates = allTemplates.filter(t => t.created_by === user.email);
      setTemplates(myTemplates);

      const allInsights = await base44.entities.TemplateInsight.list();
      const insightsMap = {};
      allInsights.forEach(insight => {
        insightsMap[insight.template_id] = insight;
      });
      setInsights(insightsMap);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
    setIsLoading(false);
  };

  const analyzeTemplate = async (template) => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this project template and provide insights on its performance and areas for improvement.

TEMPLATE: ${template.name}
DESCRIPTION: ${template.description}
CATEGORY: ${template.category}
CURRENT USAGE: ${template.usage_count || 0} times
SERVICES: ${template.default_services?.length || 0}

Provide:
1. performance_score: 0-100 based on completeness, best practices, etc.
2. usage_trends: Estimate weekly/monthly usage and growth
3. user_feedback: Estimated success rate, completion time, common modifications
4. improvement_suggestions: Array of areas to improve with impact (low/medium/high)
5. similar_templates: If this is similar to other popular templates

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            performance_score: { type: "number" },
            usage_trends: {
              type: "object",
              properties: {
                weekly_usage: { type: "number" },
                monthly_usage: { type: "number" },
                growth_rate: { type: "number" }
              }
            },
            user_feedback: {
              type: "object",
              properties: {
                success_rate: { type: "number" },
                avg_completion_time: { type: "string" },
                common_modifications: { type: "array", items: { type: "string" } }
              }
            },
            improvement_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  suggestion: { type: "string" },
                  impact: { type: "string" }
                }
              }
            }
          }
        }
      });

      await base44.entities.TemplateInsight.create({
        template_id: template.id,
        performance_score: result.performance_score || 75,
        usage_trends: result.usage_trends || {},
        user_feedback: result.user_feedback || {},
        improvement_suggestions: result.improvement_suggestions || [],
        similar_templates: []
      });

      await loadTemplatesAndInsights();
    } catch (error) {
      console.error("Error analyzing template:", error);
    }
    setIsAnalyzing(false);
  };

  const topTemplates = templates
    .map(t => ({
      ...t,
      score: insights[t.id]?.performance_score || 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const chartData = topTemplates.map(t => ({
    name: t.name.substring(0, 15),
    score: insights[t.id]?.performance_score || 0,
    usage: t.usage_count || 0
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            AI-Powered Template Insights
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Analyze template performance and get AI-driven improvement suggestions
          </p>
        </CardHeader>
      </Card>

      {chartData.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Top Template Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#f59e0b" name="Performance Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Template Analysis</h3>
        {templates.map((template, i) => {
          const insight = insights[template.id];
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      {insight && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-800">
                            <Award className="w-3 h-3 mr-1" />
                            Score: {insight.performance_score}/100
                          </Badge>
                          <Badge variant="outline">{template.usage_count || 0} uses</Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => analyzeTemplate(template)}
                      disabled={isAnalyzing}
                      size="sm"
                      variant="outline"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Target className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {insight && (
                  <CardContent className="space-y-4">
                    {insight.user_feedback && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded p-3">
                          <p className="text-xs text-gray-600">Success Rate</p>
                          <p className="text-2xl font-bold text-green-700">
                            {Math.round(insight.user_feedback.success_rate * 100)}%
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded p-3">
                          <p className="text-xs text-gray-600">Avg Setup Time</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {insight.user_feedback.avg_completion_time}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded p-3">
                          <p className="text-xs text-gray-600">Monthly Usage</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {insight.usage_trends?.monthly_usage || 0}
                          </p>
                        </div>
                      </div>
                    )}

                    {insight.improvement_suggestions && insight.improvement_suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          Improvement Suggestions
                        </h4>
                        <div className="space-y-2">
                          {insight.improvement_suggestions.map((sug, j) => (
                            <div key={j} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{sug.area}</span>
                                <Badge variant="outline">{sug.impact} impact</Badge>
                              </div>
                              <p className="text-xs text-gray-600">{sug.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}