import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Zap,
  AlertTriangle,
  TrendingUp,
  Clock,
  XCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function PerformanceMonitor({ project }) {
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Thresholds for alerts
  const thresholds = {
    page_load_p95: 600, // ms
    action_latency_p95: 500, // ms
    api_latency_p95: 1000, // ms
    error_rate: 1 // percentage
  };

  useEffect(() => {
    loadMetrics();
    
    // Poll for new metrics every 15 seconds
    const interval = setInterval(loadMetrics, 15000);
    return () => clearInterval(interval);
  }, [project?.id]);

  const loadMetrics = async () => {
    try {
      // Load recent metrics (last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const allMetrics = await base44.entities.PerformanceMetric.list('-created_date', 100);
      
      // Filter to last 15 minutes
      const recentMetrics = allMetrics.filter(m => 
        new Date(m.created_date) >= new Date(fifteenMinutesAgo)
      );
      
      setMetrics(recentMetrics);
      
      // Check for threshold breaches
      checkThresholds(recentMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
    setIsLoading(false);
  };

  const checkThresholds = (metricsData) => {
    const newAlerts = [];
    
    // Group by metric type
    const metricTypes = ['page_load', 'action_latency', 'api_latency', 'error_rate'];
    
    metricTypes.forEach(type => {
      const typeMetrics = metricsData.filter(m => m.metric_type === type);
      if (typeMetrics.length === 0) return;
      
      const latestMetric = typeMetrics[0];
      
      if (type === 'error_rate') {
        const errorRate = (latestMetric.error_count / (latestMetric.error_count + latestMetric.success_count)) * 100;
        if (errorRate > thresholds.error_rate) {
          newAlerts.push({
            type: 'error_rate',
            message: `Error rate (${errorRate.toFixed(1)}%) exceeds threshold of ${thresholds.error_rate}%`,
            severity: 'critical',
            metric: latestMetric
          });
        }
      } else {
        const thresholdKey = `${type}_p95`;
        if (latestMetric.p95 && latestMetric.p95 > thresholds[thresholdKey]) {
          newAlerts.push({
            type: type,
            message: `${type.replace('_', ' ')} p95 (${latestMetric.p95}ms) exceeds threshold of ${thresholds[thresholdKey]}ms`,
            severity: 'warning',
            metric: latestMetric
          });
        }
      }
    });
    
    setAlerts(newAlerts);
  };

  const getMetricsByType = (type) => {
    return metrics
      .filter(m => m.metric_type === type)
      .map(m => ({
        time: format(new Date(m.created_date), 'HH:mm:ss'),
        value: m.value,
        p75: m.p75,
        p95: m.p95,
        p99: m.p99
      }))
      .reverse();
  };

  const calculateStats = (type) => {
    const typeMetrics = metrics.filter(m => m.metric_type === type);
    if (typeMetrics.length === 0) return null;
    
    const values = typeMetrics.map(m => m.value);
    const p95Values = typeMetrics.map(m => m.p95).filter(v => v != null);
    
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      p75: typeMetrics[0]?.p75 || 0,
      p95: typeMetrics[0]?.p95 || 0,
      p99: typeMetrics[0]?.p99 || 0,
      count: values.length
    };
  };

  const pageLoadData = getMetricsByType('page_load');
  const actionLatencyData = getMetricsByType('action_latency');
  const apiLatencyData = getMetricsByType('api_latency');
  
  const pageLoadStats = calculateStats('page_load');
  const actionLatencyStats = calculateStats('action_latency');
  const apiLatencyStats = calculateStats('api_latency');
  
  // Calculate error rate
  const errorMetrics = metrics.filter(m => m.metric_type === 'error_rate');
  const errorRate = errorMetrics.length > 0
    ? (errorMetrics[0].error_count / (errorMetrics[0].error_count + errorMetrics[0].success_count)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Real-Time Performance Monitoring
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            15-minute rolling window · Auto-refresh every 15s · All data sanitized (no PII)
          </p>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <Alert key={idx} className={alert.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className={alert.severity === 'critical' ? 'text-red-800' : 'text-orange-800'}>
                <strong>Alert:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-700">Page Load Time</div>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            {pageLoadStats ? (
              <>
                <div className="text-2xl font-bold text-blue-900">{pageLoadStats.p95}ms</div>
                <div className="text-xs text-blue-700 mt-1">p95 · Avg: {pageLoadStats.avg}ms</div>
              </>
            ) : (
              <div className="text-sm text-blue-700">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-700">Action Latency</div>
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            {actionLatencyStats ? (
              <>
                <div className="text-2xl font-bold text-purple-900">{actionLatencyStats.p95}ms</div>
                <div className="text-xs text-purple-700 mt-1">p95 · Avg: {actionLatencyStats.avg}ms</div>
              </>
            ) : (
              <div className="text-sm text-purple-700">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-green-700">API Latency</div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            {apiLatencyStats ? (
              <>
                <div className="text-2xl font-bold text-green-900">{apiLatencyStats.p95}ms</div>
                <div className="text-xs text-green-700 mt-1">p95 · Avg: {apiLatencyStats.avg}ms</div>
              </>
            ) : (
              <div className="text-sm text-green-700">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${errorRate > thresholds.error_rate ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${errorRate > thresholds.error_rate ? 'text-red-700' : 'text-gray-700'}`}>Error Rate</div>
              <XCircle className={`w-4 h-4 ${errorRate > thresholds.error_rate ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
            <div className={`text-2xl font-bold ${errorRate > thresholds.error_rate ? 'text-red-900' : 'text-gray-900'}`}>
              {errorRate.toFixed(2)}%
            </div>
            <div className={`text-xs mt-1 ${errorRate > thresholds.error_rate ? 'text-red-700' : 'text-gray-700'}`}>
              {errorMetrics[0]?.error_count || 0} errors
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Page Load Time Chart */}
        <Card className="bg-white shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg">Page Load Time (15min window)</CardTitle>
          </CardHeader>
          <CardContent>
            {pageLoadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={pageLoadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="p95" stroke="#3b82f6" strokeWidth={2} name="p95" />
                  <Line type="monotone" dataKey="p75" stroke="#93c5fd" strokeWidth={1} name="p75" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Latency Chart */}
        <Card className="bg-white shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg">Action Latency (15min window)</CardTitle>
          </CardHeader>
          <CardContent>
            {actionLatencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={actionLatencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="p95" stroke="#a855f7" strokeWidth={2} name="p95" />
                  <Line type="monotone" dataKey="p75" stroke="#d8b4fe" strokeWidth={1} name="p75" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Threshold Information */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Page Load p95:</span>
              <span className="text-gray-600 ml-2">&lt; {thresholds.page_load_p95}ms</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Action Latency p95:</span>
              <span className="text-gray-600 ml-2">&lt; {thresholds.action_latency_p95}ms</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">API Latency p95:</span>
              <span className="text-gray-600 ml-2">&lt; {thresholds.api_latency_p95}ms</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Error Rate:</span>
              <span className="text-gray-600 ml-2">&lt; {thresholds.error_rate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}