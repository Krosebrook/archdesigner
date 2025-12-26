import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2,
  Code2,
  TrendingUp,
  Lock,
  FileCode
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  high: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  medium: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  low: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" }
};

export default function AICodeReviewer({ project, services }) {
  const [code, setCode] = useState("");
  const [context, setContext] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const reviewCode = async () => {
    if (!code.trim()) {
      toast.error("Please provide code to review");
      return;
    }

    setIsReviewing(true);
    try {
      const techStack = services
        .flatMap(s => s.technologies || [])
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ");

      const prompt = `You are a senior code reviewer and security expert. Perform a comprehensive code review:

PROJECT CONTEXT:
- Architecture: ${project.architecture_pattern || "microservices"}
- Tech Stack: ${techStack}
- Services: ${services.map(s => s.name).join(", ")}
${context ? `- Additional Context: ${context}` : ""}

CODE TO REVIEW:
\`\`\`
${code}
\`\`\`

Perform a DETAILED analysis covering:

1. SECURITY VULNERABILITIES:
   - SQL injection, XSS, CSRF risks
   - Authentication/authorization flaws
   - Sensitive data exposure
   - Insecure dependencies
   - Missing input validation
   - Rate limiting gaps

2. PERFORMANCE ISSUES:
   - N+1 queries
   - Memory leaks
   - Inefficient algorithms (O(n²) or worse)
   - Missing indexes
   - Blocking operations
   - Resource exhaustion risks

3. CODE QUALITY:
   - Naming conventions
   - Code duplication (DRY violations)
   - Function complexity (cyclomatic complexity)
   - Error handling gaps
   - Missing logging
   - Type safety issues

4. ARCHITECTURE ADHERENCE:
   - Separation of concerns
   - Dependency injection
   - SOLID principles
   - Design patterns usage
   - Service boundaries
   - API contract compliance

5. BEST PRACTICES:
   - Framework-specific patterns
   - Testing requirements
   - Documentation quality
   - Scalability concerns
   - Maintainability issues

For each issue found:
- Severity: critical/high/medium/low
- Category: security/performance/quality/architecture/best-practice
- Description: What's wrong
- Impact: Why it matters
- Fix: Specific code changes needed
- Example: Show corrected code

Also provide:
- Overall score (0-100)
- Summary of findings
- Recommendations prioritized by impact`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            summary: { type: "string" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: { type: "string" },
                  category: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  fix: { type: "string" },
                  example_code: { type: "string" },
                  line_numbers: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            metrics: {
              type: "object",
              properties: {
                security_score: { type: "number" },
                performance_score: { type: "number" },
                quality_score: { type: "number" },
                maintainability_score: { type: "number" }
              }
            }
          }
        }
      });

      setReview(result);

      // Save code review to database
      await base44.entities.CodeReview.create({
        project_id: project.id,
        code_snippet: code.substring(0, 1000),
        overall_score: result.overall_score,
        security_score: result.metrics.security_score,
        performance_score: result.metrics.performance_score,
        issues_found: result.issues.length,
        critical_issues: result.issues.filter(i => i.severity === "critical").length,
        status: "completed",
        findings: result.issues,
        recommendations: result.recommendations
      });

      toast.success(`Code review complete - Score: ${result.overall_score}/100`);
    } catch (error) {
      console.error("Code review failed:", error);
      toast.error("Failed to review code");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file.name);
    const text = await file.text();
    setCode(text);
    toast.success(`Loaded ${file.name}`);
  };

  const groupedIssues = review?.issues?.reduce((acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Shield className="w-6 h-6" />
            AI Code Reviewer
          </CardTitle>
          <CardDescription className="text-purple-700">
            Analyze code for security vulnerabilities, performance issues, and best practices
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submit Code for Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Code to Review</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('code-file-input').click()}
              >
                <FileCode className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <input
                id="code-file-input"
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.go,.java,.rb,.php"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {selectedFile && (
              <div className="text-xs text-gray-600 mb-2">📄 {selectedFile}</div>
            )}
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here or upload a file..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Additional Context (Optional)</label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what this code does, any specific concerns, or requirements..."
              rows={3}
            />
          </div>

          <Button
            onClick={reviewCode}
            disabled={isReviewing || !code.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Code...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Review Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {review && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-green-900">Overall Code Quality</div>
                    <div className="text-3xl font-bold text-green-700">{review.overall_score}/100</div>
                  </div>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    review.overall_score >= 80 ? 'bg-green-500' :
                    review.overall_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                </div>
                <p className="text-sm text-green-800 mb-4">{review.summary}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(review.metrics || {}).map(([key, value]) => (
                    <div key={key} className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-xs text-green-700 mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xl font-bold text-green-900">{value}/100</div>
                      <Progress value={value} className="h-1 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues by Category */}
            {Object.entries(groupedIssues).map(([category, issues]) => {
              const Icon = category === 'security' ? Lock : 
                         category === 'performance' ? Zap : 
                         category === 'quality' ? Code2 : TrendingUp;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 capitalize">
                      <Icon className="w-5 h-5" />
                      {category} Issues ({issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {issues.map((issue, i) => {
                      const config = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low;
                      const SeverityIcon = config.icon;

                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <SeverityIcon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{issue.title}</span>
                                <Badge className={`${config.color} bg-white`}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                              {issue.line_numbers && (
                                <div className="text-xs text-gray-600 mb-2">
                                  📍 Line {issue.line_numbers}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3 ml-8">
                            <div className="p-3 bg-white rounded border">
                              <div className="text-xs font-semibold text-gray-700 mb-1">Impact</div>
                              <p className="text-sm text-gray-600">{issue.impact}</p>
                            </div>

                            <div className="p-3 bg-white rounded border">
                              <div className="text-xs font-semibold text-gray-700 mb-1">Recommended Fix</div>
                              <p className="text-sm text-gray-600">{issue.fix}</p>
                            </div>

                            {issue.example_code && (
                              <details className="p-3 bg-white rounded border">
                                <summary className="text-xs font-semibold text-blue-600 cursor-pointer mb-2">
                                  View Corrected Code
                                </summary>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                  {issue.example_code}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}

            {/* Recommendations */}
            {review.recommendations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {review.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                          {rec.priority} priority
                        </Badge>
                        <span className="font-semibold">{rec.title}</span>
                      </div>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

AICodeReviewer.propTypes = {
  project: PropTypes.object.isRequired,
  services: PropTypes.array.isRequired
};