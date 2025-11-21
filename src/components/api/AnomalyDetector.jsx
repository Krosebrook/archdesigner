import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from "recharts";

export const AnomalyDetector = ({ integration, logs }) => {
  const [detecting, setDetecting] = useState(false);
  const [anomalies, setAnomalies] = useState(null);

  const detectAnomalies = async () => {
    setDetecting(true);
    try {
      const timeSeriesData = logs.slice(0, 100).map((log, i) => ({
        index: i,
        response_time: log.response_time,
        status: log.status_code,
        success: log.success,
        timestamp: log.created_date
      }));

      const result = await invokeLLM(
        `Detect anomalies in API performance data using statistical analysis.

API: ${integration.name}
Data Points: ${timeSeriesData.length}

Time Series (index, response_time, status, success):
${timeSeriesData.map(d => `${d.index}, ${d.response_time}ms, ${d.status}, ${d.success}`).join('\n')}

Detect:
1. Response time outliers (>2 standard deviations)
2. Unusual error rate spikes
3. Status code pattern anomalies
4. Request rate irregularities
5. Performance degradation events

For each anomaly provide:
- Timestamp/index
- Metric affected
- Expected vs actual value
- Severity (critical/high/medium/low)
- Potential impact`,
        {
          type: "object",
          properties: {
            anomalies_detected: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  metric: { type: "string" },
                  expected: { type: "number" },
                  actual: { type: "number" },
                  severity: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            baseline_metrics: {
              type: "object",
              properties: {
                avg_response_time: { type: "number" },
                std_dev: { type: "number" },
                p95: { type: "number" },
                p99: { type: "number" }
              }
            },
            patterns: { type: "array", items: { type: "string" } }
          }
        }
      );

      setAnomalies(result);

      await base44.entities.APIAnalytics.create({
        integration_id: integration.id,
        analysis_type: "anomaly",
        anomalies: result.anomalies_detected,
        insights: {
          error_patterns: result.patterns
        }
      });
    } catch (error) {
      console.error("Anomaly detection error:", error);
    }
    setDetecting(false);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-900 border-red-300",
      high: "bg-orange-100 text-orange-900 border-orange-300",
      medium: "bg-yellow-100 text-yellow-900 border-yellow-300",
      low: "bg-blue-100 text-blue-900 border-blue-300"
    };
    return colors[severity?.toLowerCase()] || colors.medium;
  };

  const chartData = logs.slice(0, 50).map((log, i) => ({
    x: i,
    y: log.response_time,
    z: log.success ? 20 : 40,
    fill: log.success ? "#10b981" : "#ef4444"
  }));

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              Anomaly Detection
            </CardTitle>
            <Button onClick={detectAnomalies} disabled={detecting}>
              {detecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Scan for Anomalies
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <XAxis dataKey="x" name="Request" />
              <YAxis dataKey="y" name="Time (ms)" />
              <ZAxis dataKey="z" range={[20, 40]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={chartData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {anomalies && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-l-4 border-blue-600">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="text-lg">Baseline Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Average</p>
                  <p className="text-2xl font-bold text-gray-900">{anomalies.baseline_metrics.avg_response_time}ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Std Dev</p>
                  <p className="text-2xl font-bold text-gray-900">{anomalies.baseline_metrics.std_dev}ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">P95</p>
                  <p className="text-2xl font-bold text-gray-900">{anomalies.baseline_metrics.p95}ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">P99</p>
                  <p className="text-2xl font-bold text-gray-900">{anomalies.baseline_metrics.p99}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {anomalies.anomalies_detected?.length > 0 ? (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Detected Anomalies ({anomalies.anomalies_detected.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {anomalies.anomalies_detected.map((anomaly, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                          <span className="font-semibold text-gray-900">{anomaly.metric}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-600">Expected: </span>
                          <span className="font-mono">{anomaly.expected}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Actual: </span>
                          <span className="font-mono text-red-600">{anomaly.actual}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{anomaly.impact}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-green-600">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">No Anomalies Detected</p>
                <p className="text-gray-600">Your API is performing within normal parameters</p>
              </CardContent>
            </Card>
          )}

          {anomalies.patterns?.length > 0 && (
            <Card className="border-l-4 border-purple-600">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg">Observed Patterns</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {anomalies.patterns.map((pattern, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      {pattern}
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