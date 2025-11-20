import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rocket, Loader2, Copy, CheckCircle2, AlertTriangle, Activity, 
  PlayCircle, StopCircle, GitBranch, Download, Zap, Shield
} from "lucide-react";
import { motion } from "framer-motion";

export default function CICDAutomationEngine({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState("blue_green");
  const [environment, setEnvironment] = useState("staging");
  const [platform, setPlatform] = useState("kubernetes");
  const [automation, setAutomation] = useState(null);
  const [deploymentScripts, setDeploymentScripts] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    loadExistingAutomation();
  }, [project?.id]);

  const loadExistingAutomation = async () => {
    if (!project?.id) return;
    try {
      const data = await base44.entities.CICDAutomation.filter(
        { project_id: project.id },
        '-created_date',
        1
      );
      if (data.length > 0) {
        setAutomation(data[0]);
        setStrategy(data[0].deployment_strategy);
      }
    } catch (error) {
      console.error("Error loading automation:", error);
    }
  };

  const generateAutomation = async () => {
    setIsGenerating(true);
    try {
      const cicdConfigs = await base44.entities.CICDConfiguration.filter(
        { project_id: project.id },
        '-created_date',
        1
      );

      const cicdPlatform = cicdConfigs.length > 0 ? cicdConfigs[0].platform : 'github_actions';

      const prompt = `Generate comprehensive CI/CD automation for zero-downtime deployments:

PROJECT: ${project.name}
SERVICES: ${services.map(s => s.name).join(', ')}
STRATEGY: ${strategy}
PLATFORM: ${platform}
CI/CD: ${cicdPlatform}
ENVIRONMENT: ${environment}

Generate production-ready automation with:

1. DEPLOYMENT SCRIPTS (staging & production):
   - Pre-deployment validation
   - Database migrations
   - Service deployment with rolling updates
   - Post-deployment verification
   - Traffic switching (for blue-green)
   - Canary analysis (for canary)

2. ROLLBACK SCRIPTS:
   - Automatic rollback on health check failures
   - Manual rollback procedure
   - State restoration
   - Database rollback

3. HEALTH CHECK SCRIPTS:
   - HTTP endpoint checks
   - Database connectivity
   - Service dependencies
   - Performance thresholds
   - Return codes: 0=healthy, 1=degraded, 2=critical

4. SMOKE TEST SCRIPTS:
   - Critical path testing
   - API response validation
   - Integration tests
   - Performance benchmarks

5. MONITORING CONFIG:
   - Key metrics (latency, error rate, throughput, CPU, memory)
   - Alert thresholds with severity levels
   - Notification channels
   - Auto-rollback triggers

6. DEPLOYMENT PHASES:
   - Phase name, duration, actions, success criteria, rollback triggers
   - Include traffic percentage for canary

Make scripts production-ready with error handling, logging, and idempotency.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            automation_scripts: {
              type: "object",
              properties: {
                deploy_staging: { type: "string" },
                deploy_production: { type: "string" },
                rollback: { type: "string" },
                health_check: { type: "string" },
                smoke_test: { type: "string" }
              }
            },
            deployment_phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  duration: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  success_criteria: { type: "string" },
                  rollback_trigger: { type: "string" },
                  traffic_percentage: { type: "number" }
                }
              }
            },
            monitoring_config: {
              type: "object",
              properties: {
                metrics: { 
                  type: "array", 
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      threshold: { type: "string" },
                      severity: { type: "string" }
                    }
                  }
                },
                alerts: { 
                  type: "array", 
                  items: {
                    type: "object",
                    properties: {
                      condition: { type: "string" },
                      action: { type: "string" },
                      auto_rollback: { type: "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const newAutomation = await base44.entities.CICDAutomation.create({
        project_id: project.id,
        deployment_strategy: strategy,
        automation_scripts: result.automation_scripts || {},
        deployment_phases: result.deployment_phases || [],
        monitoring_config: result.monitoring_config || {}
      });

      setAutomation(newAutomation);
      setDeploymentScripts(result.automation_scripts);
    } catch (error) {
      console.error("Error generating automation:", error);
    }
    setIsGenerating(false);
  };

  const copyScript = (scriptName, content) => {
    navigator.clipboard.writeText(content);
    setCopied(scriptName);
    setTimeout(() => setCopied(""), 2000);
  };

  const downloadScript = (scriptName, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptName}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllScripts = () => {
    if (!automation?.automation_scripts) return;
    Object.entries(automation.automation_scripts).forEach(([name, content]) => {
      downloadScript(name, content);
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Rocket className="w-7 h-7 text-white" />
              </motion.div>
              Zero-Downtime Deployment Engine
            </CardTitle>
            <p className="text-emerald-100 mt-2 text-base">
              Automated deployment scripts with health monitoring and instant rollback
            </p>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-emerald-200 mb-2 block">Deployment Strategy</label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue_green">Blue-Green Deployment</SelectItem>
                    <SelectItem value="canary">Canary Release</SelectItem>
                    <SelectItem value="rolling">Rolling Update</SelectItem>
                    <SelectItem value="recreate">Recreate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-emerald-200 mb-2 block">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kubernetes">Kubernetes</SelectItem>
                    <SelectItem value="docker_swarm">Docker Swarm</SelectItem>
                    <SelectItem value="aws_ecs">AWS ECS</SelectItem>
                    <SelectItem value="azure_aks">Azure AKS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-emerald-200 mb-2 block">Environment</label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateAutomation}
              disabled={isGenerating}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg transition-all duration-300"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Automation...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Generate Deployment Automation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {automation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Tabs defaultValue="scripts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
              <TabsTrigger value="scripts">
                <GitBranch className="w-4 h-4 mr-2" />
                Scripts
              </TabsTrigger>
              <TabsTrigger value="phases">
                <Activity className="w-4 h-4 mr-2" />
                Phases
              </TabsTrigger>
              <TabsTrigger value="monitoring">
                <Shield className="w-4 h-4 mr-2" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="rollback">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Rollback
              </TabsTrigger>
            </TabsList>

            {/* Scripts Tab */}
            <TabsContent value="scripts" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deployment Scripts</h3>
                <Button onClick={downloadAllScripts} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>

              {Object.entries(automation.automation_scripts || {}).map(([name, script]) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ease: [0.4, 0, 0.2, 1] }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Badge className={
                            name.includes('deploy') ? 'bg-green-600' :
                            name.includes('rollback') ? 'bg-red-600' :
                            name.includes('health') ? 'bg-blue-600' :
                            'bg-purple-600'
                          }>{name.replace(/_/g, ' ').toUpperCase()}</Badge>
                          {name.includes('production') && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Production
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => copyScript(name, script)} size="sm" variant="ghost">
                            {copied === name ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button onClick={() => downloadScript(name, script)} size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <pre className="bg-slate-900 text-gray-100 p-6 text-sm overflow-x-auto max-h-96 m-0 rounded-b-lg">
                        {script}
                      </pre>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Phases Tab */}
            <TabsContent value="phases" className="space-y-4">
              {automation.deployment_phases && automation.deployment_phases.length > 0 ? (
                automation.deployment_phases.map((phase, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="shadow-lg border-l-4 border-l-emerald-500">
                      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <PlayCircle className="w-5 h-5 text-emerald-600" />
                              Phase {i + 1}: {phase.phase}
                            </CardTitle>
                            {phase.traffic_percentage && (
                              <Badge className="mt-2 bg-blue-600">
                                Traffic: {phase.traffic_percentage}%
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-white">
                            <Clock className="w-3 h-3 mr-1" />
                            {phase.duration}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Actions</h4>
                          <ul className="space-y-1">
                            {phase.actions?.map((action, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {phase.success_criteria && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-green-900 mb-1">Success Criteria</p>
                            <p className="text-sm text-green-800">{phase.success_criteria}</p>
                          </div>
                        )}

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-orange-900">Rollback Trigger</p>
                              <p className="text-sm text-orange-800 mt-1">{phase.rollback_trigger}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    No deployment phases configured
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Health Monitoring Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {automation.monitoring_config?.metrics && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Monitored Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {automation.monitoring_config.metrics.map((metric, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{metric.name || metric}</p>
                                {metric.threshold && (
                                  <p className="text-sm text-gray-600 mt-1">Threshold: {metric.threshold}</p>
                                )}
                              </div>
                              {metric.severity && (
                                <Badge className={
                                  metric.severity === 'critical' ? 'bg-red-600' :
                                  metric.severity === 'warning' ? 'bg-yellow-600' :
                                  'bg-blue-600'
                                }>{metric.severity}</Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {automation.monitoring_config?.alerts && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Alert Rules</h3>
                      <div className="space-y-3">
                        {automation.monitoring_config.alerts.map((alert, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-lg p-4 border-2 border-orange-200 shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <Zap className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{alert.condition || alert}</p>
                                {alert.action && (
                                  <p className="text-sm text-gray-600 mt-1">Action: {alert.action}</p>
                                )}
                                {alert.auto_rollback && (
                                  <Badge className="mt-2 bg-red-100 text-red-800">
                                    <StopCircle className="w-3 h-3 mr-1" />
                                    Auto-Rollback Enabled
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rollback Tab */}
            <TabsContent value="rollback" className="space-y-4">
              <Card className="shadow-lg border-l-4 border-l-red-500">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="w-5 h-5" />
                    Automated Rollback Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Rollback Triggers
                    </h3>
                    <ul className="space-y-2">
                      {automation.deployment_phases?.map((phase, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                          <StopCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span><strong>{phase.phase}:</strong> {phase.rollback_trigger}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {automation.automation_scripts?.rollback && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-900">Rollback Script</h3>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => copyScript('rollback', automation.automation_scripts.rollback)} 
                            size="sm" 
                            variant="outline"
                          >
                            {copied === 'rollback' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button 
                            onClick={() => downloadScript('rollback', automation.automation_scripts.rollback)} 
                            size="sm" 
                            variant="outline"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-96 shadow-inner">
                        {automation.automation_scripts.rollback}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}