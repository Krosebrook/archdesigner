import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cloud, Loader2, Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { invokeLLM } from "../shared/AILLMProvider";
import { motion } from "framer-motion";

export const CloudDeploymentEngine = ({ project, services }) => {
  const [connections, setConnections] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deploymentPlan, setDeploymentPlan] = useState(null);

  useEffect(() => {
    loadConnections();
  }, [project.id]);

  const loadConnections = async () => {
    const data = await base44.entities.IntegrationConnection.filter({
      project_id: project.id,
      integration_type: { $in: ["aws", "azure", "gcp"] }
    });
    setConnections(data);
  };

  const generateDeploymentPlan = async () => {
    setDeploying(true);
    try {
      const provider = connections.find(c => c.id === selectedProvider);
      
      const plan = await invokeLLM(
        `Generate cloud deployment plan for microservices.

Project: ${project.name}
Cloud Provider: ${provider.integration_type.toUpperCase()}
Services: ${services.map(s => `${s.name} (${s.category})`).join(', ')}

Generate:
1. Infrastructure requirements per service
2. Deployment commands/scripts
3. Service mesh configuration
4. Load balancer setup
5. Auto-scaling policies
6. Cost estimation`,
        {
          type: "object",
          properties: {
            services_config: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  infrastructure: { type: "string" },
                  deployment_command: { type: "string" },
                  estimated_cost: { type: "string" }
                }
              }
            },
            networking: { type: "string" },
            monitoring: { type: "string" },
            total_monthly_cost: { type: "string" }
          }
        }
      );

      setDeploymentPlan(plan);

      // Update CI/CD config with deployment
      const cicdConfigs = await base44.entities.CICDConfiguration.filter({ project_id: project.id });
      if (cicdConfigs.length > 0) {
        await base44.entities.CICDConfiguration.update(cicdConfigs[0].id, {
          cloud_deployment: {
            provider: provider.integration_type,
            connection_id: provider.id,
            auto_deploy_enabled: true
          }
        });
      }
    } catch (error) {
      console.error("Deployment planning error:", error);
    }
    setDeploying(false);
  };

  const cloudProviders = {
    aws: { name: "AWS", color: "orange" },
    azure: { name: "Azure", color: "blue" },
    gcp: { name: "GCP", color: "green" }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            Cloud Deployment Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select cloud provider" />
              </SelectTrigger>
              <SelectContent>
                {connections.map(conn => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {cloudProviders[conn.integration_type]?.name || conn.integration_type} - {conn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateDeploymentPlan} disabled={deploying || !selectedProvider}>
              {deploying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
              Plan Deployment
            </Button>
          </div>

          {connections.length === 0 && (
            <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <p className="text-sm text-gray-700">No cloud providers connected</p>
              <p className="text-xs text-gray-600 mt-1">Connect AWS, Azure, or GCP in the Integrations tab</p>
            </div>
          )}
        </CardContent>
      </Card>

      {deploymentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-l-4 border-green-600">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Deployment Plan Ready</CardTitle>
                <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                  {deploymentPlan.total_monthly_cost}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {deploymentPlan.services_config?.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{svc.service_name}</CardTitle>
                      <Badge variant="outline">{svc.estimated_cost}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Infrastructure</p>
                      <p className="text-sm text-gray-800">{svc.infrastructure}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Deployment Command</p>
                      <pre className="bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-x-auto">
                        <code>{svc.deployment_command}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Networking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{deploymentPlan.networking}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{deploymentPlan.monitoring}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
};