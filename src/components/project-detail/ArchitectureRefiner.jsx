import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";

const refinementTypes = [
  { value: "service_decomposition", label: "Service Decomposition", desc: "Split monolithic services" },
  { value: "pattern_introduction", label: "Pattern Introduction", desc: "Add design patterns" },
  { value: "scaling_optimization", label: "Scaling Optimization", desc: "Optimize for scale" },
  { value: "full_redesign", label: "Full Redesign", desc: "Complete architecture overhaul" }
];

const effortColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800"
};

export default function ArchitectureRefiner({ project, services }) {
  const [isRefining, setIsRefining] = useState(false);
  const [selectedType, setSelectedType] = useState("service_decomposition");
  const [refinements, setRefinements] = useState([]);
  const [latestRefinement, setLatestRefinement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRefinements();
  }, [project?.id]);

  const loadRefinements = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.ArchitectureRefinement.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setRefinements(data);
      if (data.length > 0) {
        setLatestRefinement(data[0]);
      }
    } catch (error) {
      console.error("Error loading refinements:", error);
    }
    setIsLoading(false);
  };

  const runRefinement = async () => {
    setIsRefining(true);
    try {
      const servicesContext = services.map(s => `
Service: ${s.name}
Category: ${s.category}
Description: ${s.description}
Technologies: ${(s.technologies || []).join(', ')}
APIs: ${(s.apis || []).length} endpoints
Dependencies: ${(s.depends_on || []).length} services
      `).join('\n');

      const prompt = `You are an expert software architect. Analyze this microservices architecture and propose a ${selectedType} refinement.

PROJECT: ${project.name}
CATEGORY: ${project.category}
SERVICES:
${servicesContext}

Provide:
1. Current state analysis (strengths, weaknesses, technical debt)
2. Proposed architectural changes with:
   - Change type (split, merge, introduce pattern, etc.)
   - Title and detailed description
   - Impact (low/medium/high)
   - Effort required (low/medium/high)
   - Before and after textual diagrams
3. Migration plan with phases, duration, and risks
4. Expected improvements in scalability, maintainability, performance, and cost

Be specific and actionable.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            current_state_analysis: { type: "string" },
            proposed_changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  change_type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  effort: { type: "string" },
                  before_diagram: { type: "string" },
                  after_diagram: { type: "string" }
                }
              }
            },
            migration_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  description: { type: "string" },
                  duration: { type: "string" },
                  risks: { type: "array", items: { type: "string" } }
                }
              }
            },
            expected_improvements: {
              type: "object",
              properties: {
                scalability: { type: "string" },
                maintainability: { type: "string" },
                performance: { type: "string" },
                cost: { type: "string" }
              }
            }
          }
        }
      });

      const newRefinement = await base44.entities.ArchitectureRefinement.create({
        project_id: project.id,
        refinement_type: selectedType,
        current_state_analysis: result.current_state_analysis,
        proposed_changes: result.proposed_changes || [],
        migration_plan: result.migration_plan || [],
        expected_improvements: result.expected_improvements || {}
      });

      setLatestRefinement(newRefinement);
      await loadRefinements();
    } catch (error) {
      console.error("Error running refinement:", error);
    }
    setIsRefining(false);
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
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            AI Architecture Refinement
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Advanced architectural analysis and redesign recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Refinement Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {refinementTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={runRefinement}
            disabled={isRefining || services.length === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
          >
            {isRefining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Architecture...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Architecture Refinement
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestRefinement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Current State Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{latestRefinement.current_state_analysis}</p>
            </CardContent>
          </Card>

          {latestRefinement.proposed_changes && latestRefinement.proposed_changes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Proposed Changes</h3>
              {latestRefinement.proposed_changes.map((change, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-l-4 border-l-cyan-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{change.title}</h4>
                          <Badge variant="outline" className="mt-1">{change.change_type}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={effortColors[change.effort]}>{change.effort} effort</Badge>
                          <Badge variant="outline">{change.impact} impact</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">{change.description}</p>
                      
                      {change.before_diagram && change.after_diagram && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-red-50 rounded p-3">
                            <p className="text-xs font-semibold text-red-900 mb-2">Before:</p>
                            <pre className="text-xs text-red-800 whitespace-pre-wrap">{change.before_diagram}</pre>
                          </div>
                          <div className="bg-green-50 rounded p-3">
                            <p className="text-xs font-semibold text-green-900 mb-2">After:</p>
                            <pre className="text-xs text-green-800 whitespace-pre-wrap">{change.after_diagram}</pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {latestRefinement.migration_plan && latestRefinement.migration_plan.length > 0 && (
            <Card className="bg-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  Migration Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestRefinement.migration_plan.map((phase, i) => (
                    <div key={i} className="border-l-4 border-l-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {phase.duration}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{phase.description}</p>
                      {phase.risks && phase.risks.length > 0 && (
                        <div className="bg-orange-50 rounded p-2">
                          <p className="text-xs font-semibold text-orange-900 mb-1">Risks:</p>
                          <ul className="space-y-1">
                            {phase.risks.map((risk, j) => (
                              <li key={j} className="text-xs text-orange-800">• {risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {latestRefinement.expected_improvements && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Expected Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Scalability</p>
                    <p className="text-sm text-gray-900">{latestRefinement.expected_improvements.scalability}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Maintainability</p>
                    <p className="text-sm text-gray-900">{latestRefinement.expected_improvements.maintainability}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Performance</p>
                    <p className="text-sm text-gray-900">{latestRefinement.expected_improvements.performance}</p>
                  </div>
                  <div className="bg-white rounded p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Cost</p>
                    <p className="text-sm text-gray-900">{latestRefinement.expected_improvements.cost}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}