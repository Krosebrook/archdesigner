import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Target,
  X
} from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const INSIGHT_TYPES = {
  failure_prediction: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  cost_optimization: {
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  performance_improvement: {
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  },
  efficiency_boost: {
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  reliability_warning: {
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  }
};

export default function ProactiveInsights({ projectId }) {
  const [insights, setInsights] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState([]);

  useEffect(() => {
    if (projectId) {
      analyzeWorkflows();
    }
  }, [projectId]);

  const analyzeWorkflows = async () => {
    setIsAnalyzing(true);
    try {
      // Get workflow executions for the project
      const executions = await base44.entities.WorkflowExecution.filter({ 
        project_id: projectId 
      });

      if (executions.length < 3) {
        setInsights([]);
        setIsAnalyzing(false);
        return;
      }

      // Get workflows
      const workflows = await base44.entities.AgentWorkflow.filter({ 
        project_id: projectId 
      });

      // Analyze patterns and generate insights
      const analysisPrompt = `Analyze these workflow execution patterns and provide proactive insights:

Workflows: ${JSON.stringify(workflows.slice(0, 5))}
Recent Executions: ${JSON.stringify(executions.slice(0, 20))}

Identify:
1. Potential failure patterns (e.g., specific agents failing repeatedly)
2. Cost optimization opportunities (e.g., redundant agent calls)
3. Performance improvements (e.g., slow agents, bottlenecks)
4. Efficiency boosts (e.g., parallel execution opportunities)
5. Reliability warnings (e.g., increasing error rates)

For each insight provide:
- type (failure_prediction, cost_optimization, performance_improvement, efficiency_boost, reliability_warning)
- severity (critical, high, medium, low)
- title (brief, actionable)
- description (what's happening)
- impact (business impact)
- recommendation (specific action)
- estimated_savings (time or cost if applicable)
- confidence_score (0-100)

Return top 5 most actionable insights as JSON array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  recommendation: { type: "string" },
                  estimated_savings: { type: "string" },
                  confidence_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      const generatedInsights = result.insights.map(insight => ({
        ...insight,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      }));

      setInsights(generatedInsights);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze workflows");
    }
    setIsAnalyzing(false);
  };

  const dismissInsight = (insightId) => {
    setDismissedInsights(prev => [...prev, insightId]);
    toast.success("Insight dismissed");
  };

  const applyRecommendation = async (insight) => {
    toast.success(`Applying recommendation: ${insight.title}`);
    // Here you would implement the actual recommendation logic
    dismissInsight(insight.id);
  };

  const activeInsights = insights.filter(
    insight => !dismissedInsights.includes(insight.id)
  );

  const getSeverityBadge = (severity) => {
    const config = {
      critical: { color: "bg-red-600", label: "Critical" },
      high: { color: "bg-orange-600", label: "High" },
      medium: { color: "bg-yellow-600", label: "Medium" },
      low: { color: "bg-blue-600", label: "Low" }
    };
    const { color, label } = config[severity] || config.medium;
    return <Badge className={`${color} text-white`}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Proactive Insights</h3>
          {activeInsights.length > 0 && (
            <Badge className="bg-purple-100 text-purple-800">
              {activeInsights.length} {activeInsights.length === 1 ? 'insight' : 'insights'}
            </Badge>
          )}
        </div>
        <Button
          onClick={analyzeWorkflows}
          disabled={isAnalyzing}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Target className="w-4 h-4" />
              </motion.div>
              Analyzing...
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              Analyze Now
            </>
          )}
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {activeInsights.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  All Clear!
                </h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  {isAnalyzing 
                    ? "Analyzing workflow patterns..."
                    : "No issues detected. Your workflows are running optimally."
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {activeInsights.map((insight, index) => {
              const config = INSIGHT_TYPES[insight.type] || INSIGHT_TYPES.efficiency_boost;
              const Icon = config.icon;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border-2 ${config.borderColor} ${config.bgColor} overflow-hidden`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <motion.div
                            className={`p-2 rounded-lg bg-white shadow-sm`}
                            whileHover={{ scale: 1.05 }}
                          >
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-base text-gray-900">
                                {insight.title}
                              </CardTitle>
                              {getSeverityBadge(insight.severity)}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {insight.description}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="gap-1">
                                <Clock className="w-3 h-3" />
                                Confidence: {insight.confidence_score}%
                              </Badge>
                              {insight.estimated_savings && (
                                <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                                  <TrendingUp className="w-3 h-3" />
                                  Save: {insight.estimated_savings}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => dismissInsight(insight.id)}
                          className="shrink-0 hover:bg-white/50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="bg-white/80 backdrop-blur rounded-lg p-3 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Impact:</p>
                          <p className="text-sm text-gray-600">{insight.impact}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Recommendation:</p>
                          <p className="text-sm text-gray-600">{insight.recommendation}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => applyRecommendation(insight)}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Apply Fix
                        </Button>
                        <Button
                          onClick={() => dismissInsight(insight.id)}
                          variant="outline"
                          size="sm"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

ProactiveInsights.propTypes = {
  projectId: PropTypes.string.isRequired
};