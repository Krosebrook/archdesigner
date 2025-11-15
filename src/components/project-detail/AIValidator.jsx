
import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Info,
  TrendingUp,
  Loader2,
  History, // New import
  Download // New import
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // New import
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"; // New import
import { format } from "date-fns"; // New import

const severityConfig = {
  critical: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200"
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200"
  },
  medium: {
    icon: Info,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200"
  },
  low: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200"
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200"
  }
};

const validationCategories = [
  {
    id: "security",
    name: "Security",
    icon: Shield,
    description: "Authentication, authorization, encryption, and security best practices"
  },
  {
    id: "performance",
    name: "Performance",
    icon: Zap,
    description: "Bottlenecks, caching, load balancing, and scalability"
  },
  {
    id: "resilience",
    name: "Resilience",
    icon: TrendingUp,
    description: "Fault tolerance, redundancy, and disaster recovery"
  },
  {
    id: "architecture",
    name: "Architecture",
    icon: Sparkles,
    description: "Design patterns, dependencies, and overall structure"
  }
];

export default function AIValidator({ project, services }) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(
    validationCategories.map(c => c.id)
  );
  const [validationHistory, setValidationHistory] = useState([]); // New state
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // New state
  const [activeTab, setActiveTab] = useState("current"); // New state

  useEffect(() => {
    loadValidationHistory();
  }, [project?.id]);

  const loadValidationHistory = async () => {
    if (!project?.id) {
      setIsLoadingHistory(false);
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      const reports = await base44.entities.ValidationReport.filter(
        { project_id: project.id },
        '-created_date', // Order by created_date descending
        10 // Limit to 10 latest reports
      );
      setValidationHistory(reports);
    } catch (error) {
      console.error("Error loading validation history:", error);
      // Optionally set an error state here
    }
    setIsLoadingHistory(false);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const saveValidationReport = async (results) => {
    try {
      const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      (results.findings || []).forEach(finding => {
        const severity = finding.severity?.toLowerCase();
        if (severityCounts.hasOwnProperty(severity)) {
          severityCounts[severity]++;
        }
      });

      const reportId = `report-${Date.now()}`;
      
      await base44.entities.ValidationReport.create({
        id: reportId,
        project_id: project.id,
        overall_score: results.overall_score,
        summary: results.summary,
        categories_tested: selectedCategories,
        findings: results.findings || [],
        strengths: results.strengths || [],
        missing_components: results.missing_components || [],
        anti_patterns: results.anti_patterns || [],
        services_count: services.length,
        critical_count: severityCounts.critical,
        high_count: severityCounts.high,
        medium_count: severityCounts.medium,
        low_count: severityCounts.low
      });

      // Ingest discovered rules
      if (results.discovered_rules && results.discovered_rules.length > 0) {
        await ingestDiscoveredRules(reportId, project.id, results.discovered_rules);
      }

      await loadValidationHistory(); // Reload history after saving
    } catch (error) {
      console.error("Error saving validation report:", error);
    }
  };

  const ingestDiscoveredRules = async (reportId, projectId, suggestions) => {
    try {
      const rulePromises = suggestions.map(suggestion => 
        base44.entities.RuleDiscovery.create({
          source_report_id: reportId,
          project_id: projectId,
          suggested_rule: suggestion.rule || suggestion.suggested_rule,
          rationale: suggestion.rationale || "AI-suggested rule",
          category: suggestion.category,
          confidence: Math.max(0, Math.min(1, suggestion.confidence || 0.7)),
          accepted: false
        })
      );
      
      await Promise.all(rulePromises);
    } catch (error) {
      console.error("Error ingesting discovered rules:", error);
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    setValidationResults(null);

    try {
      // Prepare architecture data - mostly for context, not directly used in prompt
      const architectureData = {
        project: {
          name: project.name,
          description: project.description,
          category: project.category,
          status: project.status
        },
        services: services.map(s => ({
          name: s.name,
          description: s.description,
          category: s.category,
          apis: s.apis || [],
          technologies: s.technologies || [],
          dependencies: s.depends_on || []
        })),
        totalServices: services.length,
        categories: selectedCategories
      };

      // Enhanced prompt with embedded validation rules
      const validationRules = {
        security: [
          "Missing authentication on public APIs",
          "Services without encryption for sensitive data",
          "Exposed administrative endpoints",
          "Missing rate limiting on public APIs",
          "Services without proper authorization checks",
          "Lack of input validation leading to injection vulnerabilities",
          "Improper error handling revealing sensitive information"
        ],
        performance: [
          "Missing caching layer for frequently accessed data",
          "Inefficient database queries or missing indexes",
          "Services with too many synchronous dependencies",
          "Lack of circuit breakers for external calls",
          "Missing CDN for static content delivery",
          "Inefficient message queue usage (e.g., synchronous processing of async tasks)",
          "Over-fetching or under-fetching data in APIs"
        ],
        resilience: [
          "Single points of failure in critical paths",
          "Missing redundancy for core services",
          "Lack of graceful degradation strategies",
          "No backup or disaster recovery plan",
          "Missing health checks and monitoring",
          "Insufficient timeout configurations for external calls",
          "Lack of retry mechanisms with backoff for transient failures"
        ],
        architecture: [
          "Circular dependencies between services",
          "Services with unclear responsibilities (low cohesion)",
          "Tight coupling between services",
          "Inconsistent naming conventions",
          "Services that are too large (violating microservice principles)",
          "Duplication of functionality across multiple services",
          "Lack of clear API contracts between services"
        ]
      };

      const selectedRules = selectedCategories.map(cat => ({
        category: cat,
        rules: validationRules[cat] || []
      }));

      const prompt = `You are an expert software architect specializing in microservices. Analyze this architecture and provide a detailed validation report.

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
CATEGORY: ${project.category}
STATUS: ${project.status}

SERVICES (${services.length} total):
${services.map(s => `
- ${s.name} (${s.category})
  Description: ${s.description}
  APIs: ${(s.apis || []).map(api => `${api.method || 'GET'} ${api.endpoint}`).join(', ') || 'None'}
  Technologies: ${(s.technologies || []).join(', ') || 'None'}
  Dependencies: ${(s.depends_on || []).length} services${(s.depends_on || []).length > 0 ? ` (depends on: ${(s.depends_on || []).map(dep => dep.name).join(', ')})` : ''}
`).join('\n')}

VALIDATION CATEGORIES AND RULES TO CHECK:
${selectedRules.map(({category, rules}) => `
${category.toUpperCase()}:
${rules.length > 0 ? rules.map(rule => `  - ${rule}`).join('\n') : '  - No specific rules provided for this category in the prompt, apply general best practices.'}
`).join('\n')}

SCORING WEIGHTS (use these for overall_score calculation):
- Security: 40%
- Performance: 30%
- Reliability/Resilience: 20%
- Maintainability/Architecture: 10%

Please analyze the architecture against these specific rules (if provided for a category) and general microservices best practices. Provide:
1. An overall score (0-100) based on the weighted criteria above.
2. Specific findings for each violated rule or detected anti-pattern with severity (critical, high, medium, low).
3. Actionable recommendations for each finding, referencing specific services where applicable.
4. Architecture strengths and positive patterns.
5. Suggestions for missing components that could improve the architecture (e.g., API Gateway, Message Queue, Cache Layer, Observability tools).
6. Detection of anti-patterns with examples (e.g., circular dependencies, god services, chatty interfaces, distributed monolith).
7. NEW: Suggested new validation rules we should add based on patterns you see. For discovered_rules, suggest 2-3 new validation rules that would catch similar issues in the future, including a category and confidence score.

Be specific and reference actual service names and their relationships. Use a formal, objective tone.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: {
              type: "number",
              description: "Weighted score 0-100 (Security 40%, Performance 30%, Reliability 20%, Maintainability 10%)"
            },
            summary: {
              type: "string",
              description: "Brief summary of the architecture health (2-3 sentences)"
            },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    description: "Category of finding (security, performance, resilience, architecture)"
                  },
                  severity: {
                    type: "string",
                    description: "Severity level (critical, high, medium, low)"
                  },
                  rule: { // New property
                    type: "string",
                    description: "The specific rule that was violated or general area of concern"
                  },
                  title: {
                    type: "string",
                    description: "Short title of the issue"
                  },
                  description: {
                    type: "string",
                    description: "Detailed description with specific examples"
                  },
                  recommendation: {
                    type: "string",
                    description: "Specific, actionable recommendation to fix the issue"
                  },
                  affected_services: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of affected service names"
                  }
                },
                required: ["category", "severity", "title", "description", "recommendation"] // 'rule' is optional
              }
            },
            strengths: {
              type: "array",
              items: {
                type: "string"
              },
              description: "List of architecture strengths and positive patterns"
            },
            missing_components: { // New property
              type: "array",
              items: {
                type: "string"
              },
              description: "Suggested missing components that could improve the architecture"
            },
            anti_patterns: { // New property
              type: "array",
              items: {
                type: "string"
              },
              description: "Detected anti-patterns with examples"
            },
            discovered_rules: { // New property
              type: "array",
              items: {
                type: "object",
                properties: {
                  rule: { type: "string", description: "The suggested new validation rule" },
                  rationale: { type: "string", description: "Explanation of why this rule is valuable" },
                  category: { type: "string", description: "Category for the new rule (security, performance, resilience, architecture)" },
                  confidence: { type: "number", description: "AI's confidence in the rule's relevance (0-1)" }
                },
                required: ["rule", "rationale", "category"]
              },
              description: "New rules AI suggests adding to validation ruleset"
            }
          },
          required: ["overall_score", "summary", "findings", "strengths", "missing_components", "anti_patterns", "discovered_rules"]
        }
      });

      setValidationResults(result);
      await saveValidationReport(result); // Save report
      setActiveTab("current"); // Switch to current results tab
    } catch (error) {
      console.error("Validation error:", error);
      setValidationResults({
        overall_score: 0,
        summary: "Failed to validate architecture. Please try again.",
        findings: [{
          category: "system",
          severity: "critical",
          title: "Validation Error",
          description: error.message,
          recommendation: "Please try again or contact support.",
          affected_services: []
        }],
        strengths: [],
        missing_components: [], // Added for error case
        anti_patterns: [], // Added for error case
        discovered_rules: [] // Added for error case
      });
    }

    setIsValidating(false);
  };

  const exportReport = () => {
    if (!validationResults) return;
    
    const reportData = {
      project: project.name,
      date: new Date().toISOString(),
      score: validationResults.overall_score,
      summary: validationResults.summary,
      services_analyzed: services.length,
      categories_tested: selectedCategories,
      findings: validationResults.findings,
      strengths: validationResults.strengths,
      missing_components: validationResults.missing_components,
      anti_patterns: validationResults.anti_patterns,
      discovered_rules: validationResults.discovered_rules || []
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-validation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "stroke-green-500"; // Changed to stroke- for SVG
    if (score >= 60) return "stroke-yellow-500"; // Changed to stroke- for SVG
    if (score >= 40) return "stroke-orange-500"; // Changed to stroke- for SVG
    return "stroke-red-500"; // Changed to stroke- for SVG
  };

  const chartData = validationHistory.map(report => ({
    date: format(new Date(report.created_date), 'MMM d'),
    score: report.overall_score,
    critical: report.critical_count,
    high: report.high_count,
    services: report.services_count
  })).reverse(); // Reverse to show oldest first on chart

  // Add regression for trend prediction
  const trendPrediction = useMemo(() => {
    if (chartData.length < 3) return null;
    
    return calculateTrendPrediction(chartData);
  }, [chartData]);

  const calculateTrendPrediction = (data) => {
    const points = data.map((d, i) => ({ x: i, y: d.score }));
    
    // Linear regression
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    // Avoid division by zero if all x values are the same (shouldn't happen with i)
    if (n * sumXX - sumX * sumX === 0) {
      return {
        slope: 0,
        trend: 'stable',
        predictions: []
      };
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Forecast next 3 points
    const predictions = [];
    for (let i = 0; i < 3; i++) {
      const x = n + i;
      const predictedScore = Math.max(0, Math.min(100, intercept + slope * x));
      predictions.push({
        date: `Future ${i + 1}`,
        score: null, // Actual score is null for predictions
        prediction: Math.round(predictedScore)
      });
    }
    
    return {
      slope: slope,
      trend: slope > 1 ? 'improving' : slope < -1 ? 'declining' : 'stable', // Use a threshold for 'stable'
      predictions: predictions
    };
  };

  const extendedChartData = useMemo(() => {
    if (!trendPrediction) return chartData;
    
    return [
      ...chartData.map(d => ({ ...d, prediction: null })), // Set prediction to null for historical data
      ...trendPrediction.predictions
    ];
  }, [chartData, trendPrediction]);

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Architecture Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Select validation categories to analyze your microservices architecture for best practices,
            potential issues, and improvement opportunities.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validationCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.includes(category.id);
              
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={runValidation}
            disabled={isValidating || selectedCategories.length === 0 || services.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Architecture...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Validation
              </>
            )}
          </Button>

          {services.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add services to your project before running validation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Current Results vs History */}
      {(validationResults || validationHistory.length > 0) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Current Results
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History & Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {validationResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Architecture Health Score
                        </h3>
                        <p className="text-gray-600">{validationResults.summary}</p>
                        <Button
                          onClick={exportReport}
                          variant="outline"
                          size="sm"
                          className="mt-4"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-4xl font-bold ${getScoreColor(validationResults.overall_score)}`}>
                              {validationResults.overall_score}
                            </div>
                            <div className="text-sm text-gray-500">out of 100</div>
                          </div>
                        </div>
                        <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            className={getScoreBg(validationResults.overall_score)}
                            strokeWidth="8"
                            strokeDasharray={`${(validationResults.overall_score / 100) * 351.86} 351.86`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Missing Components & Anti-Patterns */}
                {((validationResults.missing_components && validationResults.missing_components.length > 0) ||
                  (validationResults.anti_patterns && validationResults.anti_patterns.length > 0)) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {validationResults.missing_components && validationResults.missing_components.length > 0 && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                            <Info className="w-5 h-5" />
                            Suggested Components
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {validationResults.missing_components.map((component, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                                <span className="text-blue-600 mt-0.5">•</span>
                                {component}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {validationResults.anti_patterns && validationResults.anti_patterns.length > 0 && (
                      <Card className="bg-orange-50 border-orange-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-700 text-lg">
                            <AlertTriangle className="w-5 h-5" />
                            Anti-Patterns Detected
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {validationResults.anti_patterns.map((pattern, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-orange-900">
                                <span className="text-orange-600 mt-0.5">⚠️</span>
                                {pattern}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Strengths */}
                {validationResults.strengths && validationResults.strengths.length > 0 && (
                  <Card className="bg-white shadow-md border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        Architecture Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {validationResults.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Findings */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Findings & Recommendations</h3>
                  
                  {validationResults.findings && validationResults.findings.length > 0 ? (
                    validationResults.findings.map((finding, index) => {
                      const config = severityConfig[finding.severity] || severityConfig.medium;
                      const Icon = config.icon;
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className={`border-l-4 ${config.border} ${config.bg}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg bg-white`}>
                                  <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                        {finding.title}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <Badge className="capitalize" variant="outline">
                                          {finding.category}
                                        </Badge>
                                        <Badge className={`capitalize ${config.color}`} variant="outline">
                                          {finding.severity}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <p className="text-gray-700 mb-3">{finding.description}</p>
                                  
                                  <div className="bg-white rounded-lg p-4 mb-3">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                      💡 Recommendation:
                                    </p>
                                    <p className="text-sm text-gray-700">{finding.recommendation}</p>
                                  </div>

                                  {finding.affected_services && finding.affected_services.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700 mb-1">
                                        Affected Services:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {finding.affected_services.map((service, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {service}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  ) : (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-green-900 mb-2">No Issues Found!</h4>
                        <p className="text-green-700">
                          Your architecture looks great! No critical issues detected.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* Score Trend Chart with Predictions */}
            {extendedChartData.length > 0 && (
              <Card className="bg-white shadow-md border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Validation Score Trend & Forecast
                    </CardTitle>
                    {trendPrediction && (
                      <Badge className={
                        trendPrediction.trend === 'improving' ? 'bg-green-500 hover:bg-green-600' :
                        trendPrediction.trend === 'declining' ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
                      }>
                        {trendPrediction.trend === 'improving' ? '↗ Improving' :
                         trendPrediction.trend === 'declining' ? '↘ Declining' : '→ Stable'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={extendedChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        name="Actual Score"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="prediction" 
                        stroke="#22c55e" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        name="Predicted"
                        dot={{ fill: '#22c55e', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {trendPrediction && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Trend Analysis:</strong> Your score is {trendPrediction.trend}.
                        {trendPrediction.trend === 'improving' && ` At this rate, your score is projected to be around ${Math.round(trendPrediction.predictions[2].prediction)} in the next 3 validations.`}
                        {trendPrediction.trend === 'declining' && ` Your score is projected to be around ${Math.round(trendPrediction.predictions[2].prediction)} in the next 3 validations. Consider addressing critical issues to reverse the trend.`}
                        {trendPrediction.trend === 'stable' && ` Your score is stable. Continue monitoring and improving areas to see an upward trend.`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Validation History List */}
            <Card className="bg-white shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  Validation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Loading history...</p>
                  </div>
                ) : validationHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No validation history yet. Run your first validation above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {validationHistory.map((report, index) => (
                      <div
                        key={report.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-2xl font-bold ${getScoreColor(report.overall_score)}`}>
                              {report.overall_score}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(report.created_date), 'PPp')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {report.services_count} services · {report.categories_tested.join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-3 sm:mt-0">
                          <div className="flex items-center gap-2">
                            {report.critical_count > 0 && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                {report.critical_count} Critical
                              </Badge>
                            )}
                            {report.high_count > 0 && (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                                {report.high_count} High
                              </Badge>
                            )}
                            {report.medium_count > 0 && (
                              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                                {report.medium_count} Medium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
