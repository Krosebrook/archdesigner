import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, 
  Calendar, Target, Users, FileText, Loader2, RefreshCw,
  Zap, GitBranch, Clock, Activity, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function AIProjectAssistant({ project, services }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedView, setSelectedView] = useState("standup");
  const [insights, setInsights] = useState({
    standup: null,
    risks: null,
    priorities: null,
    collaboration: null
  });

  useEffect(() => {
    loadExistingInsights();
  }, [project?.id]);

  const loadExistingInsights = async () => {
    if (!project?.id) return;
    
    try {
      const docs = await base44.entities.Documentation.filter(
        { project_id: project.id, doc_type: "status" },
        '-created_date',
        1
      );
      
      if (docs.length > 0) {
        setInsights(prev => ({ ...prev, standup: docs[0].content }));
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    }
  };

  const generateStandupSummary = async () => {
    setIsAnalyzing(true);
    try {
      const [tasks, cicdConfigs, validationReports, codeReviews, apiGateways] = await Promise.all([
        base44.entities.Task.filter({ project_id: project.id }),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.ValidationReport.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.CodeReview.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.APIGateway.filter({ project_id: project.id }, '-created_date', 1)
      ]);

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
      const blockedTasks = tasks.filter(t => t.status === 'blocked');

      const prompt = `Generate a comprehensive daily stand-up summary for this project:

PROJECT: ${project.name} (${project.status})
SERVICES: ${services.length} microservices

TASK STATUS:
- Completed: ${completedTasks.length} (${completedTasks.slice(0, 5).map(t => t.title).join(', ')})
- In Progress: ${inProgressTasks.length} (${inProgressTasks.slice(0, 5).map(t => t.title).join(', ')})
- Blocked: ${blockedTasks.length} ${blockedTasks.length > 0 ? '⚠️' : ''}

CI/CD STATUS:
${cicdConfigs.length > 0 ? `Platform: ${cicdConfigs[0].platform}
Recent builds: ${cicdConfigs[0].deployment_targets?.length || 0} deployments configured` : 'Not configured'}

ARCHITECTURE HEALTH:
${validationReports.length > 0 ? `Score: ${validationReports[0].overall_score}/100
Critical Issues: ${validationReports[0].critical_count || 0}
High Priority: ${validationReports[0].high_count || 0}` : 'No recent validation'}

CODE QUALITY:
${codeReviews.length > 0 ? `Score: ${codeReviews[0].overall_score}/100
Findings: ${codeReviews[0].findings?.length || 0} issues identified` : 'No recent review'}

API PERFORMANCE:
${apiGateways.length > 0 ? `Requests/Day: ${apiGateways[0].traffic_insights?.total_requests || 0}
Avg Latency: ${apiGateways[0].traffic_insights?.avg_latency_ms || 0}ms
Error Rate: ${apiGateways[0].traffic_insights?.error_rate || 0}%` : 'Not monitored'}

Generate a stand-up summary with:
1. **Yesterday's Accomplishments** - What was delivered
2. **Today's Focus** - What's in progress and priorities
3. **Blockers & Challenges** - Issues needing attention
4. **Key Metrics** - Health indicators and trends
5. **Team Momentum** - Velocity and morale indicators

Make it actionable, concise, and suitable for team sync meetings.`;

      const summary = await base44.integrations.Core.InvokeLLM({ prompt });
      
      setInsights(prev => ({ ...prev, standup: summary }));
      setSelectedView("standup");
    } catch (error) {
      console.error("Error generating standup:", error);
    }
    setIsAnalyzing(false);
  };

  const identifyRisks = async () => {
    setIsAnalyzing(true);
    try {
      const [tasks, cicdConfigs, validationReports, performanceTunings, documentation] = await Promise.all([
        base44.entities.Task.filter({ project_id: project.id }),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.ValidationReport.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.PerformanceTuning.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.Documentation.filter({ project_id: project.id, sync_status: "outdated" })
      ]);

      const blockedTasks = tasks.filter(t => t.status === 'blocked');
      const backlogTasks = tasks.filter(t => t.status === 'backlog');
      const criticalTasks = tasks.filter(t => t.priority_level === 'critical');

      const prompt = `Analyze project risks and provide proactive recommendations:

PROJECT: ${project.name}
RISK INDICATORS:

BACKLOG:
- Total backlog items: ${backlogTasks.length}
- Critical priority items: ${criticalTasks.length}
- Blocked tasks: ${blockedTasks.length}
${blockedTasks.slice(0, 3).map(t => `  - ${t.title}: ${t.description}`).join('\n')}

PIPELINE STATUS:
${cicdConfigs.length > 0 ? `- CI/CD configured on ${cicdConfigs[0].platform}
- Deployment targets: ${cicdConfigs[0].deployment_targets?.length || 0}` : '- ⚠️ No CI/CD pipeline configured'}

ARCHITECTURE HEALTH:
${validationReports.length > 0 ? `- Health Score: ${validationReports[0].overall_score}/100
- Critical Issues: ${validationReports[0].critical_count || 0}
- High Priority Issues: ${validationReports[0].high_count || 0}` : '- No validation data'}

PERFORMANCE:
${performanceTunings.length > 0 ? `- Performance Score: ${performanceTunings[0].overall_score}/100
- Bottlenecks: ${performanceTunings[0].bottlenecks?.length || 0}` : '- No performance analysis'}

DOCUMENTATION:
- Outdated docs: ${documentation.length}

Identify and analyze:
1. **Critical Risks** - Immediate threats to delivery
2. **Medium Risks** - Issues requiring monitoring
3. **Emerging Concerns** - Early warning signals
4. **Mitigation Strategies** - Concrete action items
5. **Timeline Impact** - How risks affect delivery dates

Format as structured markdown with risk levels, impact assessment, and recommendations.`;

      const risks = await base44.integrations.Core.InvokeLLM({ prompt });
      
      setInsights(prev => ({ ...prev, risks }));
      setSelectedView("risks");
    } catch (error) {
      console.error("Error identifying risks:", error);
    }
    setIsAnalyzing(false);
  };

  const suggestPrioritization = async () => {
    setIsAnalyzing(true);
    try {
      const [tasks, serviceDiscoveries, validationReports] = await Promise.all([
        base44.entities.Task.filter({ project_id: project.id }),
        base44.entities.ServiceDiscovery.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.ValidationReport.filter({ project_id: project.id }, '-created_date', 1)
      ]);

      const prompt = `Generate intelligent task prioritization for this project:

PROJECT GOALS: ${project.description}
CURRENT STATUS: ${project.status}

TASKS (${tasks.length} total):
${tasks.slice(0, 15).map(t => `
- [${t.status}] ${t.title}
  Priority: ${t.priority_level || 'medium'}
  ${t.priority_score ? `Score: ${t.priority_score}/100` : ''}
  ${t.dependencies?.length > 0 ? `Dependencies: ${t.dependencies.length}` : ''}
  ${t.ai_reasoning || ''}
`).join('\n')}

ARCHITECTURAL GAPS:
${serviceDiscoveries.length > 0 ? `
Suggested Services: ${serviceDiscoveries[0].suggested_services?.length || 0}
Architecture Recommendations: ${serviceDiscoveries[0].architecture_recommendations?.length || 0}
` : 'No discovery analysis'}

VALIDATION ISSUES:
${validationReports.length > 0 ? `
Issues requiring resolution: ${(validationReports[0].issues || []).slice(0, 5).map(i => i.title).join(', ')}
` : 'None'}

Create prioritized task recommendations with:
1. **This Week's Must-Dos** - Highest impact, unblocked tasks
2. **Dependencies First** - Tasks blocking others
3. **Quick Wins** - Low effort, high value items
4. **Technical Debt** - Important but not urgent
5. **Long-term Initiatives** - Strategic items

Consider: dependencies, risk mitigation, team capacity, and project goals.
Provide clear rationale for each priority tier.`;

      const priorities = await base44.integrations.Core.InvokeLLM({ prompt });
      
      setInsights(prev => ({ ...prev, priorities }));
      setSelectedView("priorities");
    } catch (error) {
      console.error("Error generating priorities:", error);
    }
    setIsAnalyzing(false);
  };

  const generateCollaborationSummary = async () => {
    setIsAnalyzing(true);
    try {
      const [documentation, codeReviews, architectureRefinements, cicdConfigs] = await Promise.all([
        base44.entities.Documentation.filter({ project_id: project.id, doc_type: "architecture" }, '-created_date', 1),
        base44.entities.CodeReview.filter({ project_id: project.id }, '-created_date', 3),
        base44.entities.ArchitectureRefinement.filter({ project_id: project.id }, '-created_date', 1),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }, '-created_date', 1)
      ]);

      const prompt = `Generate a stakeholder-friendly collaboration summary:

PROJECT: ${project.name}
SERVICES: ${services.map(s => `${s.name} (${s.category})`).join(', ')}

ARCHITECTURAL DECISIONS:
${documentation.length > 0 ? documentation[0].content.substring(0, 1000) : 'No architecture docs'}

${architectureRefinements.length > 0 ? `
RECENT REFINEMENTS:
Type: ${architectureRefinements[0].refinement_type}
Analysis: ${architectureRefinements[0].current_state_analysis}
Proposed Changes: ${architectureRefinements[0].proposed_changes?.length || 0}
` : ''}

CODE REVIEW INSIGHTS:
${codeReviews.length > 0 ? `
Recent Reviews: ${codeReviews.length}
Average Score: ${Math.round(codeReviews.reduce((acc, r) => acc + r.overall_score, 0) / codeReviews.length)}/100
Key Findings: ${codeReviews[0].summary}
Positive Highlights: ${codeReviews[0].positive_highlights?.slice(0, 3).join(', ') || 'None'}
` : 'No recent reviews'}

CI/CD SETUP:
${cicdConfigs.length > 0 ? `
Platform: ${cicdConfigs[0].platform}
Deployment: ${cicdConfigs[0].deployment_targets?.map(t => t.environment).join(', ')}
` : 'Not configured'}

Create a collaboration summary with:
1. **Key Architectural Decisions** - What and why
2. **Technical Direction** - Where we're headed
3. **Quality Indicators** - Code review insights
4. **Recent Wins** - Positive achievements
5. **Team Alignment** - Shared understanding points
6. **Stakeholder Actions** - What leadership needs to know/do

Make it accessible for both technical and non-technical stakeholders.`;

      const collaboration = await base44.integrations.Core.InvokeLLM({ prompt });
      
      setInsights(prev => ({ ...prev, collaboration }));
      setSelectedView("collaboration");
    } catch (error) {
      console.error("Error generating collaboration summary:", error);
    }
    setIsAnalyzing(false);
  };

  const insightCards = [
    {
      id: "standup",
      title: "Daily Stand-up",
      description: "Yesterday's wins, today's focus, blockers",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      action: generateStandupSummary
    },
    {
      id: "risks",
      title: "Risk Analysis",
      description: "Proactive risk identification & mitigation",
      icon: AlertTriangle,
      color: "from-red-500 to-orange-500",
      action: identifyRisks
    },
    {
      id: "priorities",
      title: "Task Prioritization",
      description: "AI-driven priority recommendations",
      icon: Target,
      color: "from-purple-500 to-pink-500",
      action: suggestPrioritization
    },
    {
      id: "collaboration",
      title: "Collaboration Hub",
      description: "Decisions, reviews, team alignment",
      icon: Users,
      color: "from-green-500 to-teal-500",
      action: generateCollaborationSummary
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 border-0 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          
          <CardContent className="p-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-6"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Bot className="w-10 h-10 text-white" />
              </motion.div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  AI Project Assistant
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-8 h-8 text-yellow-300" />
                  </motion.div>
                </h1>
                <p className="text-xl text-indigo-100">
                  Intelligent insights, proactive risk detection, and collaborative intelligence for {project.name}
                </p>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => {
                    generateStandupSummary();
                    identifyRisks();
                    suggestPrioritization();
                    generateCollaborationSummary();
                  }}
                  disabled={isAnalyzing}
                  className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm px-8 py-6 text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Analyze All
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insight Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {insightCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ y: -8, scale: 1.02 }}
          >
            <Card 
              className="cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              onClick={card.action}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <CardHeader className="relative z-10">
                <div className={`w-14 h-14 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">{card.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-2">{card.description}</p>
              </CardHeader>
              
              {insights[card.id] && (
                <CardContent className="relative z-10">
                  <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </Badge>
                </CardContent>
              )}

              <motion.div
                className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Insights Display */}
      <AnimatePresence mode="wait">
        {insights[selectedView] && (
          <motion.div
            key={selectedView}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 via-white to-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    {React.createElement(insightCards.find(c => c.id === selectedView)?.icon || FileText, {
                      className: "w-6 h-6 text-indigo-600"
                    })}
                    {insightCards.find(c => c.id === selectedView)?.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={insightCards.find(c => c.id === selectedView)?.action}
                      disabled={isAnalyzing}
                      variant="outline"
                      size="sm"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0">
                    {insightCards.map(card => (
                      <TabsTrigger 
                        key={card.id} 
                        value={card.id}
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500"
                      >
                        <card.icon className="w-4 h-4 mr-2" />
                        {card.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {insightCards.map(card => (
                    <TabsContent key={card.id} value={card.id} className="p-8">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700"
                      >
                        <ReactMarkdown>{insights[card.id]}</ReactMarkdown>
                      </motion.div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!insights[selectedView] && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="shadow-lg">
            <CardContent className="p-16 text-center">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Brain className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Ready to Assist
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Click any insight card above or "Analyze All" to get AI-powered recommendations for your project
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {insightCards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  >
                    <Badge variant="outline" className="px-4 py-2">
                      <card.icon className="w-3 h-3 mr-2" />
                      {card.title}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}