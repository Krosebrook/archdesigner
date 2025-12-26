import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Network, 
  Plus, 
  GitPullRequest, 
  MessageSquare,
  Radio,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";
import VisualEditor from "../project-detail/VisualEditor";

const COMMUNICATION_PATTERNS = [
  { value: "rest", label: "REST API", icon: "🌐", color: "bg-blue-500" },
  { value: "graphql", label: "GraphQL", icon: "⚡", color: "bg-purple-500" },
  { value: "grpc", label: "gRPC", icon: "🚀", color: "bg-green-500" },
  { value: "message_queue", label: "Message Queue", icon: "📨", color: "bg-orange-500" },
  { value: "websocket", label: "WebSocket", icon: "🔌", color: "bg-cyan-500" },
  { value: "event_bus", label: "Event Bus", icon: "📡", color: "bg-pink-500" }
];

export default function EnhancedVisualEditor({ project, services, onUpdateService, onDeleteService }) {
  const [showPatternSelector, setShowPatternSelector] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState("rest");
  const [connectionDescription, setConnectionDescription] = useState("");
  const [isGeneratingConnection, setIsGeneratingConnection] = useState(false);

  const handleDefineConnection = async () => {
    if (!connectionDescription.trim()) {
      toast.error("Please describe the connection");
      return;
    }

    setIsGeneratingConnection(true);
    try {
      const prompt = `You are a microservices architect. Based on this connection description, determine the communication pattern and routing:

CONNECTION: ${connectionDescription}

PROJECT CONTEXT:
- Services: ${services.map(s => s.name).join(", ")}
- Architecture: ${project.architecture_pattern}

Determine:
1. Which two services are communicating (from and to)
2. Best communication pattern (rest/graphql/grpc/message_queue/websocket/event_bus)
3. Data flow direction (unidirectional/bidirectional)
4. Protocol details (HTTP methods, message types, event names)
5. API endpoint or queue name
6. Whether API Gateway routing is needed
7. Service discovery configuration

Return as structured JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            from_service: { type: "string" },
            to_service: { type: "string" },
            pattern: { type: "string" },
            bidirectional: { type: "boolean" },
            endpoint: { type: "string" },
            method: { type: "string" },
            data_format: { type: "string" },
            requires_gateway: { type: "boolean" },
            gateway_route: { type: "string" },
            service_discovery_config: { type: "string" }
          }
        }
      });

      // Find the services
      const fromService = services.find(s => 
        s.name.toLowerCase().includes(result.from_service.toLowerCase()) ||
        result.from_service.toLowerCase().includes(s.name.toLowerCase())
      );
      const toService = services.find(s => 
        s.name.toLowerCase().includes(result.to_service.toLowerCase()) ||
        result.to_service.toLowerCase().includes(s.name.toLowerCase())
      );

      if (!fromService || !toService) {
        toast.error("Could not identify the services. Please be more specific.");
        setIsGeneratingConnection(false);
        return;
      }

      // Update the connection
      const currentDeps = fromService.depends_on || [];
      if (!currentDeps.includes(toService.id)) {
        await onUpdateService(fromService.id, {
          depends_on: [...currentDeps, toService.id],
          communication_patterns: {
            ...(fromService.communication_patterns || {}),
            [toService.id]: {
              pattern: result.pattern,
              endpoint: result.endpoint,
              method: result.method,
              bidirectional: result.bidirectional
            }
          }
        });
      }

      // Update API Gateway if needed
      if (result.requires_gateway) {
        const gateways = await base44.entities.APIGateway.filter({ project_id: project.id });
        
        if (gateways.length > 0) {
          const gateway = gateways[0];
          const newRoute = {
            path: result.gateway_route || result.endpoint,
            method: result.method || "GET",
            target_service: toService.name,
            timeout_ms: 30000
          };

          await base44.entities.APIGateway.update(gateway.id, {
            routes: [...(gateway.routes || []), newRoute]
          });

          toast.success("Updated API Gateway routing");
        } else {
          // Create new API Gateway
          await base44.entities.APIGateway.create({
            project_id: project.id,
            gateway_name: "Main API Gateway",
            routing_strategy: "round_robin",
            routes: [{
              path: result.gateway_route || result.endpoint,
              method: result.method || "GET",
              target_service: toService.name,
              timeout_ms: 30000
            }]
          });

          toast.success("Created API Gateway with routing");
        }
      }

      // Update Service Discovery
      const discoveries = await base44.entities.ServiceDiscovery.filter({ project_id: project.id });
      if (discoveries.length > 0) {
        const discovery = discoveries[0];
        const newPattern = {
          from_service: fromService.name,
          to_service: toService.name,
          pattern: result.pattern,
          protocol: result.data_format
        };

        await base44.entities.ServiceDiscovery.update(discovery.id, {
          communication_patterns: [...(discovery.communication_patterns || []), newPattern]
        });
      }

      toast.success(`Connected ${fromService.name} → ${toService.name} via ${result.pattern}`);
      setConnectionDescription("");
      setShowPatternSelector(false);
    } catch (error) {
      console.error("Connection generation failed:", error);
      toast.error("Failed to generate connection");
    } finally {
      setIsGeneratingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Network className="w-6 h-6" />
            Visual Architecture Designer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowPatternSelector(!showPatternSelector)}
              variant={showPatternSelector ? "default" : "outline"}
              className={showPatternSelector ? "bg-blue-600" : ""}
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Define Connection
            </Button>

            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMUNICATION_PATTERNS.map(pattern => (
                  <SelectItem key={pattern.value} value={pattern.value}>
                    <span className="flex items-center gap-2">
                      <span>{pattern.icon}</span>
                      {pattern.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showPatternSelector && (
            <div className="p-4 bg-white rounded-lg border-2 border-blue-200 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">AI-Powered Connection Definition</h4>
              </div>
              
              <Input
                placeholder="Example: 'User service calls Payment service via REST to process transactions'"
                value={connectionDescription}
                onChange={(e) => setConnectionDescription(e.target.value)}
                className="text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleDefineConnection}
                  disabled={isGeneratingConnection || !connectionDescription.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isGeneratingConnection ? (
                    <>Analyzing...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Connection
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPatternSelector(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs text-purple-900 font-medium mb-2">AI will automatically:</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>✓ Identify the services involved</li>
                  <li>✓ Determine the best communication pattern</li>
                  <li>✓ Create visual connection in the diagram</li>
                  <li>✓ Update API Gateway routing</li>
                  <li>✓ Configure service discovery</li>
                </ul>
              </div>
            </div>
          )}

          {/* Communication Pattern Legend */}
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Communication Patterns</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COMMUNICATION_PATTERNS.map(pattern => (
                <div key={pattern.value} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded-full ${pattern.color}`} />
                  <span className="text-gray-700">{pattern.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Original Visual Editor */}
      <VisualEditor
        services={services}
        onUpdateService={onUpdateService}
        onDeleteService={onDeleteService}
      />
    </div>
  );
}

EnhancedVisualEditor.propTypes = {
  project: PropTypes.object.isRequired,
  services: PropTypes.array.isRequired,
  onUpdateService: PropTypes.func.isRequired,
  onDeleteService: PropTypes.func.isRequired
};