import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Loader2, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

function ProjectKnowledgeGraph({ project, services = [] }) {
  const [graph, setGraph] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (services.length > 0) {
      buildKnowledgeGraph();
    }
  }, [project.id, services.length]);

  const buildKnowledgeGraph = async () => {
    setIsBuilding(true);
    try {
      // Get all AI context memories
      const memories = await base44.entities.AIContextMemory.filter(
        { project_id: project.id },
        '-created_date',
        50
      );

      // Get recent changes
      const refactorings = await base44.entities.RefactoringRecommendation.filter(
        { project_id: project.id },
        '-created_date',
        10
      );

      const prompt = `Build a knowledge graph for this project:

PROJECT: ${project.name}
SERVICES: ${services.map(s => `${s.name} (${s.technologies?.join(', ')})`).join('; ')}

RECENT AI INTERACTIONS: ${memories.length}
RECENT REFACTORINGS: ${refactorings.length}

ARCHITECTURAL DECISIONS:
${memories.filter(m => m.interaction_type === 'architecture_decision').map(m => 
  `- ${m.user_prompt}: ${m.ai_response.substring(0, 100)}...`
).join('\n')}

Analyze and create a knowledge graph showing:
1. Service relationships and dependencies
2. Key architectural patterns identified
3. Technology stack evolution
4. Critical decision points
5. Areas of technical debt
6. Optimization opportunities

Return structured insights.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string" },
                  importance: { type: "number" }
                }
              }
            },
            edges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  relationship: { type: "string" },
                  strength: { type: "number" }
                }
              }
            },
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            patterns: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setGraph(result);
      setInsights(result.insights || []);
      toast.success("Knowledge graph built");
    } catch (error) {
      console.error("Failed to build graph:", error);
      toast.error("Failed to build knowledge graph");
    }
    setIsBuilding(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            Project Knowledge Graph
          </CardTitle>
          <CardDescription>
            Visual representation of architectural decisions and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={buildKnowledgeGraph}
            disabled={isBuilding}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {isBuilding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Building Graph...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Rebuild Knowledge Graph
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {graph && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-900">
                  {graph.nodes?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Nodes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-900">
                  {graph.edges?.length || 0}
                </div>
                <div className="text-sm text-purple-700">Relationships</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-900">
                  {graph.patterns?.length || 0}
                </div>
                <div className="text-sm text-green-700">Patterns</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{insight.category}</Badge>
                        <Badge variant="secondary">{insight.impact}</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {graph.patterns && graph.patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Identified Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {graph.patterns.map((pattern, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {pattern}
                    </Badge>
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

ProjectKnowledgeGraph.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  services: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    technologies: PropTypes.arrayOf(PropTypes.string)
  }))
};

export default ProjectKnowledgeGraph;