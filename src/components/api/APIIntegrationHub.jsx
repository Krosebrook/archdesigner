import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Code, Activity, FileText, Loader2 } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { APIExplorer } from "./APIExplorer";
import { APIMonitor } from "./APIMonitor";
import { invokeLLM } from "../shared/AILLMProvider";

export default function APIIntegrationHub({ project, services }) {
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, [project.id]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.APIIntegration.filter({ project_id: project.id });
      setIntegrations(data);
      if (data.length > 0 && !selectedIntegration) {
        setSelectedIntegration(data[0]);
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
    }
    setLoading(false);
  };

  const generateAPISpec = async (service) => {
    setGenerating(true);
    try {
      const spec = await invokeLLM(
        `Generate REST API specification for this service.

Service: ${service.name}
Description: ${service.description}
Technologies: ${service.technologies?.join(', ')}

Generate:
1. Base URL structure
2. Authentication method
3. 5-8 RESTful endpoints with:
   - Method (GET/POST/PUT/DELETE)
   - Path with parameters
   - Request/response schemas
   - Description

Return as structured JSON.`,
        {
          type: "object",
          properties: {
            base_url: { type: "string" },
            auth_type: { type: "string" },
            endpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  method: { type: "string" },
                  path: { type: "string" },
                  description: { type: "string" },
                  request_schema: { type: "object" },
                  response_schema: { type: "object" }
                }
              }
            }
          }
        }
      );

      const integration = await base44.entities.APIIntegration.create({
        project_id: project.id,
        service_id: service.id,
        name: `${service.name} API`,
        base_url: spec.base_url,
        auth_type: spec.auth_type,
        endpoints: spec.endpoints,
        status: "active"
      });

      setIntegrations([...integrations, integration]);
      setSelectedIntegration(integration);
      setShowCreate(false);
    } catch (error) {
      console.error("Error generating API spec:", error);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Code}
        title="API Integration Hub"
        description="Test, monitor, and document your APIs with AI-powered tools"
        gradient="from-cyan-900 via-blue-900 to-indigo-900"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {integrations.map(int => (
            <Button
              key={int.id}
              variant={selectedIntegration?.id === int.id ? "default" : "outline"}
              onClick={() => setSelectedIntegration(int)}
              className="flex items-center gap-2"
            >
              {int.name}
              <Badge className={int.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                {int.metrics?.total_requests || 0}
              </Badge>
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add API
        </Button>
      </div>

      {selectedIntegration ? (
        <Tabs defaultValue="explorer">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="explorer">
              <Code className="w-4 h-4 mr-2" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <Activity className="w-4 h-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="w-4 h-4 mr-2" />
              Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explorer">
            <APIExplorer integration={selectedIntegration} onTest={loadIntegrations} />
          </TabsContent>

          <TabsContent value="monitor">
            <APIMonitor integration={selectedIntegration} />
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Base URL</Label>
                    <code className="block bg-gray-100 p-2 rounded font-mono text-sm">
                      {selectedIntegration.base_url}
                    </code>
                  </div>
                  <div>
                    <Label>Authentication</Label>
                    <Badge>{selectedIntegration.auth_type}</Badge>
                  </div>
                  <div>
                    <Label>Endpoints ({selectedIntegration.endpoints?.length || 0})</Label>
                    <div className="space-y-2 mt-2">
                      {selectedIntegration.endpoints?.map((ep, i) => (
                        <div key={i} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge>{ep.method}</Badge>
                            <code className="text-sm">{ep.path}</code>
                          </div>
                          <p className="text-sm text-gray-600">{ep.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No API integrations yet. Add one to get started.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Integration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select a service to generate API specifications</p>
            <div className="space-y-2">
              {services.map(service => (
                <Button
                  key={service.id}
                  variant="outline"
                  onClick={() => generateAPISpec(service)}
                  disabled={generating}
                  className="w-full justify-start"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Code className="w-4 h-4 mr-2" />
                  )}
                  {service.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}