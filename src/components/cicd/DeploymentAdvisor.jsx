import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, Shield, Zap, CheckCircle2, Loader2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const DeploymentAdvisor = ({ project, services }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);

  useEffect(() => {
    loadHistoricalData();
  }, [project.id]);

  const loadHistoricalData = async () => {
    try {
      const [cicdAutomations, cicdConfigs] = await Promise.all([
        base44.entities.CICDAutomation.filter({ project_id: project.id }),
        base44.entities.CICDConfiguration.filter({ project_id: project.id })
      ]);

      setHistoricalData({ cicdAutomations, cicdConfigs });
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  };

  const analyzeDeployment = async () => {
    setAnalyzing(true);
    try {
      const historicalContext = historicalData?.cicdAutomations?.length > 0
        ? `Previous deployments: ${JSON.stringify(historicalData.cicdAutomations.slice(0, 3))}`
        : "No historical deployment data available";

      const result = await invokeLLM(
        `Provide deployment best practices and recommendations for this project.

Project: ${project.name} (${project.category})
Status: ${project.status}
Services: ${services.length}

Service Details:
${services.map(s => `- ${s.name}: ${s.category}, ${s.technologies?.join(', ')}`).join('\n')}

${historicalContext}

Analyze and recommend:
1. Optimal deployment strategy (blue-green, canary, rolling, recreate)
2. Rollback mechanisms and safety measures
3. Health check configurations
4. Monitoring and alerting setup
5. Security best practices
6. Performance optimization strategies
7. Cost optimization for cloud deployments

Provide specific, actionable recommendations based on project context.`,
        {
          type: "object",
          properties: {
            recommended_strategy: { type: "string" },
            strategy_rationale: { type: "string" },
            deployment_phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  duration: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  success_criteria: { type: "array", items: { type: "string" } }
                }
              }
            },
            safety_measures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  measure: { type: "string" },
                  implementation: { type: "string" },
                  importance: { type: "string" }
                }
              }
            },
            health_checks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service: { type: "string" },
                  check_type: { type: "string" },
                  endpoint: { type: "string" },
                  frequency: { type: "string" }
                }
              }
            },
            monitoring_setup: {
              type: "object",
              properties: {
                key_metrics: { type: "array", items: { type: "string" } },
                alerting_rules: { type: "array", items: { type: "string" } },
                logging_strategy: { type: "string" }
              }
            },
            security_recommendations: {
              type: "array",
              items: { type: "string" }
            },
            cost_optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  optimization: { type: "string" },
                  estimated_savings: { type: "string" }
                }
              }
            }
          }
        }
      );

      setRecommendations(result);

      // Save to CICDAutomation entity
      await base44.entities.CICDAutomation.create({
        project_id: project.id,
        deployment_strategy: result.recommended_strategy,
        automation_scripts: {},
        deployment_phases: result.deployment_phases,
        monitoring_config: result.monitoring_setup
      });
    } catch (error) {
      console.error("Deployment analysis error:", error);
    }
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                Deployment Strategy Advisor
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered recommendations for safe, efficient deployments
              </p>
            </div>
            <Button
              onClick={analyzeDeployment}
              disabled={analyzing}
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              Generate Plan
            </Button>
          </div>
        </CardHeader>
      </Card>

      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Strategy Overview */}
          <Card className="border-l-4 border-blue-600">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Recommended Strategy: {recommendations.recommended_strategy}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">{recommendations.strategy_rationale}</p>
            </CardContent>
          </Card>

          {/* Deployment Phases */}
          {recommendations.deployment_phases?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle>Deployment Phases</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {recommendations.deployment_phases.map((phase, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-l-4 border-purple-500 pl-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Actions</h5>
                          <ul className="space-y-1">
                            {phase.actions?.map((action, j) => (
                              <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5">→</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Success Criteria</h5>
                          <ul className="space-y-1">
                            {phase.success_criteria?.map((criteria, j) => (
                              <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {criteria}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safety Measures */}
          {recommendations.safety_measures?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Safety Measures & Rollback
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recommendations.safety_measures.map((measure, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{measure.measure}</h4>
                        <Badge className={
                          measure.importance?.toLowerCase() === 'critical' ? "bg-red-100 text-red-800" :
                          measure.importance?.toLowerCase() === 'high' ? "bg-orange-100 text-orange-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {measure.importance}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {measure.implementation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Checks */}
          {recommendations.health_checks?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Health Check Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {recommendations.health_checks.map((check, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h5 className="font-semibold text-gray-900">{check.service}</h5>
                        <p className="text-sm text-gray-600 font-mono">{check.endpoint}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{check.check_type}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{check.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monitoring */}
          {recommendations.monitoring_setup && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Monitoring & Alerting
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {recommendations.monitoring_setup.key_metrics?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Key Metrics to Track</h5>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.monitoring_setup.key_metrics.map((metric, i) => (
                        <Badge key={i} variant="outline">{metric}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.monitoring_setup.alerting_rules?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Alerting Rules</h5>
                    <ul className="space-y-1">
                      {recommendations.monitoring_setup.alerting_rules.map((rule, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">•</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recommendations.monitoring_setup.logging_strategy && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Logging Strategy</h5>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {recommendations.monitoring_setup.logging_strategy}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security & Cost */}
          <div className="grid md:grid-cols-2 gap-6">
            {recommendations.security_recommendations?.length > 0 && (
              <Card className="border-l-4 border-red-600">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2">
                    {recommendations.security_recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {recommendations.cost_optimizations?.length > 0 && (
              <Card className="border-l-4 border-green-600">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    Cost Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {recommendations.cost_optimizations.map((opt, i) => (
                      <div key={i} className="border-l-4 border-green-500 pl-3">
                        <p className="text-sm text-gray-700 mb-1">{opt.optimization}</p>
                        <p className="text-xs font-semibold text-green-700">
                          💰 {opt.estimated_savings}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};