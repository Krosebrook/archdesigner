import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Plus, Pin, Eye, Calendar, Sparkles, 
  FileText, Rocket, Loader2, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHero } from "../shared/AnimatedHero";
import { AISearch } from "./AISearch";
import { DocumentEditor } from "./DocumentEditor";
import { ReleaseNoteGenerator } from "./ReleaseNoteGenerator";
import ReactMarkdown from "react-markdown";

const categoryIcons = {
  onboarding: "🚀",
  architecture: "🏗️",
  api_docs: "📡",
  runbook: "📖",
  wiki: "📚",
  release_notes: "🎉",
  analysis: "📊",
  discovery: "🔍",
  best_practices: "⭐"
};

export default function KnowledgeBaseHub({ project, services }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [autoIndexing, setAutoIndexing] = useState(false);

  useEffect(() => {
    loadArticles();
  }, [project.id]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.KnowledgeBase.filter(
        { project_id: project.id },
        '-created_date'
      );
      setArticles(data);
    } catch (error) {
      console.error("Load error:", error);
    }
    setLoading(false);
  };

  const autoIndexExistingData = async () => {
    setAutoIndexing(true);
    try {
      // Get all AI-generated content
      const [discovery, cicd, docs, analysis] = await Promise.all([
        base44.entities.ServiceDiscovery.filter({ project_id: project.id }),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }),
        base44.entities.Documentation.filter({ project_id: project.id }),
        base44.entities.PerformanceTuning.filter({ project_id: project.id })
      ]);

      // Index service discovery
      for (const disc of discovery) {
        const existing = articles.find(a => a.source_id === disc.id);
        if (!existing) {
          await base44.entities.KnowledgeBase.create({
            project_id: project.id,
            title: "AI Service Discovery Analysis",
            content: `# Service Discovery Analysis\n\n## Suggested Services\n${disc.suggested_services?.map(s => `### ${s.name}\n${s.rationale}\n\n**Priority:** ${s.priority}\n`).join('\n') || 'N/A'}\n\n## Architecture Recommendations\n${disc.architecture_recommendations?.join('\n- ') || 'N/A'}`,
            category: "discovery",
            tags: ["ai-generated", "architecture", "services"],
            auto_generated: true,
            source_entity: "ServiceDiscovery",
            source_id: disc.id
          });
        }
      }

      // Index CI/CD configs
      for (const config of cicd) {
        const existing = articles.find(a => a.source_id === config.id);
        if (!existing) {
          await base44.entities.KnowledgeBase.create({
            project_id: project.id,
            title: `CI/CD Setup: ${config.platform}`,
            content: `# CI/CD Configuration\n\n**Platform:** ${config.platform}\n\n## Setup Instructions\n${config.setup_instructions || 'N/A'}\n\n## Pipeline Configuration\n\`\`\`yaml\n${config.pipeline_config || 'N/A'}\n\`\`\``,
            category: "runbook",
            tags: ["cicd", config.platform, "deployment"],
            auto_generated: true,
            source_entity: "CICDConfiguration",
            source_id: config.id
          });
        }
      }

      // Index documentation
      for (const doc of docs) {
        const existing = articles.find(a => a.source_id === doc.id);
        if (!existing) {
          await base44.entities.KnowledgeBase.create({
            project_id: project.id,
            title: `Documentation: ${doc.doc_type}`,
            content: doc.content,
            category: doc.doc_type === 'api' ? 'api_docs' : 'architecture',
            tags: [doc.doc_type, "auto-generated"],
            auto_generated: true,
            source_entity: "Documentation",
            source_id: doc.id
          });
        }
      }

      // Index performance analysis
      for (const perf of analysis) {
        const existing = articles.find(a => a.source_id === perf.id);
        if (!existing) {
          await base44.entities.KnowledgeBase.create({
            project_id: project.id,
            title: "Performance Tuning Recommendations",
            content: `# Performance Analysis\n\n**Overall Score:** ${perf.overall_score}/100\n\n${perf.analysis_summary}\n\n## Optimization Recommendations\n${perf.optimization_recommendations?.map(r => `### ${r.title}\n${r.description}\n\n**Expected Improvement:** ${r.expected_improvement}\n`).join('\n') || 'N/A'}`,
            category: "analysis",
            tags: ["performance", "optimization", "ai-generated"],
            auto_generated: true,
            source_entity: "PerformanceTuning",
            source_id: perf.id
          });
        }
      }

      await loadArticles();
      alert("Successfully indexed all AI-generated content!");
    } catch (error) {
      console.error("Auto-index error:", error);
    }
    setAutoIndexing(false);
  };

  const handleViewArticle = async (article) => {
    setSelectedArticle(article);
    setActiveTab("view");
    
    // Increment views
    await base44.entities.KnowledgeBase.update(article.id, {
      views_count: (article.views_count || 0) + 1,
      last_viewed: new Date().toISOString()
    });
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this article?")) {
      await base44.entities.KnowledgeBase.delete(id);
      loadArticles();
      if (selectedArticle?.id === id) setSelectedArticle(null);
    }
  };

  const pinnedArticles = articles.filter(a => a.is_pinned);
  const recentArticles = articles.filter(a => !a.is_pinned).slice(0, 20);

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={BookOpen}
        title="Knowledge Base"
        description="AI-powered documentation hub with auto-indexing and semantic search"
      >
        <div className="flex gap-3 mt-4">
          <Button
            onClick={autoIndexExistingData}
            disabled={autoIndexing}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {autoIndexing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Auto-Index AI Content
          </Button>
          <Button
            onClick={() => {
              setSelectedArticle(null);
              setEditing(true);
              setActiveTab("create");
            }}
            className="bg-white text-indigo-900 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>
      </AnimatedHero>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">
            <FileText className="w-4 h-4 mr-2" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="search">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Search
          </TabsTrigger>
          <TabsTrigger value="release">
            <Rocket className="w-4 h-4 mr-2" />
            Release Notes
          </TabsTrigger>
          {selectedArticle && (
            <TabsTrigger value="view">
              <Eye className="w-4 h-4 mr-2" />
              Viewing
            </TabsTrigger>
          )}
          {editing && (
            <TabsTrigger value="create">
              <Plus className="w-4 h-4 mr-2" />
              {selectedArticle ? "Editing" : "Creating"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {pinnedArticles.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Pin className="w-4 h-4 text-yellow-600" />
                    Pinned
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {pinnedArticles.map((article, i) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        index={i}
                        onView={handleViewArticle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">All Articles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {recentArticles.map((article, i) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      index={i + pinnedArticles.length}
                      onView={handleViewArticle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>

              {articles.length === 0 && (
                <Card className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No articles yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create documentation or auto-index AI-generated content
                  </p>
                  <Button onClick={autoIndexExistingData}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-Index Content
                  </Button>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search">
          <AISearch projectId={project.id} onSelectArticle={handleViewArticle} />
        </TabsContent>

        <TabsContent value="release">
          <ReleaseNoteGenerator project={project} services={services} />
        </TabsContent>

        {selectedArticle && (
          <TabsContent value="view">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedArticle.title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Badge>{selectedArticle.category}</Badge>
                      {selectedArticle.auto_generated && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {selectedArticle.views_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedArticle.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditing(true);
                      setActiveTab("create");
                    }}
                  >
                    Edit
                  </Button>
                </div>

                {selectedArticle.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedArticle.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}

                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {editing && (
          <TabsContent value="create">
            <DocumentEditor
              article={selectedArticle}
              projectId={project.id}
              onSave={() => {
                setEditing(false);
                setSelectedArticle(null);
                setActiveTab("browse");
                loadArticles();
              }}
              onCancel={() => {
                setEditing(false);
                setActiveTab(selectedArticle ? "view" : "browse");
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

const ArticleCard = ({ article, index, onView, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryIcons[article.category]}</span>
            {article.is_pinned && <Pin className="w-4 h-4 text-yellow-600" />}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(article.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
        <div onClick={() => onView(article)}>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {article.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {article.content.substring(0, 120)}...
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">{article.category}</Badge>
              {article.auto_generated && (
                <span className="flex items-center gap-1 text-purple-600">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.views_count || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);