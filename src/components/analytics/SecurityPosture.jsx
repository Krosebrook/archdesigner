import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { format } from "date-fns";

export const SecurityPosture = ({ project, findings }) => {
  const severityCount = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length
  };

  const statusCount = {
    open: findings.filter(f => f.status === 'open').length,
    in_progress: findings.filter(f => f.status === 'in_progress').length,
    resolved: findings.filter(f => f.status === 'resolved').length
  };

  const sourceBreakdown = findings.reduce((acc, f) => {
    acc[f.source] = (acc[f.source] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(sourceBreakdown).map(([source, count]) => ({
    name: source.replace(/_/g, ' '),
    count
  }));

  const timeline = findings
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .reduce((acc, f) => {
      const date = format(new Date(f.created_date), 'MM/dd');
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

  const timelineData = Object.entries(timeline).map(([date, count]) => ({ date, count }));

  const posture = severityCount.critical === 0 && severityCount.high < 3 ? 'strong' :
                  severityCount.critical < 3 ? 'moderate' : 'weak';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 p-8 text-white shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Shield className="w-10 h-10" />
                Security Posture
              </h2>
              <p className="text-blue-100">Real-time vulnerability tracking</p>
            </div>
            <div className="text-center">
              <Badge className={`text-2xl px-6 py-2 ${
                posture === 'strong' ? 'bg-green-600' :
                posture === 'moderate' ? 'bg-yellow-600' : 'bg-red-600'
              }`}>
                {posture.toUpperCase()}
              </Badge>
              <p className="text-sm mt-2">{findings.length} total findings</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(severityCount).map(([severity, count], i) => (
          <motion.div
            key={severity}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border-l-4 ${
              severity === 'critical' ? 'border-red-600' :
              severity === 'high' ? 'border-orange-600' :
              severity === 'medium' ? 'border-yellow-600' : 'border-blue-600'
            }`}>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-600 mb-2 capitalize">{severity}</p>
                <p className="text-4xl font-bold">{count}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Findings by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Discovery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Critical Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {findings
              .filter(f => f.severity === 'critical' || f.severity === 'high')
              .slice(0, 10)
              .map((finding, i) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-l-4 border-red-600 pl-4 py-3 bg-gradient-to-r from-red-50 to-white rounded"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={
                          finding.severity === 'critical' ? 'bg-red-100 text-red-900' : 'bg-orange-100 text-orange-900'
                        }>
                          {finding.severity}
                        </Badge>
                        <Badge variant="outline">{finding.source}</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900">{finding.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                    </div>
                    <Badge className={
                      finding.status === 'open' ? 'bg-red-100 text-red-900' :
                      finding.status === 'in_progress' ? 'bg-yellow-100 text-yellow-900' :
                      'bg-green-100 text-green-900'
                    }>
                      {finding.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};