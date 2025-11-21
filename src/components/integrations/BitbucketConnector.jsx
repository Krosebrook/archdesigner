import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Loader2 } from "lucide-react";

export const BitbucketConnector = ({ project, connections, onUpdate }) => {
  const [connecting, setConnecting] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  const connectBitbucket = async () => {
    setConnecting(true);
    try {
      await base44.entities.IntegrationConnection.create({
        project_id: project.id,
        integration_type: "bitbucket",
        name: `Bitbucket - ${repoUrl.split('/').pop()}`,
        status: "connected",
        config: { repository_url: repoUrl },
        capabilities: ["code_analysis", "pipeline_trigger"]
      });

      onUpdate?.();
      setRepoUrl("");
    } catch (error) {
      console.error("Bitbucket connection error:", error);
    }
    setConnecting(false);
  };

  const bitbucketConnections = connections.filter(c => c.integration_type === "bitbucket");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          Bitbucket Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://bitbucket.org/workspace/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
          <Button onClick={connectBitbucket} disabled={connecting || !repoUrl}>
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
          </Button>
        </div>

        {bitbucketConnections.map(conn => (
          <div key={conn.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-900">{conn.status}</Badge>
              <span className="font-medium">{conn.name}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};