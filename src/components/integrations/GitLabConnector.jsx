import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Loader2, CheckCircle2 } from "lucide-react";
import { invokeLLM } from "../shared/AILLMProvider";

export const GitLabConnector = ({ project, connections, onUpdate }) => {
  const [connecting, setConnecting] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  const connectGitLab = async () => {
    setConnecting(true);
    try {
      const connection = await base44.entities.IntegrationConnection.create({
        project_id: project.id,
        integration_type: "gitlab",
        name: `GitLab - ${repoUrl.split('/').pop()}`,
        status: "connected",
        config: { repository_url: repoUrl },
        capabilities: ["code_analysis", "pipeline_trigger", "security_scan"]
      });

      onUpdate?.();
      setRepoUrl("");
    } catch (error) {
      console.error("GitLab connection error:", error);
    }
    setConnecting(false);
  };

  const analyzeRepo = async (connection) => {
    try {
      await base44.entities.IntegrationConnection.update(connection.id, {
        sync_status: { message: "Analyzing repository..." }
      });

      const analysis = await invokeLLM(
        `Analyze GitLab repository structure and suggest CI/CD pipeline.
        
Repository: ${connection.config.repository_url}
Project: ${project.name}

Provide:
1. Detected tech stack
2. Recommended pipeline stages
3. Security scan recommendations`,
        {
          type: "object",
          properties: {
            tech_stack: { type: "array", items: { type: "string" } },
            pipeline_recommendations: { type: "array", items: { type: "string" } },
            security_recommendations: { type: "array", items: { type: "string" } }
          }
        }
      );

      await base44.entities.IntegrationConnection.update(connection.id, {
        sync_status: { message: "Analysis complete" },
        last_sync: new Date().toISOString()
      });

      onUpdate?.();
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  const gitlabConnections = connections.filter(c => c.integration_type === "gitlab");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-orange-600" />
          GitLab Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://gitlab.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <Button onClick={connectGitLab} disabled={connecting || !repoUrl}>
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
          </Button>
        </div>

        {gitlabConnections.map(conn => (
          <div key={conn.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-900">{conn.status}</Badge>
                <span className="font-medium">{conn.name}</span>
              </div>
              <Button size="sm" onClick={() => analyzeRepo(conn)}>
                Analyze
              </Button>
            </div>
            <div className="flex gap-2 text-xs">
              {conn.capabilities?.map(cap => (
                <Badge key={cap} variant="outline">{cap}</Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};