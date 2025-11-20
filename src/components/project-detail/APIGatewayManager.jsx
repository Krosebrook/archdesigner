import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Network, Loader2, Sparkles, TrendingUp, TrendingDown, 
  Activity, Shield, Zap, DollarSign, Copy, CheckCircle2, Code
} from "lucide-react";
import { motion } from "framer-motion";

export default function APIGatewayManager({ project, services }) {
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGateways();
  }, [project?.id]);

  const loadGateways = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.APIGateway.filter(
        { project_id: project.id },
        '-created_date'
      );
      setGateways(data);
      if (data.length > 0) setSelectedGateway(data[0]);
    } catch (error) {
      console.error("Error loading gateways:", error);
    }
    setIsLoading(false);
  };

  const analyzeTrafficPatterns = async () => {
    setIsAnalyzing(true);
    try {
      const servicesContext = services.map(s => 
        `${s.name}: ${s.category} - ${(s.apis || []).length} endpoints`
      ).join('\n');

      const prompt = `Analyze API Gateway requirements for this microservices project:

PROJECT: ${project.name}
SERVICES:
${servicesContext}

Provide AI-driven insights and recommendations:

1. Traffic Insights:
   - Estimated total_requests per day
   - Predicted avg_latency_ms for each service
   - Expected error_rate percentage
   - Top 5 endpoints by traffic
   - Traffic patterns (peak hours, seasonal trends)

2. Optimizations (5-7 actionable items):
   - Performance improvements (caching, compression, connection pooling)
   - Cost reduction strategies (request batching, efficient routing)
   - Security enhancements (rate limiting, authentication)
   - Scalability recommendations
   
Each optimization should include: category, title, description, impact (high/medium/low), cost_savings estimate, implementation steps

3. Routing Strategy:
   - Recommend optimal strategy: round_robin, least_connections, weighted, ip_hash, or ai_optimized
   - Rationale for recommendation

4. Security Policies:
   - Recommended rate_limiting settings
   - Authentication approach
   - CORS configuration

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            traffic_insights: {
              type: "object",
              properties: {
                total_requests: { type: "number" },
                avg_latency_ms: { type: "number" },
                error_rate: { type: "number" },
                top_endpoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      path: { type: "string" },
                      requests_per_day: { type: "number" },
                      avg_latency: { type: "number" }
                    }
                  }
                },
                traffic_patterns: { type: "array", items: { type: "string" } }
              }
            },
            optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  cost_savings: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            routing_strategy: { type: "string" },
            routing_rationale: { type: "string" },
            security_policies: {
              type: "object",
              properties: {
                rate_limiting: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean" },
                    requests_per_minute: { type: "number" }
                  }
                },
                authentication: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    recommendation: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      const gateway = await base44.entities.APIGateway.create({
        project_id: project.id,
        gateway_name: `${project.name} API Gateway`,
        routing_strategy: result.routing_strategy || "round_robin",
        traffic_insights: result.traffic_insights || {},
        optimizations: result.optimizations || [],
        security_policies: result.security_policies || {}
      });

      setSelectedGateway(gateway);
      await loadGateways();
    } catch (error) {
      console.error("Error analyzing traffic:", error);
    }
    setIsAnalyzing(false);
  };

  const generateGatewayCode = async () => {
    if (!selectedGateway) return;

    setIsGenerating(true);
    try {
      const prompt = `Generate production-ready API Gateway implementation code with:

GATEWAY: ${selectedGateway.gateway_name}
ROUTING: ${selectedGateway.routing_strategy}
SERVICES: ${services.map(s => s.name).join(', ')}

Include:
1. Main gateway server setup (Node.js/Express or Go/Gin)
2. Dynamic routing with service discovery
3. Load balancing implementation
4. Rate limiting and authentication middleware
5. Health checks and circuit breakers
6. Logging and monitoring
7. Error handling and retries
8. WebSocket support for real-time

Generate complete, deployable code with configuration examples.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            gateway_code: { type: "string" },
            config_file: { type: "string" },
            docker_compose: { type: "string" }
          }
        }
      });

      await base44.entities.APIGateway.update(selectedGateway.id, {
        gateway_code: result.gateway_code
      });

      setSelectedGateway({ ...selectedGateway, gateway_code: result.gateway_code });
    } catch (error) {
      console.error("Error generating code:", error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Network className="w-7 h-7 text-white" />
              </div>
              AI-Powered API Gateway
            </CardTitle>
            <p className="text-blue-100 mt-2 text-base">
              Intelligent traffic orchestration with dynamic routing, security, and real-time analytics
            </p>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button
              onClick={analyzeTrafficPatterns}
              disabled={isAnalyzing}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg transition-all duration-300"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Architecture...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze & Generate Gateway Configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {selectedGateway && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Tabs defaultValue="insights" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>

            {/* Traffic Insights */}
            <TabsContent value="insights" className="space-y-4">
              {selectedGateway.traffic_insights && (
                <>
                  <div className="grid md:grid-cols-4 gap-4">
                    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-3xl font-bold text-blue-900">
                            {(selectedGateway.traffic_insights.total_requests || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-700 mt-1">Requests/Day</div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Zap className="w-5 h-5 text-purple-600" />
                            <Badge className="bg-purple-100 text-purple-800 text-xs">Avg</Badge>
                          </div>
                          <div className="text-3xl font-bold text-purple-900">
                            {selectedGateway.traffic_insights.avg_latency_ms || 0}ms
                          </div>
                          <div className="text-sm text-purple-700 mt-1">Latency</div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Card className={`bg-gradient-to-br border ${
                        (selectedGateway.traffic_insights.error_rate || 0) < 1 
                          ? 'from-green-50 to-emerald-50 border-green-200' 
                          : 'from-red-50 to-orange-50 border-red-200'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Shield className={`w-5 h-5 ${
                              (selectedGateway.traffic_insights.error_rate || 0) < 1 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`} />
                            {(selectedGateway.traffic_insights.error_rate || 0) < 1 ? (
                              <TrendingDown className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className={`text-3xl font-bold ${
                            (selectedGateway.traffic_insights.error_rate || 0) < 1 
                              ? 'text-green-900' 
                              : 'text-red-900'
                          }`}>
                            {(selectedGateway.traffic_insights.error_rate || 0).toFixed(2)}%
                          </div>
                          <div className={`text-sm mt-1 ${
                            (selectedGateway.traffic_insights.error_rate || 0) < 1 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>Error Rate</div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <Network className="w-5 h-5 text-orange-600" />
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Active</Badge>
                          </div>
                          <div className="text-3xl font-bold text-orange-900">
                            {services.length}
                          </div>
                          <div className="text-sm text-orange-700 mt-1">Services</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {selectedGateway.traffic_insights.top_endpoints?.length > 0 && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">Top Endpoints</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedGateway.traffic_insights.top_endpoints.map((endpoint, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-mono text-sm font-medium text-gray-900">{endpoint.path}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {endpoint.requests_per_day?.toLocaleString()} req/day
                                </div>
                              </div>
                              <Badge variant="outline">{endpoint.avg_latency}ms</Badge>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedGateway.traffic_insights.traffic_patterns?.length > 0 && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Traffic Patterns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedGateway.traffic_insights.traffic_patterns.map((pattern, i) => (
                            <li key={i} className="flex items-start gap-2 text-blue-800">
                              <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{pattern}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Optimizations */}
            <TabsContent value="optimizations" className="space-y-4">
              {selectedGateway.optimizations?.map((opt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">{opt.title}</h3>
                            <Badge className={
                              opt.impact === 'high' ? 'bg-red-100 text-red-800' :
                              opt.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>{opt.impact} impact</Badge>
                          </div>
                          <Badge variant="outline" className="mb-3">{opt.category}</Badge>
                        </div>
                        {opt.cost_savings && (
                          <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{opt.cost_savings}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4">{opt.description}</p>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Implementation:</p>
                        <p className="text-sm text-gray-600">{opt.implementation}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Security Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Routing Strategy</h3>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <Badge className="bg-blue-600 text-white mb-2">{selectedGateway.routing_strategy}</Badge>
                      <p className="text-sm text-gray-700">
                        Optimal load balancing for your architecture
                      </p>
                    </div>
                  </div>

                  {selectedGateway.security_policies?.rate_limiting && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Rate Limiting</h3>
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={selectedGateway.security_policies.rate_limiting.enabled ? 'bg-green-600' : 'bg-gray-400'}>
                            {selectedGateway.security_policies.rate_limiting.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {selectedGateway.security_policies.rate_limiting.requests_per_minute && (
                            <span className="text-sm text-gray-700">
                              {selectedGateway.security_policies.rate_limiting.requests_per_minute} req/min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGateway.security_policies?.authentication && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Authentication</h3>
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <Badge className="bg-purple-600 text-white mb-2">
                          {selectedGateway.security_policies.authentication.type || 'JWT'}
                        </Badge>
                        <p className="text-sm text-gray-700 mt-2">
                          {selectedGateway.security_policies.authentication.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code */}
            <TabsContent value="code" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-purple-600" />
                      Gateway Implementation
                    </CardTitle>
                    {!selectedGateway.gateway_code && (
                      <Button onClick={generateGatewayCode} disabled={isGenerating} className="bg-purple-600">
                        {isGenerating ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" />Generate Code</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {selectedGateway.gateway_code && (
                  <CardContent>
                    <div className="flex justify-end mb-2">
                      <Button onClick={() => copyToClipboard(selectedGateway.gateway_code)} variant="ghost" size="sm">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-96 shadow-inner">
                      {selectedGateway.gateway_code}
                    </pre>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}