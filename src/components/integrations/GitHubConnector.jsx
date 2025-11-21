import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Github, Loader2, CheckCircle2, Code, FileText } from "lucide-react";
import { invokeLLM } from "../shared/AILLMProvider";

export const GitHubConnector = ({ project, connection, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState(connection?.config?.repository_url || "");
  const [analyzing, setAnalyzing] = useState(false);

  const connectRepo = async () => {
    setLoading(true);
    try {
      const newConnection = await base44.entities.IntegrationConnection.create({
        project_id: project.id,
        integration_type: "github",
        name: `GitHub: ${repoUrl.split('/').slice(-1)[0]}`,
        status: "connected",
        config: {
          repository_url: repoUrl
        },
        capabilities: ["code_analysis", "documentation_sync", "security_scan"]
      });
      
      onUpdate?.(newConnection);
    } catch (error) {
      console.error("GitHub connection error:", error);
    }
    setLoading(false);
  };

  const analyzeRepository = async () => {
    setAnalyzing(true);
    try {
      // Simulate fetching repo structure
      const analysis = await invokeLLM(
        `Analyze this GitHub repository for security and documentation opportunities.

Repository: ${repoUrl}
Project: ${project.name}

Provide:
1. Recommended security scans based on detected languages/frameworks
2. Documentation gaps (missing README, API docs, etc.)
3. CI/CD security recommendations
4. Suggested integrations based on repo structure`,
        {
          type: "object",
          properties: {
            languages: { type: "array", items: { type: "string" } },
            frameworks: { type: "array", items: { type: "string" } },
            security_recommendations: { type: "array", items: { type: "string" } },
            documentation_gaps: { type: "array", items: { type: "string" } },
            cicd_files: { type: "array", items: { type: "string" } }
          }
        }
      );

      // Update connection with analysis
      await base44.entities.IntegrationConnection.update(connection.id, {
        sync_status: {
          message: "Repository analyzed successfully",
          last_analysis: analysis
        }
      });
    } catch (error) {
      console.error("Repository analysis error:", error);
    }
    setAnalyzing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          GitHub Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connection ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <Button onClick={connectRepo} disabled={loading || !repoUrl}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
              Connect Repository
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{connection.name}</p>
                <p className="text-sm text-gray-600">{connection.config.repository_url}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={analyzeRepository} disabled={analyzing}>
                {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Code className="w-4 h-4 mr-2" />}
                Analyze Code
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Sync Docs
              </Button>
            </div>

            {connection.capabilities && (
              <div>
                <p className="text-sm font-semibold mb-2">Capabilities:</p>
                <div className="flex flex-wrap gap-2">
                  {connection.capabilities.map((cap, i) => (
                    <Badge key={i} variant="outline">{cap.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};