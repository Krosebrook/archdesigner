import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const PatternSuggestions = ({ project, services }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyzePatternsNeeded = async () => {
    setLoading(true);
    try {
      const [cicd, discovery, docs] = await Promise.all([
        base44.entities.CICDConfiguration.filter({ project_id: project.id }),
        base44.entities.ServiceDiscovery.filter({ project_id: project.id }),
        base44.entities.KnowledgeBase.filter({ project_id: project.id })
      ]);

      const result = await invokeLLM(
        `Analyze this project and suggest essential code patterns, architectural patterns, and best practices.
        
        Project: ${project.name} (${project.category})
        Description: ${project.description}
        
        Services (${services.length}):
        ${services.map(s => `- ${s.name}: ${s.category}, Technologies: ${s.technologies?.join(', ')}`).join('\n')}
        
        Existing Setup:
        - CI/CD: ${cicd.length} configurations
        - Service Discovery: ${discovery.length} analyses
        - Documentation: ${docs.length} articles
        
        Provide detailed recommendations for:
        1. Design Patterns (e.g., Repository, Factory, Observer)
        2. Architectural Patterns (e.g., CQRS, Event Sourcing, Microservices patterns)
        3. Code Organization (folder structure, module boundaries)
        4. Common Utilities needed (logging, error handling, validation)
        5. Testing Strategies
        6. Security Best Practices
        
        For each, provide:
        - Why it's needed
        - Implementation priority (critical, high, medium, low)
        - Code example
        - Integration points with existing services`,
        {
          type: "object",
          properties: {
            design_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  why_needed: { type: "string" },
                  priority: { type: "string" },
                  example: { type: "string" },
                  services_affected: { type: "array", items: { type: "string" } }
                }
              }
            },
            architectural_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  benefits: { type: "array", items: { type: "string" } },
                  implementation_guide: { type: "string" }
                }
              }
            },
            code_structure: {
              type: "object",
              properties: {
                folder_structure: { type: "string" },
                module_boundaries: { type: "string" },
                naming_conventions: { type: "string" }
              }
            },
            utilities_needed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  purpose: { type: "string" },
                  priority: { type: "string" },
                  code_snippet: { type: "string" }
                }
              }
            },
            testing_strategy: {
              type: "object",
              properties: {
                unit_testing: { type: "string" },
                integration_testing: { type: "string" },
                e2e_testing: { type: "string" },
                tools_recommended: { type: "array", items: { type: "string" } }
              }
            },
            security_practices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  practice: { type: "string" },
                  why_important: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            }
          }
        }
      );

      setSuggestions(result);
    } catch (error) {
      console.error("Analysis error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    analyzePatternsNeeded();
  }, [project.id]);

  const priorityColors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-blue-100 text-blue-800 border-blue-300"
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) return null;

  return (
    <div className="space-y-6">
      {/* Design Patterns */}
      <Card className="border-l-4 border-purple-600">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            Design Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {suggestions.design_patterns?.map((pattern, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{pattern.name}</h3>
                  <Badge className={priorityColors[pattern.priority?.toLowerCase()] || priorityColors.medium}>
                    {pattern.priority} Priority
                  </Badge>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-700 mb-3">{pattern.why_needed}</p>
              {pattern.services_affected?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-600 block mb-1">Affects Services:</span>
                  <div className="flex flex-wrap gap-1">
                    {pattern.services_affected.map((svc, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{svc}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {pattern.example && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    View Example
                  </summary>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 mt-2 overflow-x-auto text-xs">
                    <code>{pattern.example}</code>
                  </pre>
                </details>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Architectural Patterns */}
      <Card className="border-l-4 border-indigo-600">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Architectural Patterns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {suggestions.architectural_patterns?.map((pattern, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                <Badge className={priorityColors[pattern.priority?.toLowerCase()] || priorityColors.medium}>
                  {pattern.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 mb-3">{pattern.description}</p>
              {pattern.benefits?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-600 block mb-2">Benefits:</span>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {pattern.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pattern.implementation_guide && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    Implementation Guide
                  </summary>
                  <div className="bg-indigo-50 rounded-lg p-3 mt-2 text-sm text-gray-800">
                    {pattern.implementation_guide}
                  </div>
                </details>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Utilities */}
      <Card className="border-l-4 border-green-600">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle>Essential Utilities</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.utilities_needed?.map((util, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-900">{util.name}</h4>
                  <Badge variant="outline" className={priorityColors[util.priority?.toLowerCase()]}>
                    {util.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{util.purpose}</p>
                {util.code_snippet && (
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold text-green-600 hover:text-green-700">
                      View Code
                    </summary>
                    <pre className="bg-gray-900 text-gray-100 rounded p-2 mt-2 overflow-x-auto text-xs">
                      <code>{util.code_snippet}</code>
                    </pre>
                  </details>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Structure */}
      {suggestions.code_structure && (
        <Card className="border-l-4 border-blue-600">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle>Recommended Code Structure</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Folder Structure</h4>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
                {suggestions.code_structure.folder_structure}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Module Boundaries</h4>
              <p className="text-sm text-gray-700">{suggestions.code_structure.module_boundaries}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Naming Conventions</h4>
              <p className="text-sm text-gray-700">{suggestions.code_structure.naming_conventions}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};