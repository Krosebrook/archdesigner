import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Rocket, 
  Loader2, 
  CheckCircle2, 
  Copy,
  Download,
  Server,
  Shield,
  Activity,
  Cloud,
  FileCode,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PropTypes from "prop-types";

const cicdPlatforms = [
  { value: "github", label: "GitHub Actions", icon: "🐙" },
  { value: "gitlab", label: "GitLab CI", icon: "🦊" },
  { value: "jenkins", label: "Jenkins", icon: "🔧" },
  { value: "circleci", label: "CircleCI", icon: "⚪" },
  { value: "azure", label: "Azure DevOps", icon: "☁️" }
];

const cloudProviders = [
  { value: "aws", label: "AWS", icon: "🟧" },
  { value: "azure", label: "Azure", icon: "🔷" },
  { value: "gcp", label: "Google Cloud", icon: "🟦" },
  { value: "vercel", label: "Vercel", icon: "▲" },
  { value: "netlify", label: "Netlify", icon: "🟢" }
];

const iacTools = [
  { value: "terraform", label: "Terraform", icon: "🟣" },
  { value: "pulumi", label: "Pulumi", icon: "🟡" },
  { value: "cloudformation", label: "CloudFormation", icon: "🟧" },
  { value: "cdk", label: "AWS CDK", icon: "🟧" }
];

function AIDeploymentAutomation({ project, services = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState(null);
  const [selectedCICD, setSelectedCICD] = useState("github");
  const [selectedCloud, setSelectedCloud] = useState("aws");
  const [selectedIaC, setSelectedIaC] = useState("terraform");
  const [copied, setCopied] = useState({});

  const generateDeploymentPipeline = async () => {
    setIsGenerating(true);
    try {
      const techStack = services.map(s => ({
        name: s.name,
        technologies: s.technologies || [],
        category: s.category,
        dockerfile: s.dockerfile
      }));

      const prompt = `You are a DevOps expert. Generate a complete deployment automation for this project:

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
SERVICES: ${services.length} microservices
TECH STACK: ${techStack.map(t => `${t.name} (${t.technologies.join(', ')})`).join('; ')}

CI/CD PLATFORM: ${selectedCICD}
CLOUD PROVIDER: ${selectedCloud}
IaC TOOL: ${selectedIaC}

Generate:
1. Complete CI/CD pipeline configuration with:
   - Build stages for each service
   - Testing (unit, integration, e2e)
   - Security scanning (SAST, dependency scan, container scan)
   - Multi-environment deployment (staging, production)
   - Rollback strategies
   - Environment variables management

2. Infrastructure as Code (${selectedIaC}) with:
   - Network setup (VPC, subnets, security groups)
   - Container orchestration (ECS/EKS/AKS/GKE)
   - Load balancers and auto-scaling
   - Database instances
   - Storage and CDN
   - Secrets management

3. Monitoring & Observability setup:
   - Application metrics (Prometheus/CloudWatch/DataDog)
   - Logging aggregation (ELK/CloudWatch Logs)
   - Error tracking (Sentry)
   - Uptime monitoring
   - Alert rules for critical issues
   - Dashboard configurations

4. Security configurations:
   - SSL/TLS certificates
   - WAF rules
   - IAM roles and policies
   - Network security
   - Secret rotation

Return complete, production-ready configurations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            cicd_pipeline: {
              type: "object",
              properties: {
                config_file: { type: "string" },
                stages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      steps: { type: "array", items: { type: "string" } },
                      artifacts: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                environment_variables: { type: "object" },
                secrets_required: { type: "array", items: { type: "string" } }
              }
            },
            infrastructure: {
              type: "object",
              properties: {
                main_config: { type: "string" },
                modules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      code: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                estimated_cost: { type: "string" }
              }
            },
            monitoring: {
              type: "object",
              properties: {
                metrics_config: { type: "string" },
                logging_config: { type: "string" },
                alert_rules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      condition: { type: "string" },
                      severity: { type: "string" },
                      notification: { type: "string" }
                    }
                  }
                },
                dashboards: { type: "array", items: { type: "string" } }
              }
            },
            security: {
              type: "object",
              properties: {
                ssl_config: { type: "string" },
                waf_rules: { type: "string" },
                iam_policies: { type: "string" },
                secret_management: { type: "string" }
              }
            },
            deployment_guide: { type: "string" }
          }
        }
      });

      // Save to database
      await base44.entities.CICDConfiguration.create({
        project_id: project.id,
        platform: selectedCICD,
        deployment_targets: [{
          name: selectedCloud,
          type: selectedIaC,
          environment: "production"
        }],
        pipeline_config: result.cicd_pipeline.config_file,
        setup_instructions: result.deployment_guide
      });

      setDeploymentConfig(result);
      toast.success("Deployment automation generated successfully!");
    } catch (error) {
      console.error("Failed to generate deployment:", error);
      toast.error("Failed to generate deployment automation");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
  };

  const downloadAll = () => {
    if (!deploymentConfig) return;

    const files = [
      { name: `${selectedCICD}-pipeline.yml`, content: deploymentConfig.cicd_pipeline.config_file },
      { name: `infrastructure-main.${selectedIaC === 'terraform' ? 'tf' : 'yaml'}`, content: deploymentConfig.infrastructure.main_config },
      { name: 'monitoring-config.yml', content: deploymentConfig.monitoring.metrics_config },
      { name: 'DEPLOYMENT.md', content: deploymentConfig.deployment_guide }
    ];

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });

    toast.success("All deployment files downloaded");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-violet-600" />
            AI-Powered Deployment Automation
          </CardTitle>
          <CardDescription>
            Generate complete CI/CD pipelines, infrastructure code, and monitoring setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                CI/CD Platform
              </label>
              <Select value={selectedCICD} onValueChange={setSelectedCICD}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cicdPlatforms.map(platform => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <span className="flex items-center gap-2">
                        <span>{platform.icon}</span>
                        {platform.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Cloud Provider
              </label>
              <Select value={selectedCloud} onValueChange={setSelectedCloud}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cloudProviders.map(provider => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <span className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        {provider.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Infrastructure Tool
              </label>
              <Select value={selectedIaC} onValueChange={setSelectedIaC}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iacTools.map(tool => (
                    <SelectItem key={tool.value} value={tool.value}>
                      <span className="flex items-center gap-2">
                        <span>{tool.icon}</span>
                        {tool.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateDeploymentPipeline}
            disabled={isGenerating || services.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Deployment Automation...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                Generate Complete Deployment Setup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {deploymentConfig && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {deploymentConfig.cicd_pipeline.stages?.length || 0}
                      </div>
                      <div className="text-sm text-blue-700">Pipeline Stages</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Cloud className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {deploymentConfig.infrastructure.modules?.length || 0}
                      </div>
                      <div className="text-sm text-purple-700">IaC Modules</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {deploymentConfig.monitoring.alert_rules?.length || 0}
                      </div>
                      <div className="text-sm text-green-700">Alert Rules</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-orange-600" />
                    <div>
                      <div className="text-lg font-bold text-orange-900">
                        {deploymentConfig.infrastructure.estimated_cost || "Est."}
                      </div>
                      <div className="text-sm text-orange-700">Monthly Cost</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={downloadAll} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All Files
              </Button>
            </div>

            <Tabs defaultValue="cicd" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cicd">CI/CD Pipeline</TabsTrigger>
                <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="cicd" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Pipeline Configuration</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(deploymentConfig.cicd_pipeline.config_file, 'cicd')}
                      >
                        {copied.cicd ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                      {deploymentConfig.cicd_pipeline.config_file}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pipeline Stages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deploymentConfig.cicd_pipeline.stages?.map((stage, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{stage.name}</Badge>
                        </div>
                        <ul className="text-sm space-y-1">
                          {stage.steps?.map((step, i) => (
                            <li key={i} className="text-gray-700">• {step}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="infrastructure" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Infrastructure Code ({selectedIaC})</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(deploymentConfig.infrastructure.main_config, 'iac')}
                      >
                        {copied.iac ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                      {deploymentConfig.infrastructure.main_config}
                    </pre>
                  </CardContent>
                </Card>

                {deploymentConfig.infrastructure.modules?.map((module, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-sm">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                        {module.code}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Alert Rules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deploymentConfig.monitoring.alert_rules?.map((alert, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{alert.name}</h4>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' : 
                            alert.severity === 'high' ? 'default' : 'secondary'
                          }>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1"><strong>Condition:</strong> {alert.condition}</p>
                        <p className="text-xs text-gray-600"><strong>Notify:</strong> {alert.notification}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Metrics Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                      {deploymentConfig.monitoring.metrics_config}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">SSL/TLS Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      {deploymentConfig.security.ssl_config}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">IAM Policies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      {deploymentConfig.security.iam_policies}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Deployment Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {deploymentConfig.deployment_guide}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

AIDeploymentAutomation.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired,
  services: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    technologies: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    dockerfile: PropTypes.string
  }))
};

export default AIDeploymentAutomation;