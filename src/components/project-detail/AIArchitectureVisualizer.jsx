import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Download, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function AIArchitectureVisualizer({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationType, setVisualizationType] = useState("diagram");
  const [visualization, setVisualization] = useState(null);

  const generateVisualization = async () => {
    setIsGenerating(true);
    try {
      const servicesContext = services.map(s => `
${s.name}: ${s.category} - Dependencies: [${(s.depends_on || []).join(', ')}]
      `).join('\n');

      const prompt = `Generate a Mermaid ${visualizationType} diagram for this microservices architecture.

PROJECT: ${project.name}
SERVICES:
${servicesContext}

Create a clear, professional Mermaid diagram showing:
- All services and their relationships
- Data flow and dependencies
- Component grouping by category

Also provide:
- layout_suggestions: Optimal x,y positions for each service
- insights: Key architectural observations

Return as JSON with diagram_code (Mermaid syntax), layout_suggestions array, and insights array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            diagram_code: { type: "string" },
            layout_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_id: { type: "string" },
                  suggested_x: { type: "number" },
                  suggested_y: { type: "number" },
                  rationale: { type: "string" }
                }
              }
            },
            insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      const newViz = await base44.entities.ArchitectureVisualization.create({
        project_id: project.id,
        visualization_type: visualizationType,
        diagram_code: result.diagram_code,
        layout_suggestions: result.layout_suggestions || [],
        insights: result.insights || []
      });

      setVisualization(newViz);
    } catch (error) {
      console.error("Error generating visualization:", error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-600" />
            AI Architecture Visualization
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate intelligent architecture diagrams with AI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={visualizationType} onValueChange={setVisualizationType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diagram">System Diagram</SelectItem>
              <SelectItem value="flowchart">Data Flowchart</SelectItem>
              <SelectItem value="sequence">Sequence Diagram</SelectItem>
              <SelectItem value="component">Component View</SelectItem>
              <SelectItem value="deployment">Deployment View</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={generateVisualization}
            disabled={isGenerating || services.length === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Visualization...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Generate AI Diagram
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {visualization && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Generated Diagram</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                {visualization.diagram_code}
              </pre>
            </CardContent>
          </Card>

          {visualization.insights && visualization.insights.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Architecture Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {visualization.insights.map((insight, i) => (
                    <li key={i} className="text-sm text-blue-900">• {insight}</li>
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