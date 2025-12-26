import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Network, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const PATTERNS = [
  { id: "microservices", name: "Microservices", desc: "Distributed, independently deployable services", icon: "🔷" },
  { id: "monolithic", name: "Monolithic", desc: "Single unified application", icon: "🏛️" },
  { id: "event-driven", name: "Event-Driven", desc: "Asynchronous message-based communication", icon: "⚡" },
  { id: "layered", name: "Layered", desc: "Traditional n-tier architecture", icon: "📚" },
  { id: "serverless", name: "Serverless", desc: "Cloud functions and managed services", icon: "☁️" }
];

export default function ArchitectureStep({ data, onComplete }) {
  const [selectedPattern, setSelectedPattern] = useState(data.architecture?.pattern || "");
  const [suggestions, setSuggestions] = useState(data.architecture?.suggestions || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!suggestions && data.projectInfo?.name) {
      analyzeBestArchitecture();
    }
  }, []);

  const analyzeBestArchitecture = async () => {
    if (!data.projectInfo?.name) return;

    setIsAnalyzing(true);
    try {
      const prompt = `You are a senior software architect. Analyze this project and suggest the best architectural pattern:

PROJECT: ${data.projectInfo.name}
DESCRIPTION: ${data.projectInfo.description}
CATEGORY: ${data.projectInfo.category}
GOALS: ${data.projectInfo.goals}

Analyze and provide:
1. Recommended architecture pattern (microservices, monolithic, event-driven, layered, or serverless)
2. Reasoning for this recommendation
3. Suggested core technologies and frameworks
4. Scalability considerations
5. Team size and complexity fit

Return structured recommendations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_pattern: { type: "string" },
            reasoning: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            scalability_notes: { type: "string" },
            complexity_level: { type: "string" },
            team_size_recommendation: { type: "string" },
            alternative_patterns: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  pros: { type: "string" },
                  cons: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result);
      setSelectedPattern(result.recommended_pattern);
      
      onComplete({
        pattern: result.recommended_pattern,
        technologies: result.technologies,
        suggestions: result
      });

      toast.success("Architecture analyzed!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze architecture");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePatternSelect = (patternId) => {
    setSelectedPattern(patternId);
    onComplete({
      pattern: patternId,
      technologies: suggestions?.technologies || [],
      suggestions
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Network className="w-5 h-5" />
            Choose Your Architecture
          </CardTitle>
          <CardDescription className="text-purple-700">
            AI will analyze your project and recommend the best architectural pattern
          </CardDescription>
        </CardHeader>
      </Card>

      {isAnalyzing ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Analyzing optimal architecture for your project...</p>
          </CardContent>
        </Card>
      ) : suggestions ? (
        <>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold text-green-900 mb-2">Recommended Pattern</div>
                <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                  {suggestions.recommended_pattern}
                </Badge>
              </div>
              
              <div>
                <div className="font-semibold text-green-900 mb-2">Reasoning</div>
                <p className="text-sm text-green-800">{suggestions.reasoning}</p>
              </div>

              <div>
                <div className="font-semibold text-green-900 mb-2">Suggested Technologies</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.technologies?.map((tech, i) => (
                    <Badge key={i} variant="outline" className="border-green-300">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-xs font-semibold text-green-700 mb-1">Complexity</div>
                  <div className="text-sm text-green-900">{suggestions.complexity_level}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-xs font-semibold text-green-700 mb-1">Team Size</div>
                  <div className="text-sm text-green-900">{suggestions.team_size_recommendation}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {suggestions.alternative_patterns?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Alternative Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.alternative_patterns.map((alt, i) => (
                  <div key={i} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="font-semibold text-sm mb-1">{alt.pattern}</div>
                    <div className="text-xs text-green-700">✓ {alt.pros}</div>
                    <div className="text-xs text-red-700">✗ {alt.cons}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      <div>
        <h3 className="font-semibold mb-3">Select Architecture Pattern</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {PATTERNS.map(pattern => (
            <Card
              key={pattern.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedPattern === pattern.id
                  ? "border-2 border-purple-500 bg-purple-50"
                  : "border border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => handlePatternSelect(pattern.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{pattern.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{pattern.name}</div>
                    <div className="text-sm text-gray-600">{pattern.desc}</div>
                    {selectedPattern === pattern.id && suggestions?.recommended_pattern === pattern.id && (
                      <Badge className="bg-green-600 text-white text-xs mt-2">
                        AI Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

ArchitectureStep.propTypes = {
  data: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired
};