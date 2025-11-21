import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

const smellSeverity = {
  critical: { color: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle },
  high: { color: "bg-orange-100 text-orange-800 border-orange-300", icon: AlertTriangle },
  medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle },
  low: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle2 }
};

export const CodeSmellDetector = ({ project, onRefactorRequest }) => {
  const [code, setCode] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeCode = async () => {
    if (!code.trim()) return;

    setAnalyzing(true);
    try {
      const result = await invokeLLM(
        `Analyze this code for code smells, anti-patterns, and improvement opportunities.
        
        Project Context: ${project.name} (${project.category})
        
        Code to analyze:
        \`\`\`
        ${code}
        \`\`\`
        
        Provide detailed analysis of:
        1. Code smells (long methods, duplicated code, large classes, long parameter lists)
        2. Anti-patterns and violations of SOLID principles
        3. Performance issues
        4. Security vulnerabilities
        5. Readability and maintainability concerns
        
        For each issue, provide:
        - Type and severity (critical, high, medium, low)
        - Specific location (line numbers if possible)
        - Detailed explanation
        - Impact on codebase
        - Refactoring recommendation
        
        Also provide an overall quality score (0-100) and summary.`,
        {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            summary: { type: "string" },
            smells: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  impact: { type: "string" },
                  recommendation: { type: "string" },
                  code_snippet: { type: "string" }
                }
              }
            },
            quick_wins: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      );

      setAnalysis(result);
    } catch (error) {
      console.error("Analysis error:", error);
    }
    setAnalyzing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            AI Code Smell Detector
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here for analysis..."
            className="h-48 font-mono text-sm"
          />
          <Button
            onClick={analyzeCode}
            disabled={analyzing || !code.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Analyze Code
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <Card className="border-l-4 border-purple-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Code Quality Score</h3>
                    <div className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                      {analysis.overall_score}/100
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24"
                  >
                    <svg viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={analysis.overall_score >= 80 ? "#10b981" : analysis.overall_score >= 60 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - analysis.overall_score / 100) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </motion.div>
                </div>
                <p className="text-gray-700">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Quick Wins */}
            {analysis.quick_wins?.length > 0 && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Quick Wins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.quick_wins.map((win, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{win}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Code Smells */}
            {analysis.smells?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detected Issues ({analysis.smells.length})
                </h3>
                {analysis.smells.map((smell, i) => {
                  const config = smellSeverity[smell.severity?.toLowerCase()] || smellSeverity.medium;
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="hover:shadow-xl transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Icon className={`w-5 h-5 mt-1 ${smell.severity === 'critical' || smell.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CardTitle className="text-lg">{smell.title}</CardTitle>
                                  <Badge className={config.color}>
                                    {smell.severity}
                                  </Badge>
                                  <Badge variant="outline">{smell.type}</Badge>
                                </div>
                                {smell.location && (
                                  <p className="text-xs text-gray-600 font-mono">
                                    📍 {smell.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                            <p className="text-sm text-gray-600">{smell.description}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Impact</h4>
                            <p className="text-sm text-gray-600">{smell.impact}</p>
                          </div>

                          {smell.code_snippet && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">Problematic Code</h4>
                              <pre className="bg-red-50 border border-red-200 rounded-lg p-3 overflow-x-auto text-xs">
                                <code>{smell.code_snippet}</code>
                              </pre>
                            </div>
                          )}

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Refactoring Recommendation
                            </h4>
                            <p className="text-sm text-blue-800">{smell.recommendation}</p>
                          </div>

                          <Button
                            onClick={() => onRefactorRequest && onRefactorRequest(smell)}
                            size="sm"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600"
                          >
                            <Code2 className="w-4 h-4 mr-2" />
                            Generate Refactored Code
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};