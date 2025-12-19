import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Loader2, 
  History,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import { format } from "date-fns";

const interactionTypeColors = {
  refactoring: "bg-purple-100 text-purple-800",
  code_generation: "bg-blue-100 text-blue-800",
  architecture_decision: "bg-green-100 text-green-800",
  test_generation: "bg-orange-100 text-orange-800",
  documentation: "bg-teal-100 text-teal-800",
  service_creation: "bg-pink-100 text-pink-800",
  deployment: "bg-indigo-100 text-indigo-800",
  analysis: "bg-yellow-100 text-yellow-800"
};

function AIContextManager({ project }) {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadMemories();
  }, [project.id]);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.AIContextMemory.filter(
        { project_id: project.id },
        '-created_date'
      );
      setMemories(data);
      calculateStats(data);
    } catch (error) {
      console.error("Failed to load memories:", error);
    }
    setIsLoading(false);
  };

  const calculateStats = (data) => {
    const accepted = data.filter(m => m.metadata?.user_feedback === 'accepted').length;
    const rejected = data.filter(m => m.metadata?.user_feedback === 'rejected').length;
    const total = data.length;
    const avgConfidence = data.reduce((sum, m) => sum + (m.metadata?.confidence_score || 0), 0) / total;

    setStats({
      total,
      accepted,
      rejected,
      accuracy: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0,
      avgConfidence: avgConfidence.toFixed(2),
      totalTokens: data.reduce((sum, m) => sum + (m.token_count || 0), 0)
    });
  };

  const summarizeOldMemories = async () => {
    setIsSummarizing(true);
    try {
      // Get memories older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldMemories = memories.filter(m => 
        !m.is_summarized && 
        new Date(m.created_date) < thirtyDaysAgo
      );

      if (oldMemories.length === 0) {
        toast.info("No old memories to summarize");
        setIsSummarizing(false);
        return;
      }

      const prompt = `Summarize these AI interactions into concise context:

${oldMemories.map(m => `
Type: ${m.interaction_type}
Prompt: ${m.user_prompt}
Response: ${m.ai_response.substring(0, 200)}...
Feedback: ${m.metadata?.user_feedback || 'pending'}
`).join('\n')}

Create a brief summary preserving key decisions, patterns, and outcomes.`;

      const summary = await base44.integrations.Core.InvokeLLM({ prompt });

      // Update memories with summaries
      await Promise.all(oldMemories.map(m =>
        base44.entities.AIContextMemory.update(m.id, {
          context_summary: summary,
          is_summarized: true,
          ai_response: "" // Clear full response to save space
        })
      ));

      toast.success(`Summarized ${oldMemories.length} old interactions`);
      loadMemories();
    } catch (error) {
      console.error("Summarization failed:", error);
      toast.error("Failed to summarize memories");
    }
    setIsSummarizing(false);
  };

  const provideFeedback = async (memoryId, feedback) => {
    try {
      await base44.entities.AIContextMemory.update(memoryId, {
        metadata: { 
          ...memories.find(m => m.id === memoryId).metadata,
          user_feedback: feedback 
        }
      });
      toast.success("Feedback saved");
      loadMemories();
    } catch (error) {
      console.error("Failed to save feedback:", error);
    }
  };

  const deleteMemory = async (memoryId) => {
    try {
      await base44.entities.AIContextMemory.delete(memoryId);
      toast.success("Memory deleted");
      loadMemories();
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-600" />
            AI Context Memory
          </CardTitle>
          <CardDescription>
            Long-term memory of AI interactions and decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white rounded-lg p-3 border">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-600">Interactions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-900">{stats.accuracy}%</div>
                <div className="text-xs text-green-700">Accuracy</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">{stats.avgConfidence}</div>
                <div className="text-xs text-blue-700">Avg Confidence</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-2xl font-bold text-purple-900">
                  {Math.round(stats.totalTokens / 1000)}k
                </div>
                <div className="text-xs text-purple-700">Tokens Used</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="text-2xl font-bold text-orange-900">{stats.accepted}</div>
                <div className="text-xs text-orange-700">Accepted</div>
              </div>
            </div>
          )}

          <Button
            onClick={summarizeOldMemories}
            disabled={isSummarizing}
            variant="outline"
            className="w-full"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Optimize Old Memories (30+ days)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="all">All History</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-3">
          <AnimatePresence>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : memories.slice(0, 20).map((memory, idx) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={interactionTypeColors[memory.interaction_type]}>
                              {memory.interaction_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(memory.created_date), 'PPp')}
                            </span>
                            {memory.metadata?.confidence_score && (
                              <Badge variant="outline">
                                {(memory.metadata.confidence_score * 100).toFixed(0)}% confident
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {memory.user_prompt}
                          </p>
                          {memory.is_summarized ? (
                            <p className="text-sm text-gray-600 italic">
                              Summary: {memory.context_summary}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {memory.ai_response}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMemory(memory.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      {memory.metadata?.tags && memory.metadata.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {memory.metadata.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-xs text-gray-500">Was this helpful?</span>
                        <Button
                          size="sm"
                          variant={memory.metadata?.user_feedback === 'accepted' ? 'default' : 'ghost'}
                          onClick={() => provideFeedback(memory.id, 'accepted')}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={memory.metadata?.user_feedback === 'rejected' ? 'default' : 'ghost'}
                          onClick={() => provideFeedback(memory.id, 'rejected')}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {memories.map((memory, idx) => (
            <Card key={memory.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={interactionTypeColors[memory.interaction_type]}>
                      {memory.interaction_type}
                    </Badge>
                    <p className="text-sm mt-2">{memory.user_prompt}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(memory.created_date), 'PP')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

AIContextManager.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
};

export default AIContextManager;