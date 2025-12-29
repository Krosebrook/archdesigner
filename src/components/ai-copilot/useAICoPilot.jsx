import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { debounce } from "lodash";

export function useAICoPilot({ project, services = [], context = {} }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const analysisQueue = useRef([]);

  const generateSuggestions = useCallback(async (analysisContext) => {
    if (!project) return;

    setIsAnalyzing(true);
    try {
      const prompt = `You are an expert software architect and code reviewer acting as a proactive AI co-pilot.

**Project Context:**
- Name: ${project.name}
- Category: ${project.category}
- Description: ${project.description}
- Services: ${services.length} microservices

**Current User Context:**
${JSON.stringify(analysisContext, null, 2)}

**Your Task:**
Analyze the current context and provide 3-5 actionable, high-value suggestions in these categories:
1. **Code Optimization** - Performance improvements, best practices
2. **Architecture** - Patterns, scalability, maintainability
3. **Security** - Vulnerabilities, hardening, compliance
4. **Dependencies** - Updates, conflicts, redundancies

Be specific, concise, and actionable. Focus on the most impactful recommendations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  category: { type: "string", enum: ["code", "architecture", "security", "dependencies"] },
                  severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  action: { type: "string" },
                  impact: { type: "string" },
                  automated: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.suggestions || []);
      setLastAnalysis(Date.now());
    } catch (error) {
      console.error("AI Co-pilot error:", error);
    }
    setIsAnalyzing(false);
  }, [project, services]);

  const debouncedAnalyze = useCallback(
    debounce((context) => {
      generateSuggestions(context);
    }, 2000),
    [generateSuggestions]
  );

  const triggerAnalysis = useCallback((newContext) => {
    debouncedAnalyze({ ...context, ...newContext });
  }, [context, debouncedAnalyze]);

  const dismissSuggestion = useCallback((suggestionId) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const applySuggestion = useCallback(async (suggestion) => {
    // Mark as applied, return for external handling
    dismissSuggestion(suggestion.id);
    return suggestion;
  }, [dismissSuggestion]);

  return {
    suggestions,
    isAnalyzing,
    lastAnalysis,
    triggerAnalysis,
    dismissSuggestion,
    applySuggestion
  };
}