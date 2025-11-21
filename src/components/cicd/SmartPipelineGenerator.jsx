import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Loader2, Download, Shield } from "lucide-react";
import { invokeLLM } from "../shared/AILLMProvider";
import { motion } from "framer-motion";

export const SmartPipelineGenerator = ({ project, services }) => {
  const [generating, setGenerating] = useState(false);
  const [pipeline, setPipeline] = useState(null);

  const generatePipeline = async () => {
    setGenerating(true);
    try {
      const techStack = [...new Set(services.flatMap(s => s.technologies || []))];
      
      const result = await invokeLLM(
        `Generate optimized CI/CD pipeline configuration for this microservices project.

Project: ${project.name}
Services: ${services.map(s => s.name).join(', ')}
Tech Stack: ${techStack.join(', ')}
Category: ${project.category}

Generate comprehensive pipeline with:
1. Multi-stage build (lint, test, security scan, build, deploy)
2. Service-specific configurations
3. Security scanning (SAST, dependency, container)
4. Parallel execution where possible
5. Auto-deployment to staging
6. Manual approval for production

Provide configs for GitHub Actions, GitLab CI, and generic format.`,
        {
          type: "object",
          properties: {
            github_actions: { type: "string" },
            gitlab_ci: { type: "string" },
            bitbucket_pipelines: { type: "string" },
            security_stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  tool: { type: "string" },
                  command: { type: "string" }
                }
              }
            },
            deployment_strategy: { type: "string" },
            estimated_duration: { type: "string" }
          }
        }
      );

      setPipeline(result);

      // Save configuration
      await base44.entities.CICDConfiguration.create({
        project_id: project.id,
        platform: "multi",
        pipeline_config: result.github_actions,
        security_scan_config: {
          enabled: true,
          sast_tools: result.security_stages?.map(s => s.tool) || [],
          dependency_scan: true,
          container_scan: true,
          findings_linked: true
        },
        setup_instructions: `Auto-generated for ${techStack.join(', ')}`
      });

      // Link security findings
      for (const stage of result.security_stages || []) {
        await base44.entities.SecurityFinding.create({
          project_id: project.id,
          source: "cicd_audit",
          title: `${stage.name} stage configured`,
          severity: "low",
          description: `Security scanning enabled: ${stage.tool}`,
          status: "resolved"
        });
      }
    } catch (error) {
      console.error("Pipeline generation error:", error);
    }
    setGenerating(false);
  };

  const downloadConfig = (content, filename) => {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              Smart Pipeline Generator
            </CardTitle>
            <Button onClick={generatePipeline} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate Optimized Pipeline
            </Button>
          </div>
        </CardHeader>
      </Card>

      {pipeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Security Stages</p>
                <p className="text-2xl font-bold">{pipeline.security_stages?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Strategy</p>
                <p className="text-lg font-bold">{pipeline.deployment_strategy}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Loader2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Est. Duration</p>
                <p className="text-lg font-bold">{pipeline.estimated_duration}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="github">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="github">GitHub Actions</TabsTrigger>
              <TabsTrigger value="gitlab">GitLab CI</TabsTrigger>
              <TabsTrigger value="bitbucket">Bitbucket</TabsTrigger>
            </TabsList>

            <TabsContent value="github">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">.github/workflows/ci-cd.yml</CardTitle>
                    <Button size="sm" onClick={() => downloadConfig(pipeline.github_actions, 'ci-cd.yml')}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{pipeline.github_actions}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gitlab">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">.gitlab-ci.yml</CardTitle>
                    <Button size="sm" onClick={() => downloadConfig(pipeline.gitlab_ci, '.gitlab-ci.yml')}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{pipeline.gitlab_ci}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bitbucket">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">bitbucket-pipelines.yml</CardTitle>
                    <Button size="sm" onClick={() => downloadConfig(pipeline.bitbucket_pipelines, 'bitbucket-pipelines.yml')}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{pipeline.bitbucket_pipelines}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {pipeline.security_stages?.length > 0 && (
            <Card className="border-l-4 border-green-600">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Integrated Security Scanning
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {pipeline.security_stages.map((stage, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <p className="font-semibold text-gray-900">{stage.name}</p>
                        <code className="text-xs text-gray-600">{stage.command}</code>
                      </div>
                      <Badge className="bg-green-100 text-green-900">{stage.tool}</Badge>
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
};