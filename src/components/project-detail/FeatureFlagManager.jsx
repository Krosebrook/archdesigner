import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Flag, Plus, Loader2, Sparkles, TrendingUp, Users, 
  Settings, Code, CheckCircle2, XCircle, AlertTriangle,
  GitBranch, Target, Zap, Search, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function FeatureFlagManager({ project, services }) {
  const [flags, setFlags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadFlags();
  }, [project?.id]);

  const loadFlags = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.FeatureFlag.filter(
        { project_id: project.id },
        '-created_date'
      );
      setFlags(data);
    } catch (error) {
      console.error("Error loading flags:", error);
    }
    setIsLoading(false);
  };

  const generateAIFlags = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Analyze this microservices project and suggest intelligent feature flags:

PROJECT: ${project.name}
SERVICES: ${services.map(s => s.name).join(', ')}

Generate 8-10 strategic feature flags for:
1. New feature rollouts (gradual deployment)
2. Performance optimizations (cache strategies, query optimizations)
3. Experimental features (A/B testing candidates)
4. Kill switches (disable problematic features quickly)
5. Service migrations (blue-green deployments)

For each flag provide:
- flag_key: Lowercase snake_case identifier
- name: Human-readable name
- description: Clear explanation of what it controls
- rollout_strategy: all_at_once, percentage, canary, or user_segment
- suggested_staging_rollout: percentage 0-100
- suggested_production_rollout: percentage 0-100
- tags: Array of relevant tags

Return as JSON array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag_key: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  rollout_strategy: { type: "string" },
                  suggested_staging_rollout: { type: "number" },
                  suggested_production_rollout: { type: "number" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const createPromises = result.flags.map(flag => 
        base44.entities.FeatureFlag.create({
          project_id: project.id,
          flag_key: flag.flag_key,
          name: flag.name,
          description: flag.description,
          enabled: false,
          environment_config: {
            staging: {
              enabled: false,
              rollout_percentage: flag.suggested_staging_rollout || 0
            },
            production: {
              enabled: false,
              rollout_percentage: flag.suggested_production_rollout || 0
            }
          },
          rollout_strategy: flag.rollout_strategy || "percentage",
          metadata: {
            tags: flag.tags || [],
            owner: "AI Generated"
          },
          status: "draft"
        })
      );

      await Promise.all(createPromises);
      await loadFlags();
    } catch (error) {
      console.error("Error generating flags:", error);
    }
    setIsGenerating(false);
  };

  const toggleFlag = async (flag, environment) => {
    const newConfig = { ...flag.environment_config };
    if (environment === 'global') {
      await base44.entities.FeatureFlag.update(flag.id, {
        enabled: !flag.enabled
      });
    } else {
      newConfig[environment].enabled = !newConfig[environment].enabled;
      await base44.entities.FeatureFlag.update(flag.id, {
        environment_config: newConfig
      });
    }
    await loadFlags();
  };

  const updateRolloutPercentage = async (flag, environment, percentage) => {
    const newConfig = { ...flag.environment_config };
    newConfig[environment].rollout_percentage = percentage;
    await base44.entities.FeatureFlag.update(flag.id, {
      environment_config: newConfig
    });
    await loadFlags();
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flag.flag_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || flag.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    draft: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
    active: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
    deprecated: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
    archived: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Flag className="w-12 h-12 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-20 animate-pulse" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl"
                >
                  <Flag className="w-9 h-9 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-3xl text-white flex items-center gap-3">
                    Feature Flag Control Center
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                    </motion.div>
                  </CardTitle>
                  <p className="text-indigo-100 mt-2">
                    Progressive delivery with intelligent rollout strategies
                  </p>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={generateAIFlags}
                  disabled={isGenerating}
                  className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate Flags
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="relative z-10">
            <div className="grid md:grid-cols-4 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-4 h-4 text-white/80" />
                  <span className="text-sm text-white/80">Total Flags</span>
                </div>
                <div className="text-3xl font-bold text-white">{flags.length}</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/80">Active</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {flags.filter(f => f.status === 'active').length}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/80">Staging</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {flags.filter(f => f.environment_config?.staging?.enabled).length}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/80">Production</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {flags.filter(f => f.environment_config?.production?.enabled).length}
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Flags Grid */}
      <div className="grid gap-6">
        <AnimatePresence>
          {filteredFlags.map((flag, i) => (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
            >
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{flag.name}</CardTitle>
                        <Badge className={`${statusColors[flag.status]?.bg} ${statusColors[flag.status]?.text}`}>
                          {flag.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{flag.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          <Code className="w-3 h-3 mr-1" />
                          {flag.flag_key}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {flag.rollout_strategy}
                        </Badge>
                        {flag.metadata?.tags?.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Global</span>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={() => toggleFlag(flag, 'global')}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <Tabs defaultValue="staging" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="staging">
                        <GitBranch className="w-4 h-4 mr-2" />
                        Staging
                      </TabsTrigger>
                      <TabsTrigger value="production">
                        <Zap className="w-4 h-4 mr-2" />
                        Production
                      </TabsTrigger>
                    </TabsList>

                    {['staging', 'production'].map(env => (
                      <TabsContent key={env} value={env} className="space-y-4 mt-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3">
                            {flag.environment_config?.[env]?.enabled ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">{env} Environment</p>
                              <p className="text-sm text-gray-600">
                                {flag.environment_config?.[env]?.enabled ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={flag.environment_config?.[env]?.enabled || false}
                            onCheckedChange={() => toggleFlag(flag, env)}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              Rollout Percentage
                            </label>
                            <Badge className="bg-indigo-100 text-indigo-800">
                              {flag.environment_config?.[env]?.rollout_percentage || 0}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={flag.environment_config?.[env]?.rollout_percentage || 0}
                              onChange={(e) => updateRolloutPercentage(flag, env, parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${flag.environment_config?.[env]?.rollout_percentage || 0}%, rgb(229 231 235) ${flag.environment_config?.[env]?.rollout_percentage || 0}%, rgb(229 231 235) 100%)`
                              }}
                            />
                            <Progress 
                              value={flag.environment_config?.[env]?.rollout_percentage || 0} 
                              className="h-2"
                            />
                          </div>

                          <div className="grid grid-cols-5 gap-2 mt-2">
                            {[0, 25, 50, 75, 100].map(val => (
                              <Button
                                key={val}
                                onClick={() => updateRolloutPercentage(flag, env, val)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                {val}%
                              </Button>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredFlags.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Flag className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No feature flags yet</h3>
          <p className="text-gray-500 mb-6">
            Create flags to control feature rollouts and deployments
          </p>
          <Button onClick={generateAIFlags} className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI Flags
          </Button>
        </motion.div>
      )}
    </div>
  );
}