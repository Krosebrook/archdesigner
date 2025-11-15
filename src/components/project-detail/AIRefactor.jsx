import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const riskColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200"
};

export default function AIRefactor({ project, services }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const analyzeRefactoring = async () => {
    setIsAnalyzing(true);
    
    try {
      const prompt = `You are an expert software architect. Analyze this microservices architecture and provide comprehensive refactoring recommendations.

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
STATUS: ${project.status}

SERVICES (${services.length} total):
${services.map(s => `
- ${s.name} (${s.category})
  Description: ${s.description}
  APIs: ${(s.apis || []).length} endpoints
  Technologies: ${(s.technologies || []).join(', ')}
  Dependencies: ${(s.depends_on || []).length} services
`).join('\n')}

Analyze for:
1. Redundant logic and duplicate functionality across services
2. Inefficient data fetches and N+1 query patterns
3. Services that should be split or merged
4. Missing microservice patterns (CQRS, Saga, Event Sourcing, API Gateway, Circuit Breaker)
5. Schema improvements and missing indexes
6. Security vulnerabilities and authentication gaps
7. Performance optimizations

Provide staged refactoring plan (Stage 0: Safeguards → Stage 1: Cleanup → Stage 2: Optimizations → Stage 3: Advanced Patterns).

For each action, specify:
- What to do
- Why it's important
- Risk level (low/medium/high/critical)
- Affected services
- Rollback strategy`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "2-3 sentence overview of refactoring needs"
            },
            risks: {
              type: "array",
              items: { type: "string" },
              description: "Top 3-5 risks in current architecture"
            },
            refactor_stages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stage: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        why: { type: "string" },
                        risk_level: { type: "string" },
                        affected_services: {
                          type: "array",
                          items: { type: "string" }
                        },
                        rollback: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            patterns_suggested: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  use_case: { type: "string" },
                  benefits: {
                    type: "array",
                    items: { type: "string" }
                  },
                  implementation: { type: "string" }
                }
              }
            },
            redundancies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  services: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            schema_diffs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service: { type: "string" },
                  change: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(result);

      // Save to database
      await base44.entities.RefactoringRecommendation.create({
        project_id: project.id,
        ...result
      });

    } catch (error) {
      console.error("Error analyzing refactoring:", error);
    }
    
    setIsAnalyzing(false);
  };

  const exportReport = () => {
    if (!recommendations) return;
    
    const report = {
      project: project.name,
      timestamp: new Date().toISOString(),
      ...recommendations
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-refactoring-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI-Powered Refactoring Analysis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Get intelligent recommendations for improving your architecture
              </p>
            </div>
            <div className="flex gap-2">
              {recommendations && (
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              <Button
                onClick={analyzeRefactoring}
                disabled={isAnalyzing || services.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Analyze Architecture
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {services.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Add services to your project to generate refactoring recommendations.
          </AlertDescription>
        </Alert>
      )}

      {recommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary */}
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Executive Summary</h3>
              <p className="text-gray-700 mb-4">{recommendations.summary}</p>
              
              {recommendations.risks && recommendations.risks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Top Risks Identified
                  </h4>
                  <ul className="space-y-1">
                    {recommendations.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="stages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 max-w-3xl">
              <TabsTrigger value="stages">Refactor Stages</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="redundancies">Redundancies</TabsTrigger>
              <TabsTrigger value="schema">Schema Changes</TabsTrigger>
            </TabsList>

            {/* Refactor Stages */}
            <TabsContent value="stages" className="space-y-4">
              {recommendations.refactor_stages?.map((stage, idx) => (
                <Card key={idx} className="border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardTitle className="text-lg">{stage.stage}: {stage.title}</CardTitle>
                    {stage.description && (
                      <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {stage.actions?.map((action, actionIdx) => (
                        <div key={actionIdx} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">{action.action}</h5>
                            <Badge className={riskColors[action.risk_level] || riskColors.medium}>
                              {action.risk_level} risk
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Why: </span>
                              <span className="text-gray-600">{action.why}</span>
                            </div>
                            
                            {action.affected_services && action.affected_services.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-700">Affected Services: </span>
                                <span className="text-gray-600">
                                  {action.affected_services.join(', ')}
                                </span>
                              </div>
                            )}
                            
                            <div className="bg-gray-50 p-2 rounded mt-2">
                              <span className="font-medium text-gray-700">Rollback: </span>
                              <span className="text-gray-600 font-mono text-xs">
                                {action.rollback}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Patterns */}
            <TabsContent value="patterns" className="space-y-4">
              {recommendations.patterns_suggested?.map((pattern, idx) => (
                <Card key={idx} className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      {pattern.pattern}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">Use Case</h5>
                      <p className="text-sm text-gray-700">{pattern.use_case}</p>
                    </div>
                    
                    {pattern.benefits && pattern.benefits.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-1">Benefits</h5>
                        <ul className="space-y-1">
                          {pattern.benefits.map((benefit, bIdx) => (
                            <li key={bIdx} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-1">Implementation</h5>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {pattern.implementation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Redundancies */}
            <TabsContent value="redundancies" className="space-y-4">
              {recommendations.redundancies?.length === 0 ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-green-900 mb-2">No Redundancies Detected!</h4>
                    <p className="text-green-700">
                      Your architecture appears to have good separation of concerns.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recommendations.redundancies?.map((redundancy, idx) => (
                  <Card key={idx} className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="w-5 h-5" />
                        {redundancy.type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-orange-900 mb-3">{redundancy.description}</p>
                      {redundancy.services && redundancy.services.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-orange-700 mb-2">
                            Affected Services:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {redundancy.services.map((service, sIdx) => (
                              <Badge key={sIdx} variant="outline" className="text-orange-800">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Schema Changes */}
            <TabsContent value="schema" className="space-y-4">
              {recommendations.schema_diffs?.length === 0 ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-green-900 mb-2">No Schema Changes Needed!</h4>
                    <p className="text-green-700">
                      Your data models appear to be well-designed.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recommendations.schema_diffs?.map((diff, idx) => (
                  <Card key={idx} className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">{diff.service}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <code className="text-sm text-blue-900 font-mono">
                          {diff.change}
                        </code>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Rationale: </span>
                        <span className="text-sm text-gray-600">{diff.rationale}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}