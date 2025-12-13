import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  AlertCircle, 
  CheckCircle2, 
  Code2, 
  Zap,
  TrendingUp,
  FileCode,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import CodeSmellDetector from "./CodeSmellDetector";
import RefactoringEngine from "./RefactoringEngine";
import { AnimatedHero } from "../shared/AnimatedHero";

const improvementCategories = [
  { id: "dry", label: "DRY Violations", icon: Code2, color: "text-blue-600" },
  { id: "complexity", label: "High Complexity", icon: AlertCircle, color: "text-orange-600" },
  { id: "performance", label: "Performance", icon: Zap, color: "text-purple-600" },
  { id: "maintainability", label: "Maintainability", icon: TrendingUp, color: "text-green-600" }
];

export default function CodeRefactoringHub({ project, services }) {
  const [activeTab, setActiveTab] = useState("analyzer");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    try {
      // Get all code generations for this project
      const codeGenerations = await base44.entities.CodeGeneration.filter({ 
        project_id: project.id 
      });

      const prompt = `Analyze the following project for code quality improvements:

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
SERVICES: ${services.map(s => `${s.name} (${s.category})`).join(', ')}

Analyze for:
1. DRY Violations - Repeated code patterns that should be abstracted
2. Code Complexity - Functions or modules that are too complex
3. Performance Issues - Inefficient patterns or algorithms
4. Maintainability - Code that's hard to understand or modify
5. Best Practice Violations - Patterns that don't follow industry standards

For each issue found, provide:
- Category (dry, complexity, performance, maintainability)
- Severity (critical, high, medium, low)
- Location/Pattern description
- Current code example
- Suggested refactored code
- Impact/Benefits of the change
- Estimated effort

Return comprehensive analysis with actionable recommendations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            overall_score: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  category: { type: "string" },
                  severity: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  current_code: { type: "string" },
                  refactored_code: { type: "string" },
                  benefits: { type: "array", items: { type: "string" } },
                  effort: { type: "string" },
                  service_id: { type: "string" }
                }
              }
            },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Save analysis
      await base44.entities.RefactoringRecommendation.create({
        project_id: project.id,
        analysis_summary: result.summary,
        overall_score: result.overall_score,
        issues: result.issues,
        recommendations: result.recommendations,
        status: "pending"
      });

      setAnalysis(result);
      toast.success("Code analysis complete");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze code");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stats = analysis ? {
    total: analysis.issues?.length || 0,
    critical: analysis.issues?.filter(i => i.severity === 'critical').length || 0,
    high: analysis.issues?.filter(i => i.severity === 'high').length || 0,
    medium: analysis.issues?.filter(i => i.severity === 'medium').length || 0,
  } : null;

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Wand2}
        title="AI Code Refactoring"
        description="Analyze and improve your codebase with AI-powered suggestions"
        gradient="from-violet-900 via-purple-900 to-indigo-900"
      />

      {/* Quick Stats */}
      {analysis && stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-700">Total Issues</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-900">{stats.critical}</div>
              <div className="text-sm text-red-700">Critical</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-900">{stats.high}</div>
              <div className="text-sm text-orange-700">High Priority</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-900">
                {analysis.overall_score || 0}
              </div>
              <div className="text-sm text-green-700">Quality Score</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyzer">Code Analyzer</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="engine">Auto-Refactor</TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Code Quality Analysis
              </CardTitle>
              <CardDescription>
                Scan your codebase for improvement opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={analyzeProject}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Codebase...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>

              {analysis && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 mt-6"
                >
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
                    <p className="text-sm text-blue-800">{analysis.summary}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {improvementCategories.map(cat => {
                      const count = analysis.issues?.filter(i => i.category === cat.id).length || 0;
                      return (
                        <Card key={cat.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <cat.icon className={`w-5 h-5 ${cat.color}`} />
                                <div>
                                  <div className="font-semibold">{cat.label}</div>
                                  <div className="text-sm text-gray-600">{count} issues</div>
                                </div>
                              </div>
                              <Badge variant={count > 0 ? "destructive" : "secondary"}>
                                {count}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <CodeSmellDetector project={project} services={services} />
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {!analysis ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Run code analysis first to see suggestions</p>
                <Button
                  onClick={() => setActiveTab("analyzer")}
                  className="mt-4"
                  variant="outline"
                >
                  Go to Analyzer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {analysis.issues?.map((issue, idx) => (
                <motion.div
                  key={issue.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              issue.severity === 'critical' ? 'destructive' :
                              issue.severity === 'high' ? 'default' : 'secondary'
                            }>
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline">{issue.category}</Badge>
                            <Badge variant="outline">{issue.effort}</Badge>
                          </div>
                          <CardTitle className="text-lg">{issue.title}</CardTitle>
                          <CardDescription className="mt-2">{issue.description}</CardDescription>
                          {issue.location && (
                            <p className="text-xs text-gray-500 mt-2">📍 {issue.location}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Before */}
                      <div>
                        <div className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Current Code
                        </div>
                        <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs overflow-x-auto">
                          {issue.current_code}
                        </pre>
                      </div>

                      {/* After */}
                      <div>
                        <div className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Refactored Code
                        </div>
                        <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs overflow-x-auto">
                          {issue.refactored_code}
                        </pre>
                      </div>

                      {/* Benefits */}
                      {issue.benefits?.length > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-900 mb-2">Benefits:</div>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {issue.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={() => {
                          setSelectedService(issue.service_id);
                          setActiveTab("engine");
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Apply This Refactoring
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="engine">
          <RefactoringEngine 
            project={project} 
            services={services}
            analysis={analysis}
            selectedServiceId={selectedService}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}