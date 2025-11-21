import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cloud, Loader2, CheckCircle2, Shield } from "lucide-react";
import { invokeLLM } from "../shared/AILLMProvider";

const providers = [
  { value: "aws", label: "Amazon Web Services", icon: "☁️" },
  { value: "azure", label: "Microsoft Azure", icon: "☁️" },
  { value: "gcp", label: "Google Cloud Platform", icon: "☁️" }
];

export const CloudProviderConnector = ({ project, connections = [], onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [provider, setProvider] = useState("aws");
  const [config, setConfig] = useState({
    account_id: "",
    region: "us-east-1"
  });

  const connectProvider = async () => {
    setLoading(true);
    try {
      const newConnection = await base44.entities.IntegrationConnection.create({
        project_id: project.id,
        integration_type: provider,
        name: `${providers.find(p => p.value === provider).label}`,
        status: "connected",
        config: config,
        capabilities: ["deployment_scan", "security_audit", "cost_analysis"]
      });
      
      onUpdate?.(newConnection);
    } catch (error) {
      console.error("Cloud provider connection error:", error);
    }
    setLoading(false);
  };

  const scanDeployment = async (connection) => {
    setScanning(true);
    try {
      const analysis = await invokeLLM(
        `Analyze ${connection.integration_type.toUpperCase()} deployment for security risks.

Project: ${project.name}
Provider: ${connection.integration_type}
Account: ${connection.config.account_id}
Region: ${connection.config.region}

Analyze:
1. IAM permissions and roles (least privilege)
2. Network security (VPC, security groups, NACLs)
3. Data encryption (at rest and in transit)
4. Logging and monitoring (CloudTrail, CloudWatch)
5. Compliance (PCI-DSS, HIPAA, SOC2)
6. Cost optimization opportunities
7. Resource configurations (S3 buckets, RDS, Lambda)`,
        {
          type: "object",
          properties: {
            security_score: { type: "number" },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  finding: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            compliance_status: { type: "object" },
            cost_insights: { type: "string" }
          }
        }
      );

      await base44.entities.IntegrationConnection.update(connection.id, {
        sync_status: {
          message: "Deployment security scan completed",
          last_scan: analysis
        }
      });
    } catch (error) {
      console.error("Deployment scan error:", error);
    }
    setScanning(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-purple-600" />
            Cloud Provider Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.icon} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account-id">Account ID</Label>
            <Input
              id="account-id"
              placeholder="123456789012"
              value={config.account_id}
              onChange={(e) => setConfig({ ...config, account_id: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              placeholder="us-east-1"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
            />
          </div>

          <Button onClick={connectProvider} disabled={loading || !config.account_id}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Cloud className="w-4 h-4 mr-2" />}
            Connect {providers.find(p => p.value === provider)?.label}
          </Button>
        </CardContent>
      </Card>

      {connections.map((conn) => (
        <Card key={conn.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{conn.name}</CardTitle>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">Account: </span>
              <span className="font-mono">{conn.config.account_id}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Region: </span>
              <span className="font-mono">{conn.config.region}</span>
            </div>

            <Button onClick={() => scanDeployment(conn)} disabled={scanning} className="w-full">
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              Scan Deployment Security
            </Button>

            {conn.sync_status?.last_scan && (
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-semibold text-blue-900">
                  Security Score: {conn.sync_status.last_scan.security_score}/100
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  {conn.sync_status.last_scan.findings?.length || 0} findings detected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};