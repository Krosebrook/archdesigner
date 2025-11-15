import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid3x3,
  Trash2,
  Link as LinkIcon,
  Sparkles
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const categoryColors = {
  core: "bg-blue-500",
  integration: "bg-purple-500",
  storage: "bg-green-500",
  ai: "bg-pink-500",
  analytics: "bg-orange-500",
  security: "bg-red-500",
  ui: "bg-cyan-500"
};

const severityColors = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e"
};

export default function VisualEditor({ services, onUpdateService, onDeleteService }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleAutoLayout = async () => {
    const radius = 250;
    const centerX = 400;
    const centerY = 300;
    
    const updates = services.map((service, index) => {
      const angle = (index / services.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return onUpdateService(service.id, {
        position: { x, y }
      });
    });

    await Promise.all(updates);
  };

  const handleServiceDragStart = (e, service) => {
    e.stopPropagation();
    setDragging({
      serviceId: service.id,
      startX: e.clientX,
      startY: e.clientY,
      initialPos: service.position || { x: 0, y: 0 }
    });
  };

  const handleServiceDrag = (e) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / zoom;
      const dy = (e.clientY - dragging.startY) / zoom;
      
      const newPos = {
        x: dragging.initialPos.x + dx,
        y: dragging.initialPos.y + dy
      };

      onUpdateService(dragging.serviceId, { position: newPos });
    }
  };

  const handleServiceDragEnd = () => {
    setDragging(null);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (dragging) {
      handleServiceDrag(e);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    handleServiceDragEnd();
  };

  const handleStartConnection = (e, serviceId) => {
    e.stopPropagation();
    setConnecting(serviceId);
  };

  const handleCompleteConnection = (targetServiceId) => {
    if (connecting && connecting !== targetServiceId) {
      const sourceService = services.find(s => s.id === connecting);
      const currentDeps = sourceService.depends_on || [];
      
      if (!currentDeps.includes(targetServiceId)) {
        onUpdateService(connecting, {
          depends_on: [...currentDeps, targetServiceId]
        });
      }
    }
    setConnecting(null);
  };

  const handleRemoveConnection = (sourceId, targetId) => {
    const sourceService = services.find(s => s.id === sourceId);
    const updatedDeps = (sourceService.depends_on || []).filter(id => id !== targetId);
    onUpdateService(sourceId, { depends_on: updatedDeps });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mouseup', handleCanvasMouseUp);
      canvas.addEventListener('mousemove', handleCanvasMouseMove);
      
      return () => {
        canvas.removeEventListener('mouseup', handleCanvasMouseUp);
        canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      };
    }
  }, [isPanning, dragging, panStart, pan]);

  const generateAISuggestions = async () => {
    if (services.length === 0) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const serviceDescriptions = services.map(s => `
- ${s.name}: ${s.description}
  Category: ${s.category}
  Technologies: ${(s.technologies || []).join(', ')}
  Dependencies: ${(s.depends_on || []).length}`).join('\n');

      const prompt = `Analyze this service architecture and provide layout improvement suggestions:

SERVICES:${serviceDescriptions}

Provide:
1. Severity assessment for each service (critical/high/medium/low)
2. Suggested groupings by domain
3. Missing connections that should exist`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            service_severities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  severity: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            suggested_groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  group_name: { type: "string" },
                  services: { type: "array", items: { type: "string" } },
                  rationale: { type: "string" }
                }
              }
            },
            suggested_connections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiSuggestions(result);
      setShowAIOverlay(true);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
    }
    setIsGeneratingSuggestions(false);
  };

  const applyAutoGroupLayout = () => {
    if (!aiSuggestions?.suggested_groups) return;

    const groups = aiSuggestions.suggested_groups;
    const radius = 200;
    const centerX = 400;
    const centerY = 300;

    groups.forEach((group, groupIndex) => {
      const groupAngle = (groupIndex / groups.length) * 2 * Math.PI;
      const groupCenterX = centerX + radius * 1.5 * Math.cos(groupAngle);
      const groupCenterY = centerY + radius * 1.5 * Math.sin(groupAngle);

      group.services.forEach((serviceName, serviceIndex) => {
        const service = services.find(s => s.name === serviceName);
        if (!service) return;

        const serviceAngle = (serviceIndex / group.services.length) * 2 * Math.PI;
        const x = groupCenterX + 80 * Math.cos(serviceAngle);
        const y = groupCenterY + 80 * Math.sin(serviceAngle);

        onUpdateService(service.id, { position: { x, y } });
      });
    });
  };

  const getServiceSeverity = (serviceName) => {
    if (!aiSuggestions?.service_severities) return null;
    const match = aiSuggestions.service_severities.find(s => s.service_name === serviceName);
    return match?.severity;
  };

  const renderConnections = () => {
    return services.map(service => {
      if (!service.depends_on || !service.position) return null;
      
      return service.depends_on.map(targetId => {
        const targetService = services.find(s => s.id === targetId);
        if (!targetService || !targetService.position) return null;

        const sourcePos = service.position;
        const targetPos = targetService.position;

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const angle = Math.atan2(dy, dx);
        
        const sourceX = sourcePos.x + 60 + Math.cos(angle) * 40;
        const sourceY = sourcePos.y + 40 + Math.sin(angle) * 40;
        const targetX = targetPos.x + 60 - Math.cos(angle) * 40;
        const targetY = targetPos.y + 40 - Math.sin(angle) * 40;

        return (
          <g key={`${service.id}-${targetId}`}>
            <line
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <circle
              cx={(sourceX + targetX) / 2}
              cy={(sourceY + targetY) / 2}
              r="8"
              fill="white"
              stroke="#94a3b8"
              strokeWidth="2"
              className="cursor-pointer hover:fill-red-100"
              onClick={() => handleRemoveConnection(service.id, targetId)}
            />
          </g>
        );
      });
    });
  };

  return (
    <Card className="bg-white shadow-lg border-0 overflow-hidden">
      <div className="border-b border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-blue-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoom >= 2}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetView}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleAutoLayout} className="bg-white">
              <Grid3x3 className="w-4 h-4 mr-2" />
              Auto Layout
            </Button>
            <Button
              size="sm"
              variant={showAIOverlay ? "default" : "outline"}
              onClick={generateAISuggestions}
              disabled={isGeneratingSuggestions || services.length === 0}
              className={showAIOverlay ? "bg-purple-600 text-white" : "bg-white"}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGeneratingSuggestions ? "Analyzing..." : "AI Insights"}
            </Button>
            {aiSuggestions && (
              <Button size="sm" variant="outline" onClick={applyAutoGroupLayout} className="bg-white">
                Apply Groups
              </Button>
            )}
            {connecting && (
              <Badge className="bg-blue-500 text-white">Click to connect</Badge>
            )}
          </div>
        </div>
      </div>

      {showAIOverlay && aiSuggestions && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Layout Suggestions
            </h4>
            <button onClick={() => setShowAIOverlay(false)} className="text-gray-500 hover:text-gray-700 text-xl">
              ×
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {aiSuggestions.service_severities && aiSuggestions.service_severities.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Service Health</h5>
                <div className="space-y-1">
                  {aiSuggestions.service_severities.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="truncate">{item.service_name}</span>
                      <Badge 
                        className="text-xs"
                        style={{ 
                          backgroundColor: severityColors[item.severity] || severityColors.low,
                          color: 'white'
                        }}
                      >
                        {item.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiSuggestions.suggested_groups && aiSuggestions.suggested_groups.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Suggested Groups</h5>
                <div className="space-y-1">
                  {aiSuggestions.suggested_groups.slice(0, 3).map((group, idx) => (
                    <div key={idx} className="text-xs">
                      <strong>{group.group_name}:</strong> {group.services.length} services
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiSuggestions.suggested_connections && aiSuggestions.suggested_connections.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Suggested Connections</h5>
                <div className="space-y-1">
                  {aiSuggestions.suggested_connections.slice(0, 3).map((conn, idx) => (
                    <div key={idx} className="text-xs">
                      {conn.from} → {conn.to}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        className="relative bg-gradient-to-br from-slate-50 to-blue-50/30 overflow-hidden"
        style={{ 
          height: "600px",
          cursor: isPanning ? "grabbing" : dragging ? "grabbing" : "grab"
        }}
        onMouseDown={handleCanvasMouseDown}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>
          <g className="pointer-events-auto">
            {renderConnections()}
          </g>
        </svg>

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%"
          }}
        >
          {services.map(service => {
            const position = service.position || { x: 100, y: 100 };
            const severity = showAIOverlay ? getServiceSeverity(service.name) : null;
            const severityColor = severity ? severityColors[severity] : null;
            
            return (
              <Popover key={service.id}>
                <PopoverTrigger asChild>
                  <div
                    className="absolute bg-white rounded-xl shadow-lg border-2 hover:border-blue-400 transition-all duration-200 cursor-move group"
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      width: "120px",
                      zIndex: selectedService === service.id ? 10 : 1,
                      borderColor: severityColor || '#e5e7eb',
                      boxShadow: severityColor ? `0 0 0 2px ${severityColor}40` : undefined
                    }}
                    onMouseDown={(e) => handleServiceDragStart(e, service)}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className={`h-2 ${categoryColors[service.category] || 'bg-gray-400'} rounded-t-xl`} />
                    <div className="p-3">
                      <div className="text-2xl mb-1 text-center">{service.icon || "⚙️"}</div>
                      <div className="text-xs font-semibold text-gray-900 text-center mb-2 line-clamp-2">
                        {service.name}
                      </div>
                      {severity && showAIOverlay && (
                        <Badge 
                          className="text-xs mx-auto block w-fit mb-1"
                          style={{ backgroundColor: severityColor, color: 'white' }}
                        >
                          {severity}
                        </Badge>
                      )}
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1 rounded bg-blue-100 hover:bg-blue-200"
                          onClick={(e) => handleStartConnection(e, service.id)}
                          title="Add connection"
                        >
                          <LinkIcon className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          className="p-1 rounded bg-red-100 hover:bg-red-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteService(service.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                    {connecting === service.id && (
                      <div className="absolute inset-0 border-4 border-blue-500 rounded-xl animate-pulse" />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                    <Badge className={`${categoryColors[service.category]} text-white`}>
                      {service.category}
                    </Badge>
                    {service.technologies && service.technologies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Technologies:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.technologies.map((tech, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {service.apis && service.apis.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">APIs:</p>
                        <div className="space-y-1">
                          {service.apis.slice(0, 3).map((api, i) => (
                            <div key={i} className="text-xs text-gray-600 bg-gray-50 p-1 rounded">
                              {api.endpoint}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {services.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Grid3x3 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-500">Add services to visualize your architecture</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}