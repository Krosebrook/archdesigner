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
import { Plus, Code, Activity, FileText, Loader2, TrendingUp, AlertTriangle, Zap, Sparkles, CreditCard, Mail, Cloud, Database, MessageSquare, MapPin, Shield, BarChart3, Bell, Users } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { APIExplorer } from "./APIExplorer";
import { APIMonitor } from "./APIMonitor";
import { PredictiveMonitor } from "./PredictiveMonitor";
import { AnomalyDetector } from "./AnomalyDetector";
import { OptimizationEngine } from "./OptimizationEngine";
import { AnalyticsReport } from "./AnalyticsReport";
import { invokeLLM } from "../shared/AILLMProvider";

const TOP_APIS = [
  { 
    id: 'stripe', name: 'Stripe', icon: CreditCard, color: 'purple',
    base_url: 'https://api.stripe.com/v1', auth_type: 'bearer',
    endpoints: [
      { method: 'POST', path: '/customers', description: 'Create a customer' },
      { method: 'POST', path: '/payment_intents', description: 'Create payment intent' },
      { method: 'GET', path: '/charges', description: 'List all charges' },
      { method: 'POST', path: '/subscriptions', description: 'Create subscription' },
      { method: 'POST', path: '/refunds', description: 'Create refund' }
    ]
  },
  { 
    id: 'sendgrid', name: 'SendGrid', icon: Mail, color: 'blue',
    base_url: 'https://api.sendgrid.com/v3', auth_type: 'bearer',
    endpoints: [
      { method: 'POST', path: '/mail/send', description: 'Send email' },
      { method: 'GET', path: '/templates', description: 'List templates' },
      { method: 'GET', path: '/stats', description: 'Get email statistics' },
      { method: 'POST', path: '/contactdb/recipients', description: 'Add contacts' }
    ]
  },
  { 
    id: 'twilio', name: 'Twilio', icon: MessageSquare, color: 'red',
    base_url: 'https://api.twilio.com/2010-04-01', auth_type: 'basic',
    endpoints: [
      { method: 'POST', path: '/Messages', description: 'Send SMS' },
      { method: 'POST', path: '/Calls', description: 'Make voice call' },
      { method: 'GET', path: '/Messages', description: 'List messages' },
      { method: 'POST', path: '/Verify/Services', description: 'Create verification' }
    ]
  },
  { 
    id: 'aws-s3', name: 'AWS S3', icon: Cloud, color: 'orange',
    base_url: 'https://s3.amazonaws.com', auth_type: 'api_key',
    endpoints: [
      { method: 'PUT', path: '/{bucket}/{key}', description: 'Upload object' },
      { method: 'GET', path: '/{bucket}/{key}', description: 'Get object' },
      { method: 'DELETE', path: '/{bucket}/{key}', description: 'Delete object' },
      { method: 'GET', path: '/{bucket}', description: 'List bucket contents' }
    ]
  },
  { 
    id: 'firebase', name: 'Firebase', icon: Database, color: 'yellow',
    base_url: 'https://firestore.googleapis.com/v1', auth_type: 'bearer',
    endpoints: [
      { method: 'POST', path: '/documents', description: 'Create document' },
      { method: 'GET', path: '/documents/{docId}', description: 'Get document' },
      { method: 'PATCH', path: '/documents/{docId}', description: 'Update document' },
      { method: 'DELETE', path: '/documents/{docId}', description: 'Delete document' }
    ]
  },
  { 
    id: 'google-maps', name: 'Google Maps', icon: MapPin, color: 'green',
    base_url: 'https://maps.googleapis.com/maps/api', auth_type: 'api_key',
    endpoints: [
      { method: 'GET', path: '/geocode/json', description: 'Geocode address' },
      { method: 'GET', path: '/directions/json', description: 'Get directions' },
      { method: 'GET', path: '/place/details/json', description: 'Place details' },
      { method: 'GET', path: '/distancematrix/json', description: 'Distance matrix' }
    ]
  },
  { 
    id: 'auth0', name: 'Auth0', icon: Shield, color: 'indigo',
    base_url: 'https://{tenant}.auth0.com/api/v2', auth_type: 'bearer',
    endpoints: [
      { method: 'POST', path: '/users', description: 'Create user' },
      { method: 'GET', path: '/users/{id}', description: 'Get user' },
      { method: 'PATCH', path: '/users/{id}', description: 'Update user' },
      { method: 'POST', path: '/oauth/token', description: 'Get access token' }
    ]
  },
  { 
    id: 'mixpanel', name: 'Mixpanel', icon: BarChart3, color: 'pink',
    base_url: 'https://api.mixpanel.com', auth_type: 'basic',
    endpoints: [
      { method: 'POST', path: '/track', description: 'Track event' },
      { method: 'POST', path: '/engage', description: 'Update user profile' },
      { method: 'GET', path: '/events', description: 'Query events' },
      { method: 'GET', path: '/funnels', description: 'Get funnel data' }
    ]
  },
  { 
    id: 'slack', name: 'Slack', icon: Bell, color: 'emerald',
    base_url: 'https://slack.com/api', auth_type: 'bearer',
    endpoints: [
      { method: 'POST', path: '/chat.postMessage', description: 'Send message' },
      { method: 'GET', path: '/conversations.list', description: 'List channels' },
      { method: 'POST', path: '/files.upload', description: 'Upload file' },
      { method: 'GET', path: '/users.list', description: 'List users' }
    ]
  },
  { 
    id: 'github', name: 'GitHub', icon: Users, color: 'gray',
    base_url: 'https://api.github.com', auth_type: 'bearer',
    endpoints: [
      { method: 'GET', path: '/repos/{owner}/{repo}', description: 'Get repository' },
      { method: 'POST', path: '/repos/{owner}/{repo}/issues', description: 'Create issue' },
      { method: 'GET', path: '/repos/{owner}/{repo}/pulls', description: 'List PRs' },
      { method: 'POST', path: '/repos/{owner}/{repo}/commits', description: 'Create commit' }
    ]
  }
];

export default function APIIntegrationHub({ project, services }) {
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTopAPIs, setShowTopAPIs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingAPI, setAddingAPI] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadIntegrations();
  }, [project.id]);

  useEffect(() => {
    if (selectedIntegration) {
      loadLogs();
    }
  }, [selectedIntegration?.id]);

  const loadLogs = async () => {
    if (!selectedIntegration) return;
    try {
      const data = await base44.entities.APILog.filter(
        { integration_id: selectedIntegration.id },
        '-created_date',
        200
      );
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
    }
  };

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

  const addTopAPI = async (api) => {
    setAddingAPI(api.id);
    try {
      const integration = await base44.entities.APIIntegration.create({
        project_id: project.id,
        name: api.name,
        base_url: api.base_url,
        auth_type: api.auth_type,
        endpoints: api.endpoints,
        status: "active",
        metrics: { total_requests: 0, success_rate: 100, avg_response_time: 0 }
      });
      setIntegrations([...integrations, integration]);
      setSelectedIntegration(integration);
      setShowTopAPIs(false);
    } catch (error) {
      console.error("Error adding API:", error);
    }
    setAddingAPI(null);
  };

  const enabledAPIIds = integrations.map(i => 
    TOP_APIS.find(a => i.name === a.name)?.id
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Code}
        title="API Integration Hub"
        description="Test, monitor, and document your APIs with AI-powered tools"
        gradient="from-cyan-900 via-blue-900 to-indigo-900"
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
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
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTopAPIs(true)} 
            variant="outline"
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-400"
          >
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            Top 10 APIs
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Custom API
          </Button>
        </div>
      </div>

      {selectedIntegration ? (
        <Tabs defaultValue="explorer">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="explorer">
              <Code className="w-4 h-4 mr-2" />
              Test
            </TabsTrigger>
            <TabsTrigger value="monitor">
              <Activity className="w-4 h-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="predictive">
              <TrendingUp className="w-4 h-4 mr-2" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="anomaly">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Anomaly
            </TabsTrigger>
            <TabsTrigger value="optimize">
              <Zap className="w-4 h-4 mr-2" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="report">
              <FileText className="w-4 h-4 mr-2" />
              Report
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="w-4 h-4 mr-2" />
              Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explorer">
            <APIExplorer integration={selectedIntegration} onTest={() => { loadIntegrations(); loadLogs(); }} />
          </TabsContent>

          <TabsContent value="monitor">
            <APIMonitor integration={selectedIntegration} />
          </TabsContent>

          <TabsContent value="predictive">
            <PredictiveMonitor integration={selectedIntegration} logs={logs} />
          </TabsContent>

          <TabsContent value="anomaly">
            <AnomalyDetector integration={selectedIntegration} logs={logs} />
          </TabsContent>

          <TabsContent value="optimize">
            <OptimizationEngine integration={selectedIntegration} logs={logs} />
          </TabsContent>

          <TabsContent value="report">
            <AnalyticsReport integration={selectedIntegration} logs={logs} />
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

      <Dialog open={showTopAPIs} onOpenChange={setShowTopAPIs}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Top 10 Essential APIs
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Instantly add pre-configured integrations for the most popular APIs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TOP_APIS.map(api => {
              const Icon = api.icon;
              const isEnabled = enabledAPIIds.includes(api.id);
              const isAdding = addingAPI === api.id;
              
              return (
                <Card 
                  key={api.id} 
                  className={`transition-all duration-300 ${
                    isEnabled 
                      ? 'bg-green-50 border-green-300' 
                      : 'hover:shadow-lg hover:border-purple-300 cursor-pointer'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${api.color}-100 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${api.color}-600`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{api.name}</h4>
                          <p className="text-xs text-gray-500">{api.endpoints.length} endpoints</p>
                        </div>
                      </div>
                      {isEnabled ? (
                        <Badge className="bg-green-600">Enabled</Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => addTopAPI(api)}
                          disabled={isAdding}
                          className="bg-gradient-to-r from-purple-600 to-blue-600"
                        >
                          {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {api.endpoints.slice(0, 3).map((ep, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ep.method}
                        </Badge>
                      ))}
                      {api.endpoints.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{api.endpoints.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}