import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap, TrendingDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const PipelineAnalyzer = ({ project, cicdConfig }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzePipeline = async () => {
    setAnalyzing(true);
    try {
      const result = await invokeLLM(
        `Analyze this CI/CD pipeline configuration and provide optimization recommendations.

Project: ${project.name} (${project.category})
Platform: ${cicdConfig?.platform || 'Not configured'}

Pipeline Stages:
${JSON.stringify(cicdConfig?.pipeline_stages || {}, null, 2)}

Deployment Targets:
${JSON.stringify(cicdConfig?.deployment_targets || [], null, 2)}

Analyze for:
1. Build time bottlenecks and optimization opportunities
2. Inefficient stage ordering or parallelization potential
3. Cache strategies to reduce build times
4. Resource allocation improvements
5. Security scanning optimizations
6. Test execution efficiency

Provide specific, actionable recommendations with estimated time savings.`,
        {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            estimated_build_time: { type: "string" },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  issue: { type: "string" },
                  impact: { type: "string" },
                  time_cost: { type: "string" }
                }
              }
            },
            optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  implementation: { type: "string" },
                  estimated_savings: { type: "string" },
                  difficulty: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            parallelization_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stages: { type: "array", items: { type: "string" } },
                  benefit: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            caching_strategy: {
              type: "object",
              properties: {
                dependencies: { type: "string" },
                build_artifacts: { type: "string" },
                docker_layers: { type: "string" },
                estimated_improvement: { type: "string" }
              }
            }
          }
        }
      );

      setAnalysis(result);

      // Save to CICDIntelligence entity
      await base44.entities.CICDIntelligence.create({
        project_id: project.id,
        pipeline_efficiency_score: result.overall_score,
        bottlenecks: result.bottlenecks,
        optimization_recommendations: result.optimizations,
        caching_strategy: result.caching_strategy
      });
    } catch (error) {
      console.error("Pipeline analysis error:", error);
    }
    setAnalyzing(false);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800"
    };
    return colors[difficulty?.toLowerCase()] || colors.medium;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300"
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Pipeline Performance Analyzer
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI-powered analysis of build times, bottlenecks, and optimization opportunities
              </p>
            </div>
            <Button
              onClick={analyzePipeline}
              disabled={analyzing || !cicdConfig}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Analyze Pipeline
            </Button>
          </div>
        </CardHeader>
      </Card>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overall Score */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-indigo-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">Pipeline Score</span>
                  <Badge className={analysis.overall_score >= 80 ? "bg-green-100 text-green-800" : analysis.overall_score >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                    {analysis.overall_score >= 80 ? "Excellent" : analysis.overall_score >= 60 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {analysis.overall_score}/100
                </div>
                <Progress value={analysis.overall_score} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-600">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">Estimated Build Time</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {analysis.estimated_build_time}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-600">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-600">Potential Savings</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {analysis.caching_strategy?.estimated_improvement || "30-40%"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottlenecks */}
          {analysis.bottlenecks?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Performance Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.bottlenecks.map((bottleneck, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-l-4 border-red-500 pl-4 py-2"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{bottleneck.stage}</h4>
                        <Badge variant="outline" className="text-red-700">
                          {bottleneck.time_cost}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{bottleneck.issue}</p>
                      <p className="text-sm text-gray-500 italic">{bottleneck.impact}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimizations */}
          {analysis.optimizations?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.optimizations.map((opt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border rounded-lg p-4 hover:border-green-300 hover:bg-green-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{opt.title}</h4>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(opt.priority)}>
                            {opt.priority}
                          </Badge>
                          <Badge className={getDifficultyColor(opt.difficulty)}>
                            {opt.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{opt.description}</p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <h5 className="text-xs font-semibold text-blue-900 mb-1">Implementation</h5>
                        <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono">
                          {opt.implementation}
                        </pre>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Est. Savings: {opt.estimated_savings}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parallelization */}
          {analysis.parallelization_opportunities?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Parallelization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.parallelization_opportunities.map((opp, i) => (
                    <div key={i} className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {opp.stages?.map((stage, j) => (
                          <Badge key={j} className="bg-purple-100 text-purple-800">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opp.benefit}</p>
                      <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                        {opp.implementation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Caching Strategy */}
          {analysis.caching_strategy && (
            <Card className="border-l-4 border-cyan-600">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                  Recommended Caching Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Dependencies</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {analysis.caching_strategy.dependencies}
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Build Artifacts</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {analysis.caching_strategy.build_artifacts}
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Docker Layers</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {analysis.caching_strategy.docker_layers}
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-700">
                      Expected Improvement: {analysis.caching_strategy.estimated_improvement}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};