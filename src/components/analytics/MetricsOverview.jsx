import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Code, Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const MetricsOverview = ({ project, analytics, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32 bg-gray-100" />
          </Card>
        ))}
      </div>
    );
  }

  const securityMetrics = {
    total: analytics.security.length,
    critical: analytics.security.filter(f => f.severity === 'critical').length,
    open: analytics.security.filter(f => f.status === 'open').length,
    resolved: analytics.security.filter(f => f.status === 'resolved').length
  };

  const apiMetrics = {
    total: analytics.api.integrations?.length || 0,
    active: analytics.api.integrations?.filter(a => a.status === 'active').length || 0,
    avgResponseTime: analytics.api.integrations?.reduce((sum, i) => sum + (i.metrics?.avg_response_time || 0), 0) / (analytics.api.integrations?.length || 1) || 0
  };

  const taskMetrics = {
    total: analytics.tasks.length,
    completed: analytics.tasks.filter(t => t.status === 'completed').length,
    inProgress: analytics.tasks.filter(t => t.status === 'in_progress').length,
    blocked: analytics.tasks.filter(t => t.status === 'blocked').length
  };

  const healthScore = Math.round(
    ((securityMetrics.resolved / (securityMetrics.total || 1)) * 30) +
    ((apiMetrics.active / (apiMetrics.total || 1)) * 30) +
    ((taskMetrics.completed / (taskMetrics.total || 1)) * 40)
  );

  const severityData = [
    { name: "Critical", value: analytics.security.filter(f => f.severity === 'critical').length, color: "#ef4444" },
    { name: "High", value: analytics.security.filter(f => f.severity === 'high').length, color: "#f97316" },
    { name: "Medium", value: analytics.security.filter(f => f.severity === 'medium').length, color: "#eab308" },
    { name: "Low", value: analytics.security.filter(f => f.severity === 'low').length, color: "#3b82f6" }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Project Health Score</h2>
              <p className="text-blue-100">Unified metrics across all systems</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{healthScore}</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">+12% from last week</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-red-600 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-10 h-10 text-red-600" />
                <Badge className="bg-red-100 text-red-900">{securityMetrics.critical} Critical</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">Security Findings</p>
              <p className="text-3xl font-bold text-gray-900">{securityMetrics.total}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-green-600">{securityMetrics.resolved} resolved</span>
                <span className="text-orange-600">{securityMetrics.open} open</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-blue-600 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Code className="w-10 h-10 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-900">{apiMetrics.active} Active</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">API Integrations</p>
              <p className="text-3xl font-bold text-gray-900">{apiMetrics.total}</p>
              <div className="text-xs text-gray-600 mt-2">
                Avg: {apiMetrics.avgResponseTime.toFixed(0)}ms
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-green-600 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
                <Badge className="bg-green-100 text-green-900">{taskMetrics.completed} Done</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{taskMetrics.total}</p>
              <div className="text-xs text-gray-600 mt-2">
                {taskMetrics.inProgress} in progress
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-l-4 border-purple-600 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-10 h-10 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-900">{analytics.cicd.length} Configs</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">CI/CD Pipelines</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.cicd.length}</p>
              <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Optimized
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Security Findings by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: "Completed", value: taskMetrics.completed, fill: "#10b981" },
                { name: "In Progress", value: taskMetrics.inProgress, fill: "#3b82f6" },
                { name: "Backlog", value: analytics.tasks.filter(t => t.status === 'backlog').length, fill: "#6b7280" },
                { name: "Blocked", value: taskMetrics.blocked, fill: "#ef4444" }
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};