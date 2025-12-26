import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GitBranch, Loader2, FileCode } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const PLATFORMS = [
  { id: "github_actions", name: "GitHub Actions", icon: "🐙" },
  { id: "gitlab_ci", name: "GitLab CI", icon: "🦊" },
  { id: "jenkins", name: "Jenkins", icon: "👷" },
  { id: "circleci", name: "CircleCI", icon: "⭕" }
];

export default function CICDStep({ data, onComplete }) {
  const [enabled, setEnabled] = useState(data.cicdConfig?.enabled ?? true);
  const [platform, setPlatform] = useState(data.cicdConfig?.platform || "github_actions");
  const [config, setConfig] = useState(data.cicdConfig || null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (enabled && !config && data.services?.length > 0) {
      generateCICDConfig();
    }
  }, []);

  useEffect(() => {
    if (config) {
      onComplete({ enabled, platform, ...config });
    }
  }, [enabled, platform, config]);

  const generateCICDConfig = async () => {
    setIsGenerating(true);
    try {
      const selectedServices = data.services || [];
      
      const prompt = `You are a DevOps expert with knowledge of latest CI/CD trends. Generate a complete CI/CD pipeline configuration for this project:

PROJECT: ${data.projectInfo.name}
ARCHITECTURE: ${data.architecture?.pattern}
SERVICES: ${selectedServices.map(s => s.name).join(', ')}
TECHNOLOGIES: ${data.architecture?.technologies?.join(', ')}
PLATFORM: ${platform}

Generate MODERN CI/CD pipeline (2024-2025 standards):
1. Complete pipeline configuration with:
   - Caching strategies (npm/pip/go modules)
   - Parallel job execution
   - Matrix builds for multiple environments
   - Dependency vulnerability scanning (Snyk, Dependabot)
   - SAST tools (SonarQube, CodeQL)
2. Build stages: linting (ESLint, Prettier), testing (Jest, Pytest), security scanning, build, deploy
3. Multi-stage Dockerfiles with:
   - Non-root user
   - Layer caching optimization
   - Security scanning with Trivy
4. Docker Compose v3.8+ for local development with:
   - Health checks
   - Resource limits
   - Volume management
5. Deployment strategies:
   - Blue-green or canary deployments
   - Automated rollback on health check failure
   - Zero-downtime deployments
6. Secrets management with HashiCorp Vault or cloud provider
7. Monitoring integration (Prometheus, Grafana, Datadog)

Use current best practices and industry standards.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            config: { type: "string" },
            dockerfile: { type: "string" },
            dockerCompose: { type: "string" },
            stages: {
              type: "object",
              properties: {
                linting: { type: "object" },
                testing: { type: "object" },
                security_scanning: { type: "object" },
                build: { type: "object" },
                deploy: { type: "object" }
              }
            },
            setupInstructions: { type: "string" }
          }
        }
      });

      setConfig(result);
      toast.success("CI/CD pipeline generated!");
    } catch (error) {
      console.error("CI/CD generation failed:", error);
      toast.error("Failed to generate CI/CD config");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <GitBranch className="w-5 h-5" />
            CI/CD Pipeline Setup
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Automated testing, building, and deployment for your services
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cicd-enabled" className="font-semibold">Enable CI/CD Pipeline</Label>
              <p className="text-sm text-gray-600 mt-1">
                Automatically set up continuous integration and deployment
              </p>
            </div>
            <Switch
              id="cicd-enabled"
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                if (checked && !config) {
                  generateCICDConfig();
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          <div>
            <h3 className="font-semibold mb-3">Select CI/CD Platform</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {PLATFORMS.map(p => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    platform === p.id
                      ? "border-2 border-indigo-500 bg-indigo-50"
                      : "border border-gray-200 hover:border-indigo-300"
                  }`}
                  onClick={() => {
                    setPlatform(p.id);
                    setConfig(null);
                    setTimeout(generateCICDConfig, 100);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="text-3xl">{p.icon}</div>
                    <div className="font-semibold">{p.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {isGenerating ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Generating CI/CD configuration...</p>
              </CardContent>
            </Card>
          ) : config ? (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Pipeline Generated ✓</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-green-900 mb-2">Pipeline Stages</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(config.stages || {}).map(stage => (
                      <Badge key={stage} className="bg-green-600 text-white">
                        {stage.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold mb-2">
                    <FileCode className="w-3 h-3 inline mr-1" />
                    View Pipeline Configuration
                  </summary>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs max-h-64">
                    {config.config}
                  </pre>
                </details>

                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold mb-2">
                    <FileCode className="w-3 h-3 inline mr-1" />
                    View Dockerfile
                  </summary>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs max-h-64">
                    {config.dockerfile}
                  </pre>
                </details>

                <details className="text-xs">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold mb-2">
                    <FileCode className="w-3 h-3 inline mr-1" />
                    View Docker Compose
                  </summary>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs max-h-64">
                    {config.dockerCompose}
                  </pre>
                </details>

                {config.setupInstructions && (
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-green-900 mb-2">Setup Instructions</div>
                    <p className="text-xs text-green-800 whitespace-pre-wrap">
                      {config.setupInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

CICDStep.propTypes = {
  data: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired
};