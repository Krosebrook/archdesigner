import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Activity, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export const APIMonitor = ({ integration }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [integration.id]);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.APILog.filter(
        { integration_id: integration.id },
        '-created_date',
        100
      );
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
    }
    setLoading(false);
  };

  const successRate = logs.length > 0 
    ? (logs.filter(l => l.success).length / logs.length * 100).toFixed(1)
    : 100;

  const avgResponseTime = logs.length > 0
    ? (logs.reduce((sum, l) => sum + l.response_time, 0) / logs.length).toFixed(0)
    : 0;

  const recentLogs = logs.slice(0, 10);
  const chartData = logs.slice(0, 20).reverse().map((log, i) => ({
    name: i + 1,
    time: log.response_time,
    status: log.status_code
  }));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{successRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-3xl font-bold text-blue-600">{avgResponseTime}ms</p>
              </div>
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-purple-600">{logs.length}</p>
              </div>
              <Activity className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Response Time Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge className={
                    log.status_code < 300 ? "bg-green-100 text-green-800" :
                    log.status_code < 400 ? "bg-blue-100 text-blue-800" :
                    log.status_code < 500 ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {log.method}
                  </Badge>
                  <code className="text-sm font-mono">{log.endpoint}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{log.status_code}</Badge>
                  <Badge variant="outline">{log.response_time}ms</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};