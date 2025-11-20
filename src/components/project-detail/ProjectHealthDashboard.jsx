import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  XCircle, Clock, Zap, Shield, GitBranch, Code, Network, Cpu
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

const COLORS = {
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  purple: "#a855f7",
  teal: "#14b8a6"
};

export default function ProjectHealthDashboard({ project, services }) {
  const [isLoading, setIsLoading] = useState(true);
  const [healthData, setHealthData] = useState({
    overall_score: 0,
    status: "loading",
    cicd_health: null,
    security_health: null,
    performance_health: null,
    gateway_health: null,
    risks: [],
    recommendations: []
  });

  useEffect(() => {
    loadHealthData();
  }, [project?.id]);

  const loadHealthData = async () => {
    if (!project?.id) return;

    setIsLoading(true);
    try {
      // Fetch all relevant data in parallel
      const [
        validationReports,
        cicdConfigs,
        codeReviews,
        apiGateways,
        performanceTunings,
        documentation
      ] = await Promise.all([
        base44.entities.ValidationReport.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.CodeReview.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.APIGateway.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.PerformanceTuning.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.Documentation.filter({ project_id: project.id, sync_status: "outdated" })
      ]);

      // Calculate overall health score
      const validationScore = validationReports[0]?.overall_score || 0;
      const codeReviewScore = codeReviews[0]?.overall_score || 0;
      const performanceScore = performanceTunings[0]?.overall_score || 0;
      
      const overall_score = Math.round((validationScore + codeReviewScore + performanceScore) / 3);

      // CI/CD Health
      const cicd_health = cicdConfigs[0] ? {
        configured: true,
        platform: cicdConfigs[0].platform,
        stages: cicdConfigs[0].pipeline_stages,
        success_rate: 94, // Mock data - would come from actual pipeline runs
        avg_build_time: 8.5,
        failed_builds: 3
      } : null;

      // Security Health
      const security_health = codeReviews[0] ? {
        vulnerabilities: {
          critical: codeReviews[0].findings?.filter(f => f.severity === 'critical').length || 0,
          high: codeReviews[0].findings?.filter(f => f.severity === 'high').length || 0,
          medium: codeReviews[0].findings?.filter(f => f.severity === 'medium').length || 0,
          low: codeReviews[0].findings?.filter(f => f.severity === 'low').length || 0
        },
        security_score: 100 - ((codeReviews[0].findings?.length || 0) * 5)
      } : null;

      // Performance Health
      const performance_health = performanceTunings[0] ? {
        score: performanceTunings[0].overall_score,
        bottlenecks: performanceTunings[0].bottlenecks?.length || 0,
        avg_latency: performanceTunings[0].metrics?.response_time_ms || 0,
        throughput: performanceTunings[0].metrics?.throughput || 0
      } : null;

      // Gateway Health
      const gateway_health = apiGateways[0] ? {
        total_requests: apiGateways[0].traffic_insights?.total_requests || 0,
        avg_latency: apiGateways[0].traffic_insights?.avg_latency_ms || 0,
        error_rate: apiGateways[0].traffic_insights?.error_rate || 0,
        routing_strategy: apiGateways[0].routing_strategy
      } : null;

      // Compile Risks
      const risks = [];
      
      if (validationReports[0]?.critical_count > 0) {
        risks.push({
          level: "critical",
          title: "Critical Architecture Issues",
          description: `${validationReports[0].critical_count} critical issues detected in validation`,
          source: "Architecture Validation"
        });
      }

      if (security_health?.vulnerabilities.critical > 0) {
        risks.push({
          level: "critical",
          title: "Critical Security Vulnerabilities",
          description: `${security_health.vulnerabilities.critical} critical vulnerabilities found`,
          source: "Security Scan"
        });
      }

      if (documentation.length > 0) {
        risks.push({
          level: "warning",
          title: "Outdated Documentation",
          description: `${documentation.length} documentation files need updating`,
          source: "Documentation Sync"
        });
      }

      if (performance_health?.bottlenecks > 0) {
        risks.push({
          level: "warning",
          title: "Performance Bottlenecks",
          description: `${performance_health.bottlenecks} bottlenecks identified`,
          source: "Performance Analysis"
        });
      }

      // Compile Recommendations
      const recommendations = [];

      if (apiGateways[0]?.optimizations) {
        apiGateways[0].optimizations.slice(0, 3).forEach(opt => {
          recommendations.push({
            priority: opt.impact,
            title: opt.title,
            description: opt.description,
            impact: opt.cost_savings || opt.impact
          });
        });
      }

      if (performanceTunings[0]?.optimization_recommendations) {
        performanceTunings[0].optimization_recommendations.slice(0, 3).forEach(rec => {
          recommendations.push({
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            impact: rec.expected_improvement
          });
        });
      }

      setHealthData({
        overall_score,
        status: overall_score >= 80 ? "healthy" : overall_score >= 60 ? "warning" : "critical",
        cicd_health,
        security_health,
        performance_health,
        gateway_health,
        risks: risks.slice(0, 5),
        recommendations: recommendations.slice(0, 6)
      });

    } catch (error) {
      console.error("Error loading health data:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Activity className="w-12 h-12 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  const securityChartData = healthData.security_health ? [
    { name: "Critical", value: healthData.security_health.vulnerabilities.critical, color: COLORS.error },
    { name: "High", value: healthData.security_health.vulnerabilities.high, color: COLORS.warning },
    { name: "Medium", value: healthData.security_health.vulnerabilities.medium, color: COLORS.info },
    { name: "Low", value: healthData.security_health.vulnerabilities.low, color: "#94a3b8" }
  ].filter(d => d.value > 0) : [];

  const performanceChartData = [
    { metric: "Latency", value: healthData.performance_health?.avg_latency || 0, target: 100 },
    { metric: "Throughput", value: healthData.performance_health?.throughput || 0, target: 1000 },
    { metric: "Error Rate", value: healthData.gateway_health?.error_rate || 0, target: 1 }
  ];

  const healthStatus = {
    healthy: { color: "from-green-500 to-emerald-600", icon: CheckCircle2, text: "Healthy", glow: "green" },
    warning: { color: "from-yellow-500 to-orange-600", icon: AlertTriangle, text: "Needs Attention", glow: "yellow" },
    critical: { color: "from-red-500 to-pink-600", icon: XCircle, text: "Critical Issues", glow: "red" }
  }[healthData.status];

  return (
    <div className="space-y-6">
      {/* Hero Health Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={`bg-gradient-to-br ${healthStatus.color} border-0 shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-3xl" />
          <div className={`absolute top-0 right-0 w-96 h-96 bg-${healthStatus.glow}-400 rounded-full blur-3xl opacity-20`} />
          
          <CardContent className="p-12 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 mb-4"
                >
                  <healthStatus.icon className="w-12 h-12 text-white" />
                  <div>
                    <h2 className="text-4xl font-bold text-white">{project.name}</h2>
                    <p className="text-xl text-white/80 mt-1">{healthStatus.text}</p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-4 gap-6 mt-8"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="w-4 h-4 text-white/80" />
                      <span className="text-sm text-white/80">Services</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{services.length}</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-4 h-4 text-white/80" />
                      <span className="text-sm text-white/80">CI/CD</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {healthData.cicd_health?.success_rate || 0}%
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-white/80" />
                      <span className="text-sm text-white/80">Security</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {healthData.security_health?.security_score || 0}
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-white/80" />
                      <span className="text-sm text-white/80">Performance</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {healthData.performance_health?.score || 0}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="white"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 85}`}
                    strokeDashoffset={2 * Math.PI * 85 * (1 - healthData.overall_score / 100)}
                    transform="rotate(-90 100 100)"
                    initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - healthData.overall_score / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white">{healthData.overall_score}</div>
                    <div className="text-sm text-white/80 mt-1">Health Score</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CI/CD Pipeline Health */}
        {healthData.cicd_health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-teal-600" />
                  CI/CD Pipeline Health
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <Badge className="bg-green-100 text-green-800">{healthData.cicd_health.success_rate}%</Badge>
                  </div>
                  <Progress value={healthData.cicd_health.success_rate} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600">Avg Build Time</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{healthData.cicd_health.avg_build_time}m</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-gray-600">Failed Builds</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{healthData.cicd_health.failed_builds}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Pipeline Stages</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(healthData.cicd_health.stages || {}).map(([stage, config]) => (
                        config.enabled && (
                          <Badge key={stage} variant="outline" className="bg-blue-50 text-blue-700">
                            {stage}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Security Overview */}
        {healthData.security_health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Security Vulnerabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {securityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={securityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {securityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">No vulnerabilities detected</p>
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {Object.entries(healthData.security_health.vulnerabilities).map(([level, count]) => (
                    <div key={level} className="text-center">
                      <div className={`text-2xl font-bold ${
                        level === 'critical' ? 'text-red-600' :
                        level === 'high' ? 'text-orange-600' :
                        level === 'medium' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>{count}</div>
                      <div className="text-xs text-gray-500 capitalize">{level}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Performance Metrics */}
        {healthData.performance_health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="target" fill="#e2e8f0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Bottlenecks Identified</div>
                    <div className="text-3xl font-bold text-gray-900">{healthData.performance_health.bottlenecks}</div>
                  </div>
                  <Badge className={`${
                    healthData.performance_health.score >= 80 ? 'bg-green-100 text-green-800' :
                    healthData.performance_health.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {healthData.performance_health.score}/100
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Gateway Health */}
        {healthData.gateway_health && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-600" />
                  API Gateway
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {(healthData.gateway_health.total_requests / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Requests/Day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {healthData.gateway_health.avg_latency}ms
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Avg Latency</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      healthData.gateway_health.error_rate < 1 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {healthData.gateway_health.error_rate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Error Rate</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Routing Strategy</span>
                    <Badge variant="outline" className="capitalize">
                      {healthData.gateway_health.routing_strategy.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Risks & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Identified Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {healthData.risks.length > 0 ? (
                <div className="space-y-3">
                  {healthData.risks.map((risk, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        risk.level === 'critical' 
                          ? 'bg-red-50 border-red-500' 
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{risk.title}</h4>
                        <Badge className={
                          risk.level === 'critical' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {risk.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
                      <div className="text-xs text-gray-500">{risk.source}</div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">No risks identified</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-teal-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {healthData.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {healthData.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <Badge className={
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      {rec.impact && (
                        <div className="text-xs text-green-600 font-medium">Impact: {rec.impact}</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Cpu className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">No recommendations available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}