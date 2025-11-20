import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Activity, Zap, Shield, GitBranch, Sparkles, Loader2, Brain
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";

export default function PortfolioHealthDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);

  useEffect(() => {
    analyzePortfolio();
  }, []);

  const analyzePortfolio = async () => {
    setIsAnalyzing(true);
    try {
      const [projects, validations, codeReviews, cicdConfigs, tasks, flags] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.ValidationReport.list(),
        base44.entities.CodeReview.list(),
        base44.entities.CICDConfiguration.list(),
        base44.entities.Task.list(),
        base44.entities.FeatureFlag.list()
      ]);

      // Calculate health scores per project
      const projectHealth = projects.map(project => {
        const projectValidations = validations.filter(v => v.project_id === project.id);
        const projectReviews = codeReviews.filter(r => r.project_id === project.id);
        const projectTasks = tasks.filter(t => t.project_id === project.id);
        const projectFlags = flags.filter(f => f.project_id === project.id);

        const validationScore = projectValidations[0]?.overall_score || 0;
        const codeScore = projectReviews[0]?.overall_score || 0;
        const taskCompletionRate = projectTasks.length > 0 
          ? (projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100 
          : 0;

        return {
          project_id: project.id,
          project_name: project.name,
          category: project.category,
          health_score: Math.round((validationScore + codeScore + taskCompletionRate) / 3),
          validation_score: validationScore,
          code_score: codeScore,
          task_completion: Math.round(taskCompletionRate),
          active_flags: projectFlags.filter(f => f.status === 'active').length,
          critical_tasks: projectTasks.filter(t => t.priority_level === 'critical' && t.status !== 'completed').length
        };
      });

      const prompt = `Analyze this software development portfolio and provide strategic insights:

PORTFOLIO OVERVIEW:
Total Projects: ${projects.length}
${projectHealth.map(p => `
- ${p.project_name} (${p.category}):
  Health Score: ${p.health_score}/100
  Code Quality: ${p.code_score}/100
  Task Completion: ${p.task_completion}%
  Critical Tasks: ${p.critical_tasks}
  Active Feature Flags: ${p.active_flags}
`).join('')}

CI/CD STATUS:
${cicdConfigs.map(c => `- Platform: ${c.platform}, Project: ${projects.find(p => p.id === c.project_id)?.name}`).join('\n')}

Provide:
1. Overall portfolio health assessment (0-100 score)
2. Top 3 healthiest projects with reasons
3. Top 3 at-risk projects with specific issues
4. Cross-project patterns (common risks, recurring failures)
5. Portfolio-level recommendations (strategic priorities)
6. Deployment frequency insights
7. Technical debt indicators
8. Resource allocation suggestions

Return comprehensive analysis as JSON.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            portfolio_health_score: { type: "number" },
            summary: { type: "string" },
            healthiest_projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  score: { type: "number" },
                  strengths: { type: "array", items: { type: "string" } }
                }
              }
            },
            at_risk_projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  score: { type: "number" },
                  issues: { type: "array", items: { type: "string" } },
                  urgency: { type: "string" }
                }
              }
            },
            cross_project_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  affected_projects: { type: "number" },
                  severity: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            strategic_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  effort: { type: "string" }
                }
              }
            },
            deployment_insights: {
              type: "object",
              properties: {
                avg_frequency: { type: "string" },
                success_rate: { type: "number" },
                bottlenecks: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setPortfolioData({
        projects: projectHealth,
        analysis,
        total_projects: projects.length,
        total_tasks: tasks.length,
        total_flags: flags.length,
        avg_health: Math.round(projectHealth.reduce((acc, p) => acc + p.health_score, 0) / projectHealth.length)
      });
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
    }
    setIsAnalyzing(false);
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-16 h-16 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  if (!portfolioData) return null;

  const { projects, analysis, total_projects, avg_health } = portfolioData;

  return (
    <div className="space-y-8">
      {/* Hero Health Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <CardContent className="p-12 relative z-10">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-5xl font-bold text-white mb-4">Portfolio Health</h1>
                  <p className="text-xl text-indigo-200 mb-8">{analysis.summary}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Activity className="w-6 h-6 text-white/80 mb-2" />
                    <div className="text-3xl font-bold text-white">{total_projects}</div>
                    <div className="text-sm text-white/70">Projects</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <CheckCircle2 className="w-6 h-6 text-green-400 mb-2" />
                    <div className="text-3xl font-bold text-white">{avg_health}</div>
                    <div className="text-sm text-white/70">Avg Health</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <GitBranch className="w-6 h-6 text-blue-400 mb-2" />
                    <div className="text-3xl font-bold text-white">{analysis.deployment_insights?.success_rate || 0}%</div>
                    <div className="text-sm text-white/70">Deploy Rate</div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center"
              >
                <svg width="280" height="280" viewBox="0 0 280 280">
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
                  <motion.circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - analysis.portfolio_health_score / 100)}
                    transform="rotate(-90 140 140)"
                    initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - analysis.portfolio_health_score / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="text-7xl font-bold text-white"
                  >
                    {analysis.portfolio_health_score}
                  </motion.div>
                  <div className="text-xl text-white/70 mt-2">Health Score</div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Healthiest Projects */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-2xl border-t-4 border-t-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                Top Performing Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analysis.healthiest_projects?.map((project, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-l-green-500"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                      <Badge className="bg-green-600">{project.score}/100</Badge>
                    </div>
                    <ul className="space-y-1">
                      {project.strengths?.map((strength, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* At-Risk Projects */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-2xl border-t-4 border-t-red-500">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                Projects Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {analysis.at_risk_projects?.map((project, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border-l-4 border-l-red-500"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                      <div className="flex gap-2">
                        <Badge className="bg-red-600">{project.score}/100</Badge>
                        <Badge className={
                          project.urgency === 'critical' ? 'bg-red-700' : 'bg-orange-600'
                        }>{project.urgency}</Badge>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {project.issues?.map((issue, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Project Health Chart */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle>Project Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projects.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="project_name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="health_score" fill="#6366f1" name="Health Score" radius={[8, 8, 0, 0]} />
                <Bar dataKey="code_score" fill="#8b5cf6" name="Code Quality" radius={[8, 8, 0, 0]} />
                <Bar dataKey="task_completion" fill="#10b981" name="Task Completion" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cross-Project Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-2xl border-t-4 border-t-yellow-500">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-600" />
              Cross-Project Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {analysis.cross_project_patterns?.map((pattern, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="bg-white rounded-xl p-4 border-2 border-yellow-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{pattern.pattern}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">{pattern.affected_projects} projects</Badge>
                      <Badge className={
                        pattern.severity === 'high' ? 'bg-red-600' :
                        pattern.severity === 'medium' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }>{pattern.severity}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{pattern.recommendation}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strategic Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="shadow-2xl border-t-4 border-t-indigo-500">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-600" />
              AI Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.strategic_recommendations?.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-gray-900">{rec.title}</h4>
                    <Badge className={
                      rec.priority === 'high' ? 'bg-red-600' :
                      rec.priority === 'medium' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }>{rec.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-gray-600">Impact: {rec.impact}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      <span className="text-gray-600">Effort: {rec.effort}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}