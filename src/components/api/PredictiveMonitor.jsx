import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export const PredictiveMonitor = ({ integration, logs }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);

  const runPredictiveAnalysis = async () => {
    setAnalyzing(true);
    try {
      const recentLogs = logs.slice(0, 100);
      const logsSummary = {
        total: recentLogs.length,
        success_rate: (recentLogs.filter(l => l.success).length / recentLogs.length * 100).toFixed(1),
        avg_response_time: (recentLogs.reduce((sum, l) => sum + l.response_time, 0) / recentLogs.length).toFixed(0),
        errors: recentLogs.filter(l => !l.success).length,
        error_types: [...new Set(recentLogs.filter(l => !l.success).map(l => l.status_code))]
      };

      const result = await invokeLLM(
        `Analyze API performance data and predict future issues.

API: ${integration.name}
Base URL: ${integration.base_url}

Recent Performance (last 100 requests):
- Total Requests: ${logsSummary.total}
- Success Rate: ${logsSummary.success_rate}%
- Avg Response Time: ${logsSummary.avg_response_time}ms
- Errors: ${logsSummary.errors}
- Error Status Codes: ${logsSummary.error_types.join(', ')}

Time Series Data:
${recentLogs.slice(0, 20).map((l, i) => `${i}: ${l.response_time}ms, ${l.status_code}, ${l.success}`).join('\n')}

Predict:
1. Failure probability (0-100) in next 7 days
2. Performance trend (improving/stable/degrading)
3. Expected capacity issues
4. Estimated number of issues in next 7 days
5. Root cause analysis if degrading
6. Recommended preventive actions`,
        {
          type: "object",
          properties: {
            failure_probability: { type: "number" },
            performance_trend: { type: "string" },
            capacity_forecast: { type: "string" },
            estimated_issues_7d: { type: "number" },
            root_causes: { type: "array", items: { type: "string" } },
            preventive_actions: { type: "array", items: { type: "string" } },
            confidence_level: { type: "number" }
          }
        }
      );

      setPredictions(result);

      await base44.entities.APIAnalytics.create({
        integration_id: integration.id,
        analysis_type: "predictive",
        health_score: 100 - result.failure_probability,
        predictions: result
      });
    } catch (error) {
      console.error("Predictive analysis error:", error);
    }
    setAnalyzing(false);
  };

  const getTrendIcon = (trend) => {
    if (trend === "improving") return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === "degrading") return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Activity className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Predictive Monitoring
            </CardTitle>
            <Button onClick={runPredictiveAnalysis} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Run Analysis
            </Button>
          </div>
        </CardHeader>
      </Card>

      {predictions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-purple-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Failure Risk (7d)</p>
                  {getTrendIcon(predictions.performance_trend)}
                </div>
                <p className={`text-4xl font-bold ${
                  predictions.failure_probability < 20 ? 'text-green-600' :
                  predictions.failure_probability < 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {predictions.failure_probability}%
                </p>
                <Badge className="mt-2" variant="outline">
                  {predictions.confidence_level}% confidence
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-600">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Performance Trend</p>
                <div className="flex items-center gap-2">
                  {getTrendIcon(predictions.performance_trend)}
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {predictions.performance_trend}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2">{predictions.capacity_forecast}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-orange-600">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Expected Issues</p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <p className="text-4xl font-bold text-orange-600">
                    {predictions.estimated_issues_7d}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2">Next 7 days</p>
              </CardContent>
            </Card>
          </div>

          {predictions.root_causes?.length > 0 && (
            <Card className="border-l-4 border-red-600">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-lg">Identified Root Causes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {predictions.root_causes.map((cause, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      {cause}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {predictions.preventive_actions?.length > 0 && (
            <Card className="border-l-4 border-green-600">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg">Preventive Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {predictions.preventive_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 font-bold mt-0.5">→</span>
                      {action}
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
};