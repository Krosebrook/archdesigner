import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

export const TrendForecasting = ({ project, analytics, services }) => {
  const [forecasting, setForecasting] = useState(false);
  const [forecast, setForecast] = useState(null);

  const runForecast = async () => {
    setForecasting(true);
    try {
      const result = await invokeLLM(
        `Analyze trends and forecast future state for this project.

Project: ${project.name}
Services: ${services.length}
Security Findings: ${analytics.security.length}
API Integrations: ${analytics.api.integrations?.length || 0}
Tasks: ${analytics.tasks.length}

Historical Data:
- Security: ${analytics.security.filter(f => f.status === 'open').length} open, ${analytics.security.filter(f => f.severity === 'critical').length} critical
- APIs: ${analytics.api.integrations?.filter(a => a.status === 'active').length || 0} active integrations
- Tasks: ${analytics.tasks.filter(t => t.status === 'completed').length} completed, ${analytics.tasks.filter(t => t.status === 'blocked').length} blocked

Forecast for next 30 days:
1. Project health score trend (current to +30 days, 7 data points)
2. Security posture prediction
3. API performance forecast
4. Task completion velocity
5. Risk factors and recommendations`,
        {
          type: "object",
          properties: {
            health_trend: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  score: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            security_forecast: {
              type: "object",
              properties: {
                predicted_new_findings: { type: "number" },
                resolution_rate: { type: "number" },
                trend: { type: "string" }
              }
            },
            api_forecast: {
              type: "object",
              properties: {
                predicted_response_time: { type: "number" },
                uptime_forecast: { type: "number" },
                trend: { type: "string" }
              }
            },
            task_velocity: {
              type: "object",
              properties: {
                predicted_completion: { type: "number" },
                burndown_rate: { type: "number" }
              }
            },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      );

      setForecast(result);
    } catch (error) {
      console.error("Forecasting error:", error);
    }
    setForecasting(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              AI-Powered Trend Forecasting
            </CardTitle>
            <Button onClick={runForecast} disabled={forecasting}>
              {forecasting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Generate Forecast
            </Button>
          </div>
        </CardHeader>
      </Card>

      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle>30-Day Health Score Projection</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecast.health_trend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Health Score', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
                  <Line type="monotone" dataKey="confidence" stroke="#ef4444" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-red-600">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-lg">Security Forecast</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Predicted New Findings</p>
                    <p className="text-3xl font-bold text-red-600">{forecast.security_forecast.predicted_new_findings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resolution Rate</p>
                    <p className="text-2xl font-bold text-green-600">{forecast.security_forecast.resolution_rate}%</p>
                  </div>
                  <Badge className={
                    forecast.security_forecast.trend === 'improving' ? 'bg-green-100 text-green-900' :
                    forecast.security_forecast.trend === 'stable' ? 'bg-blue-100 text-blue-900' :
                    'bg-red-100 text-red-900'
                  }>
                    {forecast.security_forecast.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-600">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-lg">API Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Predicted Response Time</p>
                    <p className="text-3xl font-bold text-blue-600">{forecast.api_forecast.predicted_response_time}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Uptime Forecast</p>
                    <p className="text-2xl font-bold text-green-600">{forecast.api_forecast.uptime_forecast}%</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-900">{forecast.api_forecast.trend}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-600">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg">Task Velocity</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Predicted Completion</p>
                    <p className="text-3xl font-bold text-green-600">{forecast.task_velocity.predicted_completion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Burndown Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{forecast.task_velocity.burndown_rate}/week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {forecast.risks?.length > 0 && (
            <Card className="border-l-4 border-yellow-600">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {forecast.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {forecast.recommendations?.length > 0 && (
            <Card className="border-l-4 border-green-600">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {forecast.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 font-bold mt-0.5">→</span>
                      {rec}
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