import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Loader2, Download, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const platforms = [
  { value: "github_actions", label: "GitHub Actions", icon: "🐙", file: ".github/workflows/deploy.yml" },
  { value: "gitlab_ci", label: "GitLab CI", icon: "🦊", file: ".gitlab-ci.yml" },
  { value: "jenkins", label: "Jenkins", icon: "🔧", file: "Jenkinsfile" },
  { value: "circleci", label: "CircleCI", icon: "⭕", file: ".circleci/config.yml" },
  { value: "azure_devops", label: "Azure DevOps", icon: "☁️", file: "azure-pipelines.yml" }
];

export default function CICDGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("github_actions");
  const [configs, setConfigs] = useState([]);
  const [latestConfig, setLatestConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

      const prompt = `Generate a production-ready CI/CD pipeline configuration for ${platforms.find(p => p.value === selectedPlatform)?.label}.

PROJECT: ${project.name}
CATEGORY: ${project.category}
SERVICES:
${servicesContext}

Generate a complete pipeline with:
1. Build stage (install dependencies, compile)
2. Test stage (unit tests, integration tests)
3. Security scanning (dependency check, code scan)
4. Docker image build (if applicable)
5. Deployment stage (to staging and production)
6. Post-deployment verification

Include proper caching, parallel jobs where possible, and environment variables.
Return the complete configuration file content as plain text.`;

      const pipelineConfig = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      const stagesPrompt = `Based on this ${selectedPlatform} pipeline configuration, extract the main stages and their steps as a structured list. Return as JSON.

${pipelineConfig}`;

      const stages = await base44.integrations.Core.InvokeLLM({
        prompt: stagesPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  steps: { type: "array", items: { type: "string" } }
                }
              }
            },
            deployment_targets: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const newConfig = await base44.entities.CICDConfiguration.create({
        project_id: project.id,
        platform: selectedPlatform,
        pipeline_config: pipelineConfig,
        stages: stages.stages || [],
        deployment_targets: stages.deployment_targets || [],
        auto_generated: true
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

  const copyToClipboard = () => {
    if (!latestConfig) return;
    
    navigator.clipboard.writeText(latestConfig.pipeline_config);
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
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-teal-600" />
            Automated CI/CD Pipeline Generator
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate production-ready CI/CD configurations for any platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Platform</label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
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

          <Button
            onClick={generatePipeline}
            disabled={isGenerating || services.length === 0}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Pipeline...
              </>
            ) : (
              <>
                <GitBranch className="w-4 h-4 mr-2" />
                Generate {platforms.find(p => p.value === selectedPlatform)?.label} Pipeline
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestConfig && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Pipeline Configuration</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {platforms.find(p => p.value === latestConfig.platform)?.label} • {platforms.find(p => p.value === latestConfig.platform)?.file}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button onClick={downloadConfig} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  {latestConfig.pipeline_config}
                </pre>
              </div>
            </CardContent>
          </Card>

          {latestConfig.stages && latestConfig.stages.length > 0 && (
            <Card className="bg-white border-0">
              <CardHeader>
                <CardTitle className="text-lg">Pipeline Stages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestConfig.stages.map((stage, i) => (
                    <div key={i} className="border-l-4 border-l-teal-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{stage.name}</h4>
                      <ul className="space-y-1">
                        {stage.steps.map((step, j) => (
                          <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}