import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Sparkles,
  Code2,
  Database,
  Shield,
  Zap,
  GitBranch,
  FileCode,
  TestTube,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";

import AgentCard from "../components/agent-marketplace/AgentCard";
import WorkflowBuilder from "../components/agent-marketplace/WorkflowBuilder";
import AgentBuilder from "../components/agent-marketplace/AgentBuilder";

const CATEGORIES = [
  { id: "all", label: "All Agents", icon: Sparkles },
  { id: "frontend", label: "Frontend", icon: Code2 },
  { id: "backend", label: "Backend", icon: Code2 },
  { id: "database", label: "Database", icon: Database },
  { id: "security", label: "Security", icon: Shield },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "devops", label: "DevOps", icon: GitBranch },
  { id: "testing", label: "Testing", icon: TestTube },
  { id: "documentation", label: "Documentation", icon: BookOpen },
  { id: "specialty", label: "Specialty", icon: Star }
];

const OFFICIAL_AGENTS = [
  {
    name: "Frontend Performance Agent",
    slug: "frontend-performance",
    description: "Analyzes React components for performance bottlenecks, unnecessary re-renders, and optimization opportunities. Suggests code splitting and lazy loading strategies.",
    category: "frontend",
    icon: "⚡",
    color: "#3b82f6",
    specialization: "React Performance Optimization",
    capabilities: ["Bundle size analysis", "Re-render detection", "Code splitting", "Lazy loading", "Memoization"],
    system_prompt: "You are a frontend performance expert specializing in React optimization. Analyze components for performance issues and provide actionable recommendations.",
    tags: ["react", "performance", "optimization", "bundle"],
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 1247,
    requires_context: ["code", "services"],
    output_format: "suggestions"
  },
  {
    name: "Database Optimization Agent",
    slug: "database-optimizer",
    description: "Reviews database queries, indexes, and schema design. Identifies N+1 queries, missing indexes, and suggests denormalization strategies.",
    category: "database",
    icon: "🗄️",
    color: "#10b981",
    specialization: "SQL & NoSQL Optimization",
    capabilities: ["Query analysis", "Index recommendations", "Schema review", "N+1 detection", "Caching strategies"],
    system_prompt: "You are a database optimization expert. Analyze queries and schemas for performance issues and provide optimization recommendations.",
    tags: ["sql", "nosql", "queries", "indexes"],
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 892,
    requires_context: ["services", "architecture"],
    output_format: "suggestions"
  },
  {
    name: "Security Hardening Agent",
    slug: "security-hardening",
    description: "Scans code for OWASP Top 10 vulnerabilities, insecure dependencies, and exposed secrets. Provides remediation steps and security best practices.",
    category: "security",
    icon: "🛡️",
    color: "#ef4444",
    specialization: "Application Security",
    capabilities: ["OWASP scanning", "Dependency audit", "Secret detection", "XSS prevention", "CSRF protection"],
    system_prompt: "You are a security expert specializing in application security. Identify vulnerabilities and provide detailed remediation steps.",
    tags: ["security", "owasp", "vulnerabilities", "secrets"],
    is_public: true,
    is_official: true,
    rating: 5.0,
    installs_count: 2103,
    requires_context: ["code", "services", "dependencies"],
    output_format: "suggestions"
  },
  {
    name: "API Design Agent",
    slug: "api-designer",
    description: "Reviews REST/GraphQL APIs for consistency, best practices, and RESTful principles. Suggests improvements to endpoint design and error handling.",
    category: "backend",
    icon: "🌐",
    color: "#8b5cf6",
    specialization: "API Architecture",
    capabilities: ["REST best practices", "GraphQL optimization", "Error handling", "Versioning strategy", "Documentation"],
    system_prompt: "You are an API design expert. Review API endpoints for consistency, best practices, and suggest improvements.",
    tags: ["api", "rest", "graphql", "design"],
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 756,
    requires_context: ["services", "apis"],
    output_format: "suggestions"
  },
  {
    name: "Test Coverage Agent",
    slug: "test-coverage",
    description: "Analyzes test coverage, identifies untested code paths, and generates test templates. Suggests integration and E2E test scenarios.",
    category: "testing",
    icon: "🧪",
    color: "#f59e0b",
    specialization: "Test Automation",
    capabilities: ["Coverage analysis", "Test generation", "E2E scenarios", "Mock strategies", "CI/CD integration"],
    system_prompt: "You are a testing expert. Analyze code coverage and suggest comprehensive test strategies.",
    tags: ["testing", "coverage", "unit-tests", "e2e"],
    is_public: true,
    is_official: true,
    rating: 4.6,
    installs_count: 634,
    requires_context: ["code", "services"],
    output_format: "code"
  },
  {
    name: "Documentation Generator Agent",
    slug: "docs-generator",
    description: "Automatically generates API documentation, README files, and inline code comments. Maintains documentation consistency across the codebase.",
    category: "documentation",
    icon: "📚",
    color: "#06b6d4",
    specialization: "Technical Writing",
    capabilities: ["API docs", "README generation", "Code comments", "Markdown formatting", "Examples"],
    system_prompt: "You are a technical writer. Generate clear, comprehensive documentation for code and APIs.",
    tags: ["documentation", "readme", "comments", "api-docs"],
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 1045,
    requires_context: ["code", "services", "apis"],
    output_format: "code"
  }
];

export default function AgentMarketplacePage() {
  const [agents, setAgents] = useState([]);
  const [installedAgents, setInstalledAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setIsLoading(true);
    try {
      // Seed official agents if not exist
      const existingAgents = await base44.entities.AgentDefinition.filter({ is_public: true });
      
      if (existingAgents.length === 0) {
        const user = await base44.auth.me();
        await Promise.all(
          OFFICIAL_AGENTS.map(agent =>
            base44.entities.AgentDefinition.create({ ...agent, author: user.email })
          )
        );
      }

      const publicAgents = await base44.entities.AgentDefinition.filter({ is_public: true });
      setAgents(publicAgents);

      // Load user's installed agents
      const user = await base44.auth.me();
      const userAgents = await base44.entities.AgentDefinition.filter({ created_by: user.email });
      setInstalledAgents(userAgents);

      // Load projects
      const projectList = await base44.entities.Project.list('-created_date');
      setProjects(projectList);
      if (projectList.length > 0) setSelectedProject(projectList[0]);
    } catch (error) {
      console.error("Load marketplace error:", error);
      toast.error("Failed to load marketplace");
    }
    setIsLoading(false);
  };

  const handleInstall = async (agent) => {
    try {
      const user = await base44.auth.me();
      
      // Create a copy for the user
      await base44.entities.AgentDefinition.create({
        ...agent,
        is_public: false,
        author: user.email,
        created_by: user.email
      });

      // Update install count
      await base44.entities.AgentDefinition.update(agent.id, {
        installs_count: (agent.installs_count || 0) + 1
      });

      toast.success(`${agent.name} installed successfully!`);
      loadMarketplace();
    } catch (error) {
      console.error("Install error:", error);
      toast.error("Failed to install agent");
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || 
                           agent.category === categoryFilter ||
                           (categoryFilter === "specialty" && !["frontend", "backend", "database", "security", "performance", "devops", "testing", "documentation"].includes(agent.category));
    return matchesSearch && matchesCategory;
  });

  const isInstalled = (agent) => {
    return installedAgents.some(a => a.slug === agent.slug);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              AI Agent Marketplace
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Discover specialized AI co-pilots for every aspect of development. 
              Chain agents together to create powerful automated workflows.
            </p>
            <div className="flex gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                <TrendingUp className="w-3 h-3 mr-1" />
                {agents.length} Agents Available
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                <Star className="w-3 h-3 mr-1 fill-white" />
                Official Collection
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="browse">Browse Agents</TabsTrigger>
          <TabsTrigger value="workflows">Build Workflow</TabsTrigger>
          <TabsTrigger value="builder">
            <Sparkles className="w-4 h-4 mr-2" />
            Agent Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search agents, tags, capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={categoryFilter === cat.id ? "default" : "outline"}
                    onClick={() => setCategoryFilter(cat.id)}
                    className="shrink-0"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Agent Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AgentCard
                    agent={agent}
                    onInstall={handleInstall}
                    isInstalled={isInstalled(agent)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows">
          {selectedProject ? (
            <WorkflowBuilder
              project={selectedProject}
              installedAgents={installedAgents}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">Please create a project first to build workflows</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder">
          <AgentBuilder onAgentCreated={loadMarketplace} />
        </TabsContent>
      </Tabs>
    </div>
  );
}