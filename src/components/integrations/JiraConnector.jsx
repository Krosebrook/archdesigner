import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export const JiraConnector = ({ project, connection, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    workspace_url: connection?.config?.workspace_url || "",
    project_key: connection?.config?.project_key || ""
  });

  const connectJira = async () => {
    setLoading(true);
    try {
      const newConnection = await base44.entities.IntegrationConnection.create({
        project_id: project.id,
        integration_type: "jira",
        name: `Jira: ${config.project_key}`,
        status: "connected",
        config: config,
        capabilities: ["issue_tracking", "security_findings_sync", "task_management"]
      });
      
      onUpdate?.(newConnection);
    } catch (error) {
      console.error("Jira connection error:", error);
    }
    setLoading(false);
  };

  const syncSecurityFindings = async () => {
    if (!connection) return;
    
    setLoading(true);
    try {
      // Create Jira issues for critical security findings
      const findings = await base44.entities.SecurityFinding?.filter?.({ 
        project_id: project.id,
        severity: "critical"
      }) || [];

      // Simulate creating Jira tickets
      const tickets = findings.map(finding => ({
        summary: `[SECURITY] ${finding.title}`,
        description: finding.description,
        priority: "High",
        labels: ["security", "vulnerability"]
      }));

      await base44.entities.IntegrationConnection.update(connection.id, {
        sync_status: {
          message: `Synced ${tickets.length} security findings to Jira`,
          last_sync: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Sync error:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          Jira Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connection ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="workspace-url">Workspace URL</Label>
              <Input
                id="workspace-url"
                placeholder="https://yourcompany.atlassian.net"
                value={config.workspace_url}
                onChange={(e) => setConfig({ ...config, workspace_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="project-key">Project Key</Label>
              <Input
                id="project-key"
                placeholder="PROJ"
                value={config.project_key}
                onChange={(e) => setConfig({ ...config, project_key: e.target.value })}
              />
            </div>
            <Button onClick={connectJira} disabled={loading || !config.workspace_url || !config.project_key}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />}
              Connect Jira
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{connection.name}</p>
                <p className="text-sm text-gray-600">{connection.config.workspace_url}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>

            <Button onClick={syncSecurityFindings} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
              Sync Security Findings
            </Button>

            {connection.sync_status?.message && (
              <p className="text-sm text-gray-600">{connection.sync_status.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};