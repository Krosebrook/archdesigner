import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileCode2, 
  Loader2,
  Download,
  Copy,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const specFormats = [
  { value: "openapi", label: "OpenAPI 3.0", icon: "📋" },
  { value: "swagger", label: "Swagger 2.0", icon: "📝" },
  { value: "graphql", label: "GraphQL Schema", icon: "⚡" },
  { value: "grpc", label: "gRPC Proto", icon: "🔧" }
];

export default function APIGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("openapi");
  const [selectedService, setSelectedService] = useState("all");
  const [specs, setSpecs] = useState([]);
  const [latestSpec, setLatestSpec] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSpecs();
  }, [project?.id]);

  const loadSpecs = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.APISpecification.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setSpecs(data);
      if (data.length > 0) {
        setLatestSpec(data[0]);
      }
    } catch (error) {
      console.error("Error loading API specs:", error);
    }
    setIsLoading(false);
  };

  const generateAPISpec = async () => {
    setIsGenerating(true);
    try {
      const targetServices = selectedService === "all" 
        ? services 
        : services.filter(s => s.id === selectedService);

      const servicesContext = targetServices.map(s => `
Service: ${s.name}
Description: ${s.description}
Category: ${s.category}
APIs:
${(s.apis || []).map(api => `  - ${api.method || 'GET'} ${api.endpoint}: ${api.description || ''}`).join('\n')}
Technologies: ${(s.technologies || []).join(', ')}
      `).join('\n\n');

      const formatInstructions = {
        openapi: 'Generate a complete OpenAPI 3.0 specification in YAML format',
        swagger: 'Generate a complete Swagger 2.0 specification in YAML format',
        graphql: 'Generate a complete GraphQL schema definition',
        grpc: 'Generate Protocol Buffer (proto3) definitions'
      };

      const prompt = `${formatInstructions[selectedFormat]} for this microservices architecture.

PROJECT: ${project.name}
DESCRIPTION: ${project.description}

SERVICES TO DOCUMENT:
${servicesContext}

Generate a comprehensive, production-ready API specification including:
- Complete endpoint definitions
- Request/response schemas
- Data models
- Authentication/authorization details
- Error responses
- Examples

Return as plain text (YAML/proto/schema format).`;

      const specContent = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      const endpointsCount = targetServices.reduce((sum, s) => sum + (s.apis?.length || 0), 0);

      const newSpec = await base44.entities.APISpecification.create({
        project_id: project.id,
        service_id: selectedService === "all" ? null : selectedService,
        format: selectedFormat,
        version: "1.0.0",
        spec_content: specContent,
        endpoints_count: endpointsCount,
        auto_generated: true
      });

      setLatestSpec(newSpec);
      await loadSpecs();
    } catch (error) {
      console.error("Error generating API spec:", error);
    }
    setIsGenerating(false);
  };

  const downloadSpec = () => {
    if (!latestSpec) return;
    
    const extensions = {
      openapi: 'yaml',
      swagger: 'yaml',
      graphql: 'graphql',
      grpc: 'proto'
    };
    
    const blob = new Blob([latestSpec.spec_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-spec-${project.name}-${latestSpec.format}.${extensions[latestSpec.format]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!latestSpec) return;
    
    navigator.clipboard.writeText(latestSpec.spec_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-green-600" />
            Automated API Specification Generator
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate OpenAPI, Swagger, GraphQL, or gRPC specifications automatically
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <span className="flex items-center gap-2">
                        <span>{format.icon}</span>
                        {format.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Service</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateAPISpec}
            disabled={isGenerating || services.length === 0}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating API Specification...
              </>
            ) : (
              <>
                <FileCode2 className="w-4 h-4 mr-2" />
                Generate {specFormats.find(f => f.value === selectedFormat)?.label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestSpec && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated API Specification</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(latestSpec.created_date), 'PPp')} • {latestSpec.format} • {latestSpec.endpoints_count} endpoints
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button onClick={downloadSpec} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  {latestSpec.spec_content}
                </pre>
              </div>
            </CardContent>
          </Card>

          {specs.length > 1 && (
            <Card className="bg-white border-0">
              <CardHeader>
                <CardTitle className="text-lg">Previous Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {specs.slice(1).map(spec => (
                    <div
                      key={spec.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <Badge variant="outline" className="mr-2">{spec.format}</Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(spec.created_date), 'PP')} • {spec.endpoints_count} endpoints
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLatestSpec(spec)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}