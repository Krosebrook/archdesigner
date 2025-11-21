import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Loader2, FileText, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const AISearch = ({ projectId, onSelectArticle }) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      // Get all knowledge base articles
      const allArticles = await base44.entities.KnowledgeBase.filter({ project_id: projectId });
      
      // Get related entities for context
      const [services, tasks, cicd, flags] = await Promise.all([
        base44.entities.Service.filter({ project_id: projectId }),
        base44.entities.Task.filter({ project_id: projectId }),
        base44.entities.CICDConfiguration.filter({ project_id: projectId }),
        base44.entities.FeatureFlag.filter({ project_id: projectId })
      ]);

      // AI-powered semantic search
      const aiResults = await invokeLLM(
        `Search query: "${query}"
        
        Available documentation:
        ${allArticles.map((a, i) => `${i}. [${a.category}] ${a.title} - ${a.content.substring(0, 200)}...`).join('\n')}
        
        Project context:
        - Services: ${services.map(s => s.name).join(', ')}
        - Active tasks: ${tasks.filter(t => t.status !== 'completed').length}
        - CI/CD configs: ${cicd.length}
        - Feature flags: ${flags.length}
        
        Return the top 5 most relevant article indices with relevance scores (0-100) and brief explanations.`,
        {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  score: { type: "number" },
                  reason: { type: "string" }
                }
              }
            },
            suggested_queries: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      );

      const rankedResults = aiResults.results
        .map(r => ({
          ...allArticles[r.index],
          relevance_score: r.score,
          relevance_reason: r.reason
        }))
        .filter(r => r.id);

      setResults(rankedResults);
    } catch (error) {
      console.error("Search error:", error);
    }
    setSearching(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Ask anything about your project..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={searching || !query.trim()}
          className="bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Search
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300"
                onClick={() => onSelectArticle(article)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">{article.title}</h3>
                        <Badge variant="outline">{article.category}</Badge>
                        {article.auto_generated && (
                          <Badge className="bg-purple-100 text-purple-800">AI</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {article.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span className="font-semibold text-purple-600">
                            {article.relevance_score}% match
                          </span>
                        </div>
                        <span>• {article.relevance_reason}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};