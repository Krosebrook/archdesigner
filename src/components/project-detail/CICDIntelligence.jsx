import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Loader2, Zap, Shield, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function CICDIntelligence({ project, services }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, [project?.id]);

  const loadAnalyses = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.CICDIntelligence.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setAnalyses(data);
      if (data.length > 0) {
        setLatestAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Error loading CI/CD analyses:", error);
    }
    setIsLoading(false);
  };

  const analyzePipeline = async () => {
    setIsAnalyzing(true);
    try {
      const servicesContext = services.map(s => `
- ${s.name}: ${(s.technologies || []).join(', ')} (${(s.apis || []).length} APIs)
      `).join('\n');

      const prompt = `You are a CI/CD optimization expert. Analyze potential CI/CD pipeline bottlenecks and provide optimization recommendations for this architecture.

PROJECT: ${project.name}
SERVICES:
${servicesContext}

Provide:
1. Overall pipeline efficiency score (0-100)
2. Identified bottlenecks with stage, issue, impact, and solution
3. Optimization recommendations by category (caching, parallelization, testing, deployment) with:
   - Title and description
   - Estimated time saved
   - Implementation steps
4. Caching strategies for dependencies, build artifacts, and Docker layers
5. Security recommendations for the CI/CD pipeline

Be specific and actionable with real optimization techniques.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            pipeline_efficiency_score: { type: "number" },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  issue: { type: "string" },
                  impact: { type: "string" },
                  solution: { type: "string" }
                }
              }
            },
            optimization_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  estimated_time_saved: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            caching_strategy: {
              type: "object",
              properties: {
                dependencies: { type: "string" },
                build_artifacts: { type: "string" },
                docker_layers: { type: "string" }
              }
            },
            security_recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const newAnalysis = await base44.entities.CICDIntelligence.create({
        project_id: project.id,
        pipeline_efficiency_score: result.pipeline_efficiency_score || 0,
        bottlenecks: result.bottlenecks || [],
        optimization_recommendations: result.optimization_recommendations || [],
        caching_strategy: result.caching_strategy || {},
        security_recommendations: result.security_recommendations || []
      });

      setLatestAnalysis(newAnalysis);
      await loadAnalyses();
    } catch (error) {
      console.error("Error analyzing pipeline:", error);
    }
    setIsAnalyzing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-teal-600" />
            Enhanced CI/CD Intelligence
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Advanced pipeline optimization and bottleneck detection
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzePipeline}
            disabled={isAnalyzing || services.length === 0}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Pipeline...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze CI/CD Efficiency
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Pipeline Efficiency</h3>
                  <p className="text-sm text-gray-500">Overall optimization score</p>
                </div>
                <div className={`text-5xl font-bold ${getScoreColor(latestAnalysis.pipeline_efficiency_score)}`}>
                  {latestAnalysis.pipeline_efficiency_score}
                </div>
              </div>
            </CardContent>
          </Card>

          {latestAnalysis.bottlenecks && latestAnalysis.bottlenecks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Detected Bottlenecks</h3>
              {latestAnalysis.bottlenecks.map((bottleneck, i) => (
                <Card key={i} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{bottleneck.stage}</h4>
                      <Badge className="bg-red-100 text-red-800">{bottleneck.impact} impact</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{bottleneck.issue}</p>
                    <div className="bg-blue-50 rounded p-3">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Solution:</p>
                      <p className="text-xs text-blue-800">{bottleneck.solution}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {latestAnalysis.optimization_recommendations && latestAnalysis.optimization_recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Optimization Recommendations</h3>
              {latestAnalysis.optimization_recommendations.map((rec, i) => (
                <Card key={i} className="bg-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <Badge variant="outline" className="mt-1">{rec.category}</Badge>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Save {rec.estimated_time_saved}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-semibold text-gray-900 mb-1">Implementation:</p>
                      <p className="text-xs text-gray-700">{rec.implementation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {latestAnalysis.caching_strategy && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Zap className="w-5 h-5" />
                  Caching Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">Dependencies:</p>
                  <p className="text-sm text-purple-800">{latestAnalysis.caching_strategy.dependencies}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">Build Artifacts:</p>
                  <p className="text-sm text-purple-800">{latestAnalysis.caching_strategy.build_artifacts}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">Docker Layers:</p>
                  <p className="text-sm text-purple-800">{latestAnalysis.caching_strategy.docker_layers}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {latestAnalysis.security_recommendations && latestAnalysis.security_recommendations.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Shield className="w-5 h-5" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {latestAnalysis.security_recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-900">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}