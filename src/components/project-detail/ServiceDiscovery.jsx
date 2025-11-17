import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Lightbulb, AlertTriangle, TrendingUp, CheckCircle2, DollarSign, Zap } from "lucide-react";
import { motion } from "framer-motion";

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200"
};

export default function ServiceDiscovery({ project, services }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveries, setDiscoveries] = useState([]);
  const [latestDiscovery, setLatestDiscovery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDiscoveries();
  }, [project?.id]);

  const loadDiscoveries = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.ServiceDiscovery.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setDiscoveries(data);
      if (data.length > 0) {
        setLatestDiscovery(data[0]);
      }
    } catch (error) {
      console.error("Error loading discoveries:", error);
    }
    setIsLoading(false);
  };

  const analyzeArchitecture = async () => {
    setIsAnalyzing(true);
    try {
      const servicesContext = services.map(s => `
- ${s.name} (${s.category}): ${s.description}
  Tech: ${(s.technologies || []).join(', ')}
  APIs: ${(s.apis || []).length}
      `).join('\n');

      const prompt = `You are a microservices architecture expert. Analyze this project and suggest missing services that would improve the architecture.

PROJECT: ${project.name} (${project.category})
DESCRIPTION: ${project.description}

EXISTING SERVICES:
${servicesContext}

Identify:
1. Missing critical services (authentication, logging, monitoring, etc.)
2. Services that would improve scalability
3. Services that follow best practices
4. Architecture gaps

For each suggested service provide:
- name: Specific service name
- category: core/integration/storage/ai/analytics/security/ui
- rationale: Why this service is needed
- benefits: Array of specific benefits
- estimated_complexity: low/medium/high
- priority: high/medium/low
- suggested_architectural_patterns: Array of patterns (e.g., "CQRS", "Event Sourcing", "Circuit Breaker")
- cost_implications: Brief description of infrastructure/operational costs
- performance_impact: Expected impact on system performance

Also provide:
- gaps_identified: Array of architecture gaps
- architecture_recommendations: General recommendations

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  rationale: { type: "string" },
                  benefits: { type: "array", items: { type: "string" } },
                  estimated_complexity: { type: "string" },
                  priority: { type: "string" },
                  suggested_architectural_patterns: { type: "array", items: { type: "string" } },
                  cost_implications: { type: "string" },
                  performance_impact: { type: "string" }
                }
              }
            },
            gaps_identified: { type: "array", items: { type: "string" } },
            architecture_recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      const newDiscovery = await base44.entities.ServiceDiscovery.create({
        project_id: project.id,
        suggested_services: result.suggested_services || [],
        gaps_identified: result.gaps_identified || [],
        architecture_recommendations: result.architecture_recommendations || []
      });

      setLatestDiscovery(newDiscovery);
      await loadDiscoveries();
    } catch (error) {
      console.error("Error analyzing architecture:", error);
    }
    setIsAnalyzing(false);
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
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            AI Service Discovery
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Automatically identify missing services and architecture gaps with enhanced insights
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzeArchitecture}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Architecture...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Discover Missing Services
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestDiscovery && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {latestDiscovery.gaps_identified && latestDiscovery.gaps_identified.length > 0 && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="w-5 h-5" />
                  Architecture Gaps Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {latestDiscovery.gaps_identified.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-orange-900">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{gap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {latestDiscovery.suggested_services && latestDiscovery.suggested_services.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Suggested Services ({latestDiscovery.suggested_services.length})
              </h3>
              {latestDiscovery.suggested_services.map((service, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-white border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <Badge variant="outline" className="mt-1">{service.category}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={priorityColors[service.priority]}>
                            {service.priority} priority
                          </Badge>
                          <Badge variant="outline">{service.estimated_complexity}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{service.rationale}</p>
                      
                      {service.benefits && service.benefits.length > 0 && (
                        <div className="bg-green-50 rounded p-3 mb-3">
                          <p className="text-xs font-semibold text-green-900 mb-2">Benefits:</p>
                          <ul className="space-y-1">
                            {service.benefits.map((benefit, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-green-800">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Enhanced Insights */}
                      <div className="grid md:grid-cols-3 gap-3 mt-3">
                        {service.suggested_architectural_patterns && service.suggested_architectural_patterns.length > 0 && (
                          <div className="bg-purple-50 rounded p-3">
                            <p className="text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Patterns
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {service.suggested_architectural_patterns.map((pattern, k) => (
                                <Badge key={k} variant="outline" className="text-xs">{pattern}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {service.cost_implications && (
                          <div className="bg-blue-50 rounded p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Cost Impact
                            </p>
                            <p className="text-xs text-blue-800">{service.cost_implications}</p>
                          </div>
                        )}

                        {service.performance_impact && (
                          <div className="bg-yellow-50 rounded p-3">
                            <p className="text-xs font-semibold text-yellow-900 mb-1 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Performance
                            </p>
                            <p className="text-xs text-yellow-800">{service.performance_impact}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {latestDiscovery.architecture_recommendations && latestDiscovery.architecture_recommendations.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <TrendingUp className="w-5 h-5" />
                  Architecture Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {latestDiscovery.architecture_recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-blue-900">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}