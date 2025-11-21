import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, TrendingUp, Code } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const OptimizationEngine = ({ integration, logs }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const generateRecommendations = async () => {
    setAnalyzing(true);
    try {
      const endpointStats = {};
      logs.forEach(log => {
        if (!endpointStats[log.endpoint]) {
          endpointStats[log.endpoint] = { calls: 0, totalTime: 0, errors: 0 };
        }
        endpointStats[log.endpoint].calls++;
        endpointStats[log.endpoint].totalTime += log.response_time;
        if (!log.success) endpointStats[log.endpoint].errors++;
      });

      const topEndpoints = Object.entries(endpointStats)
        .map(([endpoint, stats]) => ({
          endpoint,
          calls: stats.calls,
          avgTime: (stats.totalTime / stats.calls).toFixed(0),
          errorRate: (stats.errors / stats.calls * 100).toFixed(1)
        }))
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 10);

      const result = await invokeLLM(
        `Analyze API usage patterns and provide optimization recommendations.

API: ${integration.name}
Auth Type: ${integration.auth_type}
Total Requests Analyzed: ${logs.length}

Top Endpoints:
${topEndpoints.map(e => `- ${e.endpoint}: ${e.calls} calls, ${e.avgTime}ms avg, ${e.errorRate}% errors`).join('\n')}

Provide recommendations for:
1. **Caching Strategy**
   - Which endpoints should be cached
   - Cache TTL suggestions
   - Cache invalidation strategy

2. **Rate Limiting**
   - Suggested rate limits per endpoint
   - Throttling strategy

3. **Connection Pooling**
   - Optimal pool size
   - Keep-alive settings

4. **Batch Operations**
   - Endpoints that could be batched
   - Payload optimization

5. **Response Optimization**
   - Pagination strategies
   - Field filtering
   - Compression

6. **Error Handling**
   - Retry strategies
   - Circuit breaker patterns

Prioritize by impact and implementation effort.`,
        {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  implementation: { type: "string" },
                  code_example: { type: "string" },
                  priority: { type: "number" }
                }
              }
            },
            estimated_improvements: {
              type: "object",
              properties: {
                response_time_reduction: { type: "string" },
                cost_savings: { type: "string" },
                capacity_increase: { type: "string" }
              }
            }
          }
        }
      );

      const sorted = result.recommendations.sort((a, b) => b.priority - a.priority);
      setRecommendations({ ...result, recommendations: sorted });

      await base44.entities.APIAnalytics.create({
        integration_id: integration.id,
        analysis_type: "optimization",
        recommendations: sorted,
        insights: {
          slowest_endpoints: topEndpoints.slice(0, 5).map(e => e.endpoint),
          optimization_opportunities: sorted.length
        }
      });
    } catch (error) {
      console.error("Optimization analysis error:", error);
    }
    setAnalyzing(false);
  };

  const getPriorityColor = (priority) => {
    if (priority >= 8) return "bg-red-100 text-red-900";
    if (priority >= 5) return "bg-orange-100 text-orange-900";
    return "bg-blue-100 text-blue-900";
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Optimization Engine
            </CardTitle>
            <Button onClick={generateRecommendations} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate Recommendations
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
          <Card className="border-l-4 border-green-600">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg">Estimated Improvements</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recommendations.estimated_improvements.response_time_reduction}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Capacity Increase</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {recommendations.estimated_improvements.capacity_increase}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Cost Savings</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {recommendations.estimated_improvements.cost_savings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations ({recommendations.recommendations.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recommendations.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="border rounded-lg p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rec.category}</Badge>
                        <Badge className={getPriorityColor(rec.priority)}>
                          Priority: {rec.priority}/10
                        </Badge>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Expected Impact</p>
                        <p className="text-sm text-blue-800">{rec.impact}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 mb-1">Implementation</p>
                        <p className="text-sm text-purple-800">{rec.implementation}</p>
                      </div>
                    </div>

                    {rec.code_example && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-4 h-4 text-gray-600" />
                          <p className="text-xs font-semibold text-gray-700">Code Example</p>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                          <code>{rec.code_example}</code>
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};