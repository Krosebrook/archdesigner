import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Loader2, Download, Copy, CheckCircle2, Shield, TestTube, Container, Rocket, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const platforms = [
  { value: "github_actions", label: "GitHub Actions", icon: "🐙", file: ".github/workflows/deploy.yml" },
  { value: "gitlab_ci", label: "GitLab CI", icon: "🦊", file: ".gitlab-ci.yml" },
  { value: "jenkins", label: "Jenkins", icon: "🔧", file: "Jenkinsfile" },
  { value: "circleci", label: "CircleCI", icon: "⭕", file: ".circleci/config.yml" },
  { value: "azure_devops", label: "Azure DevOps", icon: "☁️", file: "azure-pipelines.yml" },
  { value: "bitbucket", label: "Bitbucket Pipelines", icon: "🪣", file: "bitbucket-pipelines.yml" }
];

const deploymentTargets = [
  { value: "kubernetes", label: "Kubernetes (K8s)", env: ["staging", "production"] },
  { value: "docker_swarm", label: "Docker Swarm", env: ["staging", "production"] },
  { value: "aws_ecs", label: "AWS ECS", env: ["staging", "production"] },
  { value: "azure_aks", label: "Azure AKS", env: ["staging", "production"] },
  { value: "gcp_gke", label: "GCP GKE", env: ["staging", "production"] },
  { value: "heroku", label: "Heroku", env: ["staging", "production"] },
  { value: "vercel", label: "Vercel", env: ["preview", "production"] },
  { value: "netlify", label: "Netlify", env: ["preview", "production"] }
];

export default function CICDGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("github_actions");
  const [selectedTargets, setSelectedTargets] = useState([
    { type: "kubernetes", environment: "staging" },
    { type: "kubernetes", environment: "production" }
  ]);
  const [pipelineStages, setPipelineStages] = useState({
    linting: { enabled: true, tools: ["eslint", "prettier"] },
    testing: { enabled: true, unit_tests: true, integration_tests: true, e2e_tests: false },
    security_scanning: { enabled: true, dependency_scan: true, sast: true, container_scan: true },
    build: { enabled: true, docker: true },
    deploy: { enabled: true, auto_staging: true, manual_production: true }
  });
  const [configs, setConfigs] = useState([]);
  const [latestConfig, setLatestConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState({});

  useEffect(() => {
    loadConfigs();
  }, [project?.id]);

  const loadConfigs = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.CICDConfiguration.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setConfigs(data);
      if (data.length > 0) {
        setLatestConfig(data[0]);
      }
    } catch (error) {
      console.error("Error loading CI/CD configs:", error);
    }
    setIsLoading(false);
  };

  const generatePipeline = async () => {
    setIsGenerating(true);
    try {
      const servicesContext = services.map(s => `
- ${s.name} (${s.category}): ${(s.technologies || []).join(', ')}
      `).join('\n');

      const targetsContext = selectedTargets.map(t => 
        `${deploymentTargets.find(dt => dt.value === t.type)?.label} (${t.environment})`
      ).join(', ');

      const prompt = `Generate a comprehensive, production-ready CI/CD pipeline for ${platforms.find(p => p.value === selectedPlatform)?.label}.

PROJECT: ${project.name} (${project.category})
SERVICES:
${servicesContext}

DEPLOYMENT TARGETS: ${targetsContext}

PIPELINE STAGES TO INCLUDE:

${pipelineStages.linting.enabled ? `1. LINTING:
   - Tools: ${pipelineStages.linting.tools.join(', ')}
   - Fail on errors
   - Run in parallel where possible` : ''}

${pipelineStages.testing.enabled ? `2. TESTING:
   ${pipelineStages.testing.unit_tests ? '- Unit tests with coverage reporting' : ''}
   ${pipelineStages.testing.integration_tests ? '- Integration tests' : ''}
   ${pipelineStages.testing.e2e_tests ? '- End-to-end tests' : ''}
   - Generate test reports
   - Coverage thresholds: 80%` : ''}

${pipelineStages.security_scanning.enabled ? `3. SECURITY SCANNING:
   ${pipelineStages.security_scanning.dependency_scan ? '- Dependency vulnerability scan (npm audit, Snyk, etc.)' : ''}
   ${pipelineStages.security_scanning.sast ? '- Static Application Security Testing (SAST)' : ''}
   ${pipelineStages.security_scanning.container_scan ? '- Container image scanning (Trivy, Clair)' : ''}
   - Fail on high/critical vulnerabilities` : ''}

${pipelineStages.build.enabled ? `4. BUILD:
   ${pipelineStages.build.docker ? '- Build Docker images for each service' : '- Build artifacts'}
   - Tag with commit SHA and semantic version
   - Push to container registry
   - Use multi-stage builds for optimization
   - Layer caching` : ''}

${pipelineStages.deploy.enabled ? `5. DEPLOYMENT:
   ${pipelineStages.deploy.auto_staging ? '- Auto-deploy to STAGING on main branch' : ''}
   ${pipelineStages.deploy.manual_production ? '- Manual approval required for PRODUCTION' : ''}
   - Rolling update strategy
   - Health checks post-deployment
   - Automatic rollback on failure
   - Deployment notifications` : ''}

Generate:
1. Main pipeline config (YAML)
2. Dockerfile (multi-stage, optimized)
3. docker-compose.yml (for local development)
${selectedTargets.some(t => t.type === 'kubernetes') ? '4. Kubernetes manifests (deployment, service, ingress)' : ''}
5. Setup instructions

Return as JSON with pipeline_config, dockerfile, docker_compose, kubernetes_manifests (if applicable), and setup_instructions.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            pipeline_config: { type: "string" },
            dockerfile: { type: "string" },
            docker_compose: { type: "string" },
            kubernetes_manifests: {
              type: "object",
              properties: {
                deployment: { type: "string" },
                service: { type: "string" },
                ingress: { type: "string" }
              }
            },
            setup_instructions: { type: "string" }
          }
        }
      });

      const newConfig = await base44.entities.CICDConfiguration.create({
        project_id: project.id,
        platform: selectedPlatform,
        deployment_targets: selectedTargets,
        pipeline_stages: pipelineStages,
        pipeline_config: result.pipeline_config,
        dockerfile: result.dockerfile,
        docker_compose: result.docker_compose,
        kubernetes_manifests: result.kubernetes_manifests || {},
        setup_instructions: result.setup_instructions
      });

      setLatestConfig(newConfig);
      await loadConfigs();
    } catch (error) {
      console.error("Error generating pipeline:", error);
    }
    setIsGenerating(false);
  };

  const downloadConfig = () => {
    if (!latestConfig) return;
    
    const platform = platforms.find(p => p.value === latestConfig.platform);
    const blob = new Blob([latestConfig.pipeline_config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = platform?.file || 'pipeline-config.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTarget = (type, environment) => {
    const exists = selectedTargets.some(t => t.type === type && t.environment === environment);
    if (exists) {
      setSelectedTargets(selectedTargets.filter(t => !(t.type === type && t.environment === environment)));
    } else {
      setSelectedTargets([...selectedTargets, { type, environment }]);
    }
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <Card className="bg-gradient-to-br from-slate-900 via-teal-900 to-blue-900 border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 backdrop-blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <GitBranch className="w-7 h-7 text-white" />
              </div>
              Automated CI/CD Pipeline Generator
            </CardTitle>
            <p className="text-teal-100 mt-2 text-base">
              Enterprise-grade pipelines with linting, testing, security scanning, and automated deployments
            </p>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {/* Platform Selection */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">CI/CD Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
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

            {/* Deployment Targets */}
            <div>
              <label className="text-sm font-semibold text-white mb-3 block">Deployment Targets</label>
              <div className="grid md:grid-cols-2 gap-3">
                {deploymentTargets.map(target => (
                  <div key={target.value} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="font-medium text-white mb-2">{target.label}</div>
                    <div className="flex gap-2">
                      {target.env.map(env => (
                        <label key={env} className="flex items-center gap-2 text-sm text-teal-100 cursor-pointer">
                          <Checkbox
                            checked={selectedTargets.some(t => t.type === target.value && t.environment === env)}
                            onCheckedChange={() => toggleTarget(target.value, env)}
                            className="border-white/40 data-[state=checked]:bg-teal-500"
                          />
                          {env}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Stages */}
            <div>
              <label className="text-sm font-semibold text-white mb-3 block">Pipeline Stages</label>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={pipelineStages.linting.enabled}
                      onCheckedChange={(checked) => setPipelineStages({
                        ...pipelineStages,
                        linting: { ...pipelineStages.linting, enabled: checked }
                      })}
                      className="border-white/40 data-[state=checked]:bg-teal-500"
                    />
                    <FileCode className="w-4 h-4 text-teal-300" />
                    <span className="font-medium text-white">Code Linting</span>
                  </div>
                  <p className="text-xs text-teal-100 ml-6">ESLint, Prettier formatting</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={pipelineStages.testing.enabled}
                      onCheckedChange={(checked) => setPipelineStages({
                        ...pipelineStages,
                        testing: { ...pipelineStages.testing, enabled: checked }
                      })}
                      className="border-white/40 data-[state=checked]:bg-teal-500"
                    />
                    <TestTube className="w-4 h-4 text-blue-300" />
                    <span className="font-medium text-white">Automated Testing</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <label className="flex items-center gap-2 text-xs text-blue-100 cursor-pointer">
                      <Checkbox
                        checked={pipelineStages.testing.unit_tests}
                        onCheckedChange={(checked) => setPipelineStages({
                          ...pipelineStages,
                          testing: { ...pipelineStages.testing, unit_tests: checked }
                        })}
                        className="border-white/40 data-[state=checked]:bg-blue-500 h-3 w-3"
                      />
                      Unit Tests
                    </label>
                    <label className="flex items-center gap-2 text-xs text-blue-100 cursor-pointer">
                      <Checkbox
                        checked={pipelineStages.testing.integration_tests}
                        onCheckedChange={(checked) => setPipelineStages({
                          ...pipelineStages,
                          testing: { ...pipelineStages.testing, integration_tests: checked }
                        })}
                        className="border-white/40 data-[state=checked]:bg-blue-500 h-3 w-3"
                      />
                      Integration Tests
                    </label>
                    <label className="flex items-center gap-2 text-xs text-blue-100 cursor-pointer">
                      <Checkbox
                        checked={pipelineStages.testing.e2e_tests}
                        onCheckedChange={(checked) => setPipelineStages({
                          ...pipelineStages,
                          testing: { ...pipelineStages.testing, e2e_tests: checked }
                        })}
                        className="border-white/40 data-[state=checked]:bg-blue-500 h-3 w-3"
                      />
                      E2E Tests
                    </label>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={pipelineStages.security_scanning.enabled}
                      onCheckedChange={(checked) => setPipelineStages({
                        ...pipelineStages,
                        security_scanning: { ...pipelineStages.security_scanning, enabled: checked }
                      })}
                      className="border-white/40 data-[state=checked]:bg-teal-500"
                    />
                    <Shield className="w-4 h-4 text-red-300" />
                    <span className="font-medium text-white">Security Scanning</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <label className="flex items-center gap-2 text-xs text-red-100 cursor-pointer">
                      <Checkbox
                        checked={pipelineStages.security_scanning.dependency_scan}
                        onCheckedChange={(checked) => setPipelineStages({
                          ...pipelineStages,
                          security_scanning: { ...pipelineStages.security_scanning, dependency_scan: checked }
                        })}
                        className="border-white/40 data-[state=checked]:bg-red-500 h-3 w-3"
                      />
                      Dependency Scan
                    </label>
                    <label className="flex items-center gap-2 text-xs text-red-100 cursor-pointer">
                      <Checkbox
                        checked={pipelineStages.security_scanning.sast}
                        onCheckedChange={(checked) => setPipelineStages({
                          ...pipelineStages,
                          security_scanning: { ...pipelineStages.security_scanning, sast: checked }
                        })}
                        className="border-white/40 data-[state=checked]:bg-red-500 h-3 w-3"
                      />
                      SAST
                    </label>
                    <label className="flex items-center gap-2 text-xs text-red-100 cursor-pointer">
                      <Checkbox
                        checked={pipelineStages.security_scanning.container_scan}
                        onCheckedChange={(checked) => setPipelineStages({
                          ...pipelineStages,
                          security_scanning: { ...pipelineStages.security_scanning, container_scan: checked }
                        })}
                        className="border-white/40 data-[state=checked]:bg-red-500 h-3 w-3"
                      />
                      Container Scan
                    </label>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={pipelineStages.build.enabled}
                      onCheckedChange={(checked) => setPipelineStages({
                        ...pipelineStages,
                        build: { ...pipelineStages.build, enabled: checked }
                      })}
                      className="border-white/40 data-[state=checked]:bg-teal-500"
                    />
                    <Container className="w-4 h-4 text-purple-300" />
                    <span className="font-medium text-white">Container Build</span>
                  </div>
                  <p className="text-xs text-purple-100 ml-6">Docker multi-stage builds</p>
                </div>
              </div>
            </div>

            <Button
              onClick={generatePipeline}
              disabled={isGenerating || services.length === 0 || selectedTargets.length === 0}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Complete Pipeline...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Generate Full CI/CD Pipeline
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {latestConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs defaultValue="pipeline" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
                <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                <TabsTrigger value="docker">Docker</TabsTrigger>
                <TabsTrigger value="compose">Compose</TabsTrigger>
                {latestConfig.kubernetes_manifests?.deployment && (
                  <TabsTrigger value="k8s">Kubernetes</TabsTrigger>
                )}
                <TabsTrigger value="setup">Setup</TabsTrigger>
              </TabsList>

              <TabsContent value="pipeline">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <GitBranch className="w-5 h-5 text-teal-600" />
                          Pipeline Configuration
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {platforms.find(p => p.value === latestConfig.platform)?.label} • {platforms.find(p => p.value === latestConfig.platform)?.file}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => copyToClipboard(latestConfig.pipeline_config, 'pipeline')} variant="outline" size="sm">
                          {copied.pipeline ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button onClick={() => downloadFile(latestConfig.pipeline_config, platforms.find(p => p.value === latestConfig.platform)?.file)} variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-[600px] overflow-y-auto font-mono shadow-inner">
                      {latestConfig.pipeline_config}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="docker">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Container className="w-5 h-5 text-blue-600" />
                        Dockerfile
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button onClick={() => copyToClipboard(latestConfig.dockerfile, 'docker')} variant="outline" size="sm">
                          {copied.docker ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button onClick={() => downloadFile(latestConfig.dockerfile, 'Dockerfile')} variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-[600px] overflow-y-auto font-mono shadow-inner">
                      {latestConfig.dockerfile}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compose">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-purple-600" />
                        Docker Compose
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button onClick={() => copyToClipboard(latestConfig.docker_compose, 'compose')} variant="outline" size="sm">
                          {copied.compose ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button onClick={() => downloadFile(latestConfig.docker_compose, 'docker-compose.yml')} variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-[600px] overflow-y-auto font-mono shadow-inner">
                      {latestConfig.docker_compose}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              {latestConfig.kubernetes_manifests?.deployment && (
                <TabsContent value="k8s">
                  <div className="space-y-4">
                    <Card className="shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Deployment</CardTitle>
                          <div className="flex gap-2">
                            <Button onClick={() => copyToClipboard(latestConfig.kubernetes_manifests.deployment, 'k8s-deploy')} variant="outline" size="sm">
                              {copied['k8s-deploy'] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button onClick={() => downloadFile(latestConfig.kubernetes_manifests.deployment, 'deployment.yaml')} variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-80 overflow-y-auto font-mono">
                          {latestConfig.kubernetes_manifests.deployment}
                        </pre>
                      </CardContent>
                    </Card>

                    {latestConfig.kubernetes_manifests.service && (
                      <Card className="shadow-lg">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Service</CardTitle>
                            <div className="flex gap-2">
                              <Button onClick={() => copyToClipboard(latestConfig.kubernetes_manifests.service, 'k8s-svc')} variant="outline" size="sm">
                                {copied['k8s-svc'] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              </Button>
                              <Button onClick={() => downloadFile(latestConfig.kubernetes_manifests.service, 'service.yaml')} variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-80 overflow-y-auto font-mono">
                            {latestConfig.kubernetes_manifests.service}
                          </pre>
                        </CardContent>
                      </Card>
                    )}

                    {latestConfig.kubernetes_manifests.ingress && (
                      <Card className="shadow-lg">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Ingress</CardTitle>
                            <div className="flex gap-2">
                              <Button onClick={() => copyToClipboard(latestConfig.kubernetes_manifests.ingress, 'k8s-ing')} variant="outline" size="sm">
                                {copied['k8s-ing'] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              </Button>
                              <Button onClick={() => downloadFile(latestConfig.kubernetes_manifests.ingress, 'ingress.yaml')} variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-slate-900 text-gray-100 p-6 rounded-xl text-sm overflow-x-auto max-h-80 overflow-y-auto font-mono">
                            {latestConfig.kubernetes_manifests.ingress}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="setup">
                <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Setup Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {latestConfig.setup_instructions}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}