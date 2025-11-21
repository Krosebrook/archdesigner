import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Activity, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const APIPerformance = ({ project, apiData }) => {
  const integrations = apiData.integrations || [];
  const analytics = apiData.analytics || [];

  const avgResponseTime = integrations.reduce((sum, api) => 
    sum + (api.metrics?.avg_response_time || 0), 0) / (integrations.length || 1);

  const successRate = integrations.reduce((sum, api) => 
    sum + (api.metrics?.success_rate || 100), 0) / (integrations.length || 1);

  const totalRequests = integrations.reduce((sum, api) => 
    sum + (api.metrics?.total_requests || 0), 0);

  const chartData = integrations.map(api => ({
    name: api.name,
    response: api.metrics?.avg_response_time || 0,
    requests: api.metrics?.total_requests || 0
  }));

  const healthScore = successRate >= 99 && avgResponseTime < 200 ? 'excellent' :
                      successRate >= 95 && avgResponseTime < 500 ? 'good' : 'needs-attention';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Code className="w-10 h-10" />
                API Performance
              </h2>
              <p className="text-blue-100">Unified monitoring across all integrations</p>
            </div>
            <div className="text-center">
              <Badge className={`text-2xl px-6 py-2 ${
                healthScore === 'excellent' ? 'bg-green-600' :
                healthScore === 'good' ? 'bg-blue-600' : 'bg-yellow-600'
              }`}>
                {healthScore.toUpperCase().replace('-', ' ')}
              </Badge>
              <p className="text-sm mt-2">{integrations.length} APIs monitored</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-l-4 border-blue-600">
            <CardContent className="p-6 text-center">
              <Activity className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
              <p className="text-4xl font-bold text-blue-600">{avgResponseTime.toFixed(0)}ms</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-green-600">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className="text-4xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-purple-600">
            <CardContent className="p-6 text-center">
              <Zap className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Total Requests</p>
              <p className="text-4xl font-bold text-purple-600">{totalRequests.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Response Times by API</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="response" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.slice(0, 5).map((analytic, i) => (
                <motion.div
                  key={analytic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-l-4 border-blue-600 pl-4 py-3 bg-gradient-to-r from-blue-50 to-white rounded"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{analytic.analysis_type}</Badge>
                    {analytic.health_score && (
                      <Badge className="bg-blue-100 text-blue-900">
                        Score: {analytic.health_score}
                      </Badge>
                    )}
                  </div>
                  {analytic.recommendations?.length > 0 && (
                    <p className="text-sm text-gray-700 mt-2">
                      {analytic.recommendations.length} recommendations available
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};