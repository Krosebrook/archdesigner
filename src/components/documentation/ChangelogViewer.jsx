import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Sparkles, Zap, Shield, Rocket, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const CHANGELOG_DATA = {
  version: "2.5.0",
  date: "2025-12-29",
  sections: [
    {
      title: "AI Agent Orchestration & Proactive Intelligence",
      icon: Sparkles,
      color: "from-purple-600 to-pink-600",
      items: [
        {
          type: "added",
          title: "Predictive Analytics Agent",
          description: "Analyzes historical workflow data to forecast potential failures before they occur"
        },
        {
          type: "added",
          title: "Cost Intelligence Agent",
          description: "Tracks agent execution costs and identifies expensive patterns with optimization recommendations"
        },
        {
          type: "added",
          title: "Performance Predictor",
          description: "Forecasts workflow slowdowns and provides performance improvement suggestions"
        },
        {
          type: "added",
          title: "Real-time Insights Dashboard",
          description: "Displays actionable alerts for workflow optimization, failure prediction, and cost reduction"
        },
        {
          type: "added",
          title: "8 Orchestration Agents",
          description: "Workflow coordination, performance monitoring, smart routing, and error recovery"
        }
      ]
    },
    {
      title: "Industry-Specific Project Scaffolding",
      icon: Rocket,
      color: "from-blue-600 to-cyan-600",
      items: [
        {
          type: "added",
          title: "9 Industry Verticals",
          description: "Fintech, Healthcare, E-commerce, SaaS, EdTech, Logistics, Media, IoT, Gaming"
        },
        {
          type: "added",
          title: "Compliance Mapping",
          description: "Automatic compliance requirements (PCI-DSS, HIPAA, GDPR, SOC 2)"
        },
        {
          type: "added",
          title: "Production-Ready Boilerplate",
          description: "Complete server setup, database configs, API handlers, auth middleware"
        },
        {
          type: "added",
          title: "CI/CD Pipeline Templates",
          description: "Industry-specific pipelines with automated compliance scanning"
        },
        {
          type: "added",
          title: "Security Documentation",
          description: "Auto-generated security and compliance documentation"
        }
      ]
    },
    {
      title: "Agent Marketplace Expansion",
      icon: Zap,
      color: "from-green-600 to-emerald-600",
      items: [
        {
          type: "added",
          title: "58+ Specialized Agents",
          description: "Expanded across 10 categories with orchestration agents"
        },
        {
          type: "enhanced",
          title: "Agent Cards",
          description: "Rating system, install counts, and capability badges"
        },
        {
          type: "enhanced",
          title: "Installation Workflow",
          description: "Improved agent installation with version tracking"
        }
      ]
    },
    {
      title: "Visual & Performance",
      icon: Shield,
      color: "from-orange-600 to-red-600",
      items: [
        {
          type: "enhanced",
          title: "Cinematic UI",
          description: "Gradient backgrounds, ambient lighting, glassmorphism effects"
        },
        {
          type: "enhanced",
          title: "Animation System",
          description: "Following Disney's 12 Principles with smooth transitions"
        },
        {
          type: "enhanced",
          title: "Code Optimization",
          description: "Lazy loading, code splitting, reduced bundle size"
        },
        {
          type: "fixed",
          title: "Responsive Layouts",
          description: "Fixed mobile device layout issues"
        }
      ]
    }
  ]
};

const ROADMAP = [
  {
    quarter: "Q1 2026",
    title: "Advanced Intelligence & Automation",
    items: [
      "Agent Learning System",
      "Cross-Project Intelligence",
      "Natural Language Workflows",
      "Advanced Failure Prediction",
      "Real-Time Compliance Monitoring"
    ]
  },
  {
    quarter: "Q2 2026",
    title: "Enterprise Features & Scalability",
    items: [
      "Real-Time Collaborative Editing",
      "Team Workspaces",
      "Advanced Security Features",
      "Custom Report Builder",
      "Benchmarking System"
    ]
  },
  {
    quarter: "Q3 2026",
    title: "Developer Experience",
    items: [
      "VS Code Extension",
      "CLI Tool",
      "SDK Libraries (Python, JS, Go)",
      "Terraform Provider",
      "GitHub Actions Integration"
    ]
  },
  {
    quarter: "Q4 2026",
    title: "AI-Native Platform",
    items: [
      "Conversational Architecture Design",
      "Multi-Cloud Deployment",
      "Event-Driven Workflows",
      "Workflow Templates Marketplace",
      "Auto-Documentation with Screenshots"
    ]
  }
];

const TypeBadge = ({ type }) => {
  const config = {
    added: { label: "Added", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    enhanced: { label: "Enhanced", color: "bg-blue-100 text-blue-800", icon: Sparkles },
    fixed: { label: "Fixed", color: "bg-purple-100 text-purple-800", icon: Shield }
  };

  const { label, color, icon: Icon } = config[type] || config.added;

  return (
    <Badge className={`${color} border-0`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
};

export default function ChangelogViewer() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Version {CHANGELOG_DATA.version}</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          What's New in BuildBuddy
        </h1>
        <p className="text-gray-600 text-lg">
          Released on {new Date(CHANGELOG_DATA.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      <Tabs defaultValue="changelog" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="changelog">
            <BookOpen className="w-4 h-4 mr-2" />
            Changelog
          </TabsTrigger>
          <TabsTrigger value="roadmap">
            <Rocket className="w-4 h-4 mr-2" />
            Roadmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changelog" className="space-y-6 mt-6">
          {CHANGELOG_DATA.sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden border-2">
                  <div className={`h-2 bg-gradient-to-r ${section.color}`} />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${section.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.items.map((item, itemIdx) => (
                      <motion.div
                        key={itemIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 + itemIdx * 0.05 }}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <TypeBadge type={item.type} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {ROADMAP.map((quarter, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full border-2 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                        {quarter.quarter}
                      </Badge>
                      <Rocket className="w-5 h-5 text-gray-400" />
                    </div>
                    <CardTitle className="text-xl">{quarter.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {quarter.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-5 h-5" />
                2027 & Beyond
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "AI Pair Programmer",
                  "Autonomous Architecture Healing",
                  "Blockchain-Based Audit Logs",
                  "AR/VR Architecture Viewer",
                  "Multi-Region Deployment",
                  "Edge Computing Support"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}