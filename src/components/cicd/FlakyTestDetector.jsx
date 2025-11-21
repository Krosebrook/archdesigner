import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, TestTube, TrendingUp, Loader2, FileCode } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const FlakyTestDetector = ({ project }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [testResults, setTestResults] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const analyzeTests = async () => {
    if (!testResults.trim()) return;

    setAnalyzing(true);
    try {
      const result = await invokeLLM(
        `Analyze these test results to identify flaky tests and patterns.

Project: ${project.name}

Test Results/Logs:
${testResults}

Identify:
1. Tests that fail intermittently
2. Common failure patterns (timing, race conditions, external dependencies)
3. Root cause analysis for each flaky test
4. Recommended fixes and best practices
5. Test suite health metrics

Provide actionable recommendations to improve test reliability.`,
        {
          type: "object",
          properties: {
            flaky_tests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  failure_rate: { type: "string" },
                  pattern: { type: "string" },
                  root_cause: { type: "string" },
                  fix_recommendation: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            failure_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern_type: { type: "string" },
                  description: { type: "string" },
                  affected_tests: { type: "number" },
                  solution: { type: "string" }
                }
              }
            },
            health_metrics: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                stability_score: { type: "number" },
                coverage_estimate: { type: "string" },
                execution_time: { type: "string" }
              }
            },
            best_practices: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      );

      setAnalysis(result);
    } catch (error) {
      console.error("Test analysis error:", error);
    }
    setAnalyzing(false);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300"
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-orange-600" />
            Flaky Test Detector
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered analysis to identify and fix unreliable tests
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testResults">Paste Test Results or Logs</Label>
            <textarea
              id="testResults"
              value={testResults}
              onChange={(e) => setTestResults(e.target.value)}
              placeholder="Paste your test output, CI logs, or test reports here..."
              className="w-full h-48 p-3 border rounded-lg font-mono text-sm mt-2"
            />
          </div>
          <Button
            onClick={analyzeTests}
            disabled={analyzing || !testResults.trim()}
            className="bg-gradient-to-r from-orange-600 to-red-600"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Analyze Tests
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Health Metrics */}
          {analysis.health_metrics && (
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-blue-600">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.health_metrics.overall_score}/100
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-green-600">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">Stability</div>
                  <div className="text-3xl font-bold text-green-600">
                    {analysis.health_metrics.stability_score}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-purple-600">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">Coverage</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.health_metrics.coverage_estimate}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-orange-600">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">Exec Time</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {analysis.health_metrics.execution_time}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Flaky Tests */}
          {analysis.flaky_tests?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Flaky Tests Detected ({analysis.flaky_tests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.flaky_tests.map((test, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border rounded-lg p-4 hover:border-red-300 hover:bg-red-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 font-mono text-sm">
                            {test.test_name}
                          </h4>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(test.priority)}>
                              {test.priority}
                            </Badge>
                            <Badge variant="outline" className="text-red-700">
                              {test.failure_rate} failure rate
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Pattern</h5>
                          <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                            {test.pattern}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1">Root Cause</h5>
                          <p className="text-sm text-gray-600 bg-orange-50 p-2 rounded">
                            {test.root_cause}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            Fix Recommendation
                          </h5>
                          <p className="text-sm text-gray-600 bg-green-50 border border-green-200 p-3 rounded">
                            {test.fix_recommendation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failure Patterns */}
          {analysis.failure_patterns?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  Common Failure Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.failure_patterns.map((pattern, i) => (
                    <div key={i} className="border-l-4 border-yellow-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{pattern.pattern_type}</h4>
                        <Badge variant="outline">{pattern.affected_tests} tests</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <h5 className="text-xs font-semibold text-blue-900 mb-1">Solution</h5>
                        <p className="text-sm text-blue-800">{pattern.solution}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Best Practices */}
          {analysis.best_practices?.length > 0 && (
            <Card className="border-l-4 border-green-600">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg">Test Suite Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {analysis.best_practices.map((practice, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{practice}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};