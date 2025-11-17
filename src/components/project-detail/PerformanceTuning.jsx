import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Loader2, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const severityColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function PerformanceTuning({ project, services }) {
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedService, setSelectedService] = useState("all");

  useEffect(() => {
    loadAnalyses();
  }, [project.id]);

  const loadAnalyses = async () => {
    setIsLoading(true);
    const results = await base44.entities.PerformanceTuning.filter(
      { project_id: project.id },
      '-created_date',
      10
    );
    setAnalyses(results);
    if (results.length > 0) {
      setLatestAnalysis(results[0]);
    }
    setIsLoading(false);
  };

  const runPerformanceAnalysis = async () => {
    setIsAnalyzing(true);

    const serviceContext = selectedService === "all" 
      ? services.map(s => `${s.name}: ${s.description}`).join('\n')
      : services.find(s => s.id === selectedService)?.name || "";

    const prompt = `Perform a comprehensive performance analysis for this microservices architecture:

Project: ${project.name}
Description: ${project.description}
${selectedService === "all" ? 'All Services:' : 'Service:'} 
${serviceContext}

Analyze and provide:
1. Overall performance score (0-100)
2. Executive summary of performance state
3. Identified bottlenecks with:
   - Category (database, network, compute, memory, etc.)
   - Severity (critical/high/medium/low)
   - Description
   - Impact on system
   - Location/component affected
4. Optimization recommendations with:
   - Title
   - Description
   - Expected improvement
   - Implementation complexity
   - Priority
5. Key metrics estimates:
   - Average response time (ms)
   - Throughput (requests/sec)
   - Error rate (%)
   - CPU utilization (%)
   - Memory usage (%)

Focus on realistic microservices performance concerns like service-to-service latency, database queries, caching strategies, and resource utilization.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          analysis_summary: { type: "string" },
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                severity: { type: "string" },
                description: { type: "string" },
                impact: { type: "string" },
                location: { type: "string" }
              }
            }
          },
          optimization_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                expected_improvement: { type: "string" },
                implementation_complexity: { type: "string" },
                priority: { type: "string" }
              }
            }
          },
          metrics: {
            type: "object",
            properties: {
              response_time_ms: { type: "number" },
              throughput: { type: "number" },
              error_rate: { type: "number" },
              cpu_utilization: { type: "number" },
              memory_usage: { type: "number" }
            }
          }
        }
      }
    });

    await base44.entities.PerformanceTuning.create({
      project_id: project.id,
      service_id: selectedService === "all" ? null : selectedService,
      ...result
    });

    await loadAnalyses();
    setIsAnalyzing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              AI Performance Tuning
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.icon} {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={runPerformanceAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-yellow-600 to-orange-600"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!latestAnalysis ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No performance analysis yet</p>
              <p className="text-sm text-gray-400">Run your first analysis to get AI-powered performance insights</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score & Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Performance Score</h3>
                    <div className={`text-4xl font-bold ${getScoreColor(latestAnalysis.overall_score)}`}>
                      {latestAnalysis.overall_score}/100
                    </div>
                  </div>
                  <TrendingUp className={`w-12 h-12 ${getScoreColor(latestAnalysis.overall_score)}`} />
                </div>
                <p className="text-sm text-gray-700">{latestAnalysis.analysis_summary}</p>
              </motion.div>

              {/* Metrics */}
              {latestAnalysis.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(latestAnalysis.metrics).map(([key, value]) => (
                    <div key={key} className="bg-white border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                        {key.includes('rate') || key.includes('utilization') ? '%' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottlenecks */}
              {latestAnalysis.bottlenecks && latestAnalysis.bottlenecks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Performance Bottlenecks
                  </h3>
                  <div className="space-y-3">
                    {latestAnalysis.bottlenecks.map((bottleneck, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={severityColors[bottleneck.severity]}>
                              {bottleneck.severity}
                            </Badge>
                            <span className="font-medium text-gray-900">{bottleneck.category}</span>
                          </div>
                          <span className="text-xs text-gray-500">{bottleneck.location}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{bottleneck.description}</p>
                        <p className="text-xs text-gray-600">
                          <strong>Impact:</strong> {bottleneck.impact}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {latestAnalysis.optimization_recommendations && latestAnalysis.optimization_recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Optimization Recommendations
                  </h3>
                  <div className="space-y-3">
                    {latestAnalysis.optimization_recommendations.map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                          <Badge variant="outline">{rec.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>📈 {rec.expected_improvement}</span>
                          <span>⚙️ {rec.implementation_complexity}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}