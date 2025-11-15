import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code2, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
  TrendingUp,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const severityColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200"
};

const reviewTypes = [
  { value: "full", label: "Full Review", icon: Code2 },
  { value: "security", label: "Security", icon: Shield },
  { value: "performance", label: "Performance", icon: Zap },
  { value: "architecture", label: "Architecture", icon: Target },
  { value: "best_practices", label: "Best Practices", icon: CheckCircle2 }
];

export default function AICodeReview({ project, services }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedReviewType, setSelectedReviewType] = useState("full");
  const [reviews, setReviews] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [project?.id]);

  const loadReviews = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.CodeReview.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setReviews(data);
      if (data.length > 0) {
        setLatestReview(data[0]);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
    setIsLoading(false);
  };

  const runCodeReview = async () => {
    setIsReviewing(true);
    try {
      const servicesContext = services.map(s => `
Service: ${s.name}
Category: ${s.category}
Description: ${s.description}
Technologies: ${(s.technologies || []).join(', ')}
APIs: ${(s.apis || []).length} endpoints
Dependencies: ${(s.depends_on || []).length} services
      `).join('\n');

      const prompt = `You are an expert code reviewer specializing in microservices architectures. Perform a ${selectedReviewType} code review for this project.

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
CATEGORY: ${project.category}
TOTAL SERVICES: ${services.length}

SERVICES ARCHITECTURE:
${servicesContext}

Perform a comprehensive ${selectedReviewType} review and provide:
1. Overall code quality score (0-100)
2. Specific findings with severity (critical, high, medium, low)
3. Code metrics (maintainability index 0-100, cyclomatic complexity, estimated test coverage %, technical debt in hours)
4. Actionable suggestions with code examples where applicable
5. Positive highlights of good practices

Focus areas based on review type:
${selectedReviewType === 'security' ? '- Authentication & authorization, encryption, input validation, security headers, secrets management' : ''}
${selectedReviewType === 'performance' ? '- Database queries, caching, async operations, resource usage, API efficiency' : ''}
${selectedReviewType === 'architecture' ? '- Design patterns, service boundaries, coupling, cohesion, scalability' : ''}
${selectedReviewType === 'best_practices' ? '- Code organization, naming conventions, error handling, logging, documentation' : ''}
${selectedReviewType === 'full' ? '- All of the above categories' : ''}

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            summary: { type: "string" },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  file_path: { type: "string" },
                  line_number: { type: "number" },
                  suggestion: { type: "string" },
                  code_snippet: { type: "string" }
                }
              }
            },
            metrics: {
              type: "object",
              properties: {
                maintainability_index: { type: "number" },
                cyclomatic_complexity: { type: "number" },
                test_coverage: { type: "number" },
                technical_debt_hours: { type: "number" }
              }
            },
            positive_highlights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const newReview = await base44.entities.CodeReview.create({
        project_id: project.id,
        review_type: selectedReviewType,
        overall_score: result.overall_score,
        summary: result.summary,
        findings: result.findings || [],
        metrics: result.metrics || {},
        positive_highlights: result.positive_highlights || []
      });

      setLatestReview(newReview);
      await loadReviews();
    } catch (error) {
      console.error("Error running code review:", error);
    }
    setIsReviewing(false);
  };

  const exportReview = () => {
    if (!latestReview) return;
    
    const blob = new Blob([JSON.stringify(latestReview, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-review-${project.name}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
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
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            AI Code Review Assistant
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Automated code quality analysis and architecture review
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {reviewTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedReviewType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedReviewType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${
                    selectedReviewType === type.value ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <p className="text-xs font-medium text-center">{type.label}</p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runCodeReview}
              disabled={isReviewing || services.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isReviewing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reviewing...
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4 mr-2" />
                  Run {reviewTypes.find(t => t.value === selectedReviewType)?.label} Review
                </>
              )}
            </Button>
            {latestReview && (
              <Button onClick={exportReview} variant="outline">
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {latestReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Latest Review Results</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(latestReview.created_date), 'PPp')} • {latestReview.review_type}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(latestReview.overall_score)}`}>
                    {latestReview.overall_score}
                  </div>
                  <div className="text-sm text-gray-500">Quality Score</div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{latestReview.summary}</p>

              {latestReview.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {latestReview.metrics.maintainability_index || 0}
                    </div>
                    <div className="text-xs text-gray-600">Maintainability</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {latestReview.metrics.cyclomatic_complexity || 0}
                    </div>
                    <div className="text-xs text-gray-600">Complexity</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {latestReview.metrics.test_coverage || 0}%
                    </div>
                    <div className="text-xs text-gray-600">Test Coverage</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">
                      {latestReview.metrics.technical_debt_hours || 0}h
                    </div>
                    <div className="text-xs text-gray-600">Tech Debt</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {latestReview.positive_highlights && latestReview.positive_highlights.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Positive Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {latestReview.positive_highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-green-900">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Findings & Recommendations</h3>
            {latestReview.findings && latestReview.findings.length > 0 ? (
              latestReview.findings.map((finding, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-l-4 ${
                    finding.severity === 'critical' ? 'border-l-red-500' :
                    finding.severity === 'high' ? 'border-l-orange-500' :
                    finding.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{finding.title}</h4>
                        <Badge className={severityColors[finding.severity]}>
                          {finding.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{finding.description}</p>
                      {finding.file_path && (
                        <p className="text-xs text-gray-500 mb-2">
                          📄 {finding.file_path}
                          {finding.line_number && `:${finding.line_number}`}
                        </p>
                      )}
                      {finding.code_snippet && (
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto mb-2">
                          {finding.code_snippet}
                        </pre>
                      )}
                      <div className="bg-blue-50 rounded p-3 mt-2">
                        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Suggestion:</p>
                        <p className="text-xs text-blue-800">{finding.suggestion}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900">No Issues Found!</h4>
                  <p className="text-sm text-green-700">Code quality looks excellent.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}