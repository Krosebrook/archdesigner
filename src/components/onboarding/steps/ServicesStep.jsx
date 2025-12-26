import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Code2, Sparkles, Loader2, FileCode } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

export default function ServicesStep({ data, onComplete, onSkipToReview }) {
  const [services, setServices] = useState(data.services || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    if (services.length === 0 && data.projectInfo?.name) {
      generateServices();
    } else {
      setSelectedServices(services.map((_, i) => i));
    }
  }, []);

  useEffect(() => {
    const selected = services.filter((_, i) => selectedServices.includes(i));
    onComplete(selected);
  }, [selectedServices, services]);

  const generateServices = async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are an expert microservices architect. Based on this project, design the optimal microservices architecture:

PROJECT: ${data.projectInfo.name}
DESCRIPTION: ${data.projectInfo.description}
CATEGORY: ${data.projectInfo.category}
ARCHITECTURE: ${data.architecture?.pattern}
TECHNOLOGIES: ${data.architecture?.technologies?.join(', ')}
GOALS: ${data.projectInfo.goals}

Design 4-8 core microservices with:
1. Service name and purpose
2. Category (api, database, frontend, backend, auth, analytics, messaging, storage)
3. Recommended technologies
4. Key API endpoints
5. Database schema (if applicable)
6. Boilerplate code structure
7. Dockerfile configuration
8. Dependencies on other services

Make it production-ready and follow best practices for the chosen architecture pattern.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  technologies: { type: "array", items: { type: "string" } },
                  endpoints: { 
                    type: "array", 
                    items: {
                      type: "object",
                      properties: {
                        method: { type: "string" },
                        path: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  },
                  database_schema: { type: "string" },
                  boilerplate_code: { type: "string" },
                  dockerfile: { type: "string" },
                  dependencies: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setServices(result.services);
      setSelectedServices(result.services.map((_, i) => i));
      toast.success(`Generated ${result.services.length} services!`);
    } catch (error) {
      console.error("Service generation failed:", error);
      toast.error("Failed to generate services");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleService = (index) => {
    setSelectedServices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">Generating Microservices...</h3>
          <p className="text-gray-600">AI is designing your optimal architecture</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Code2 className="w-5 h-5" />
            Generated Microservices
          </CardTitle>
          <CardDescription className="text-blue-700">
            AI has designed {services.length} services with boilerplate code, APIs, and Docker configs
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedServices.length} of {services.length} services selected
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedServices(services.map((_, i) => i))}
        >
          Select All
        </Button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {services.map((service, index) => (
          <Card
            key={index}
            className={`transition-all ${
              selectedServices.includes(index)
                ? "border-2 border-blue-500 bg-blue-50/50"
                : "border border-gray-200"
            }`}
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedServices.includes(index)}
                  onCheckedChange={() => toggleService(index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Technologies</div>
                <div className="flex flex-wrap gap-2">
                  {service.technologies?.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {service.endpoints?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">API Endpoints</div>
                  <div className="space-y-1">
                    {service.endpoints.slice(0, 3).map((ep, i) => (
                      <div key={i} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        <span className="text-blue-600 font-bold">{ep.method}</span> {ep.path}
                      </div>
                    ))}
                    {service.endpoints.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{service.endpoints.length - 3} more endpoints
                      </div>
                    )}
                  </div>
                </div>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold mb-2">
                  <FileCode className="w-3 h-3 inline mr-1" />
                  View Boilerplate Code
                </summary>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-xs">
                  {service.boilerplate_code}
                </pre>
              </details>

              {service.dependencies?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">Dependencies</div>
                  <div className="text-xs text-gray-600">
                    {service.dependencies.join(", ")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={generateServices}
          variant="outline"
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Regenerate Services
        </Button>
        <Button
          onClick={onSkipToReview}
          variant="outline"
          className="flex-1"
        >
          Skip to Review
        </Button>
      </div>
    </div>
  );
}

ServicesStep.propTypes = {
  data: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired,
  onSkipToReview: PropTypes.func.isRequired
};