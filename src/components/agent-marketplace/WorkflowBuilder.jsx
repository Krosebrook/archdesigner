import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { 
  Plus, 
  ArrowRight, 
  Play, 
  Save, 
  Trash2, 
  Clock,
  GitBranch,
  Zap,
  Settings,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";
import WorkflowExecutor from "./WorkflowExecutor";
import ProactiveInsights from "./ProactiveInsights";

export default function WorkflowBuilder({ project, installedAgents = [] }) {
  const [workflow, setWorkflow] = useState({
    name: "",
    description: "",
    agents: [],
    trigger: "manual"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showExecutor, setShowExecutor] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  const addAgent = useCallback((agent) => {
    setWorkflow(prev => ({
      ...prev,
      agents: [
        ...prev.agents,
        {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_icon: agent.icon,
          order: prev.agents.length,
          config: agent.default_config || {},
          depends_on: [],
          condition: "",
          on_error: "stop",
          max_retries: 2,
          use_internet_context: true
        }
      ]
    }));
  }, []);

  const updateAgent = useCallback((index, updates) => {
    setWorkflow(prev => ({
      ...prev,
      agents: prev.agents.map((agent, i) => 
        i === index ? { ...agent, ...updates } : agent
      )
    }));
  }, []);

  const removeAgent = useCallback((index) => {
    setWorkflow(prev => ({
      ...prev,
      agents: prev.agents.filter((_, i) => i !== index)
    }));
  }, []);

  const moveAgent = useCallback((index, direction) => {
    setWorkflow(prev => {
      const newAgents = [...prev.agents];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newAgents.length) return prev;
      
      [newAgents[index], newAgents[targetIndex]] = [newAgents[targetIndex], newAgents[index]];
      newAgents.forEach((agent, i) => agent.order = i);
      
      return { ...prev, agents: newAgents };
    });
  }, []);

  const saveWorkflow = async () => {
    if (!workflow.name || workflow.agents.length === 0) {
      toast.error("Please name your workflow and add at least one agent");
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.AgentWorkflow.create({
        ...workflow,
        project_id: project.id
      });
      toast.success("Workflow saved successfully!");
      setWorkflow({ name: "", description: "", agents: [], trigger: "manual" });
    } catch (error) {
      console.error("Save workflow error:", error);
      toast.error("Failed to save workflow");
    }
    setIsSaving(false);
  };

  const openExecutor = () => {
    if (workflow.agents.length === 0) {
      toast.error("Add agents to run the workflow");
      return;
    }
    setShowExecutor(true);
  };

  if (showExecutor) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setShowExecutor(false)}
        >
          ← Back to Builder
        </Button>
        <WorkflowExecutor
          workflow={workflow}
          project={project}
          agents={installedAgents}
          onComplete={() => setShowExecutor(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Proactive Insights */}
      <ProactiveInsights projectId={project.id} />
      
      <div className="grid lg:grid-cols-3 gap-6">
      {/* Agent Library */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Available Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {installedAgents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Install agents from the marketplace first
            </p>
          ) : (
            installedAgents.map(agent => (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 border rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all"
                onClick={() => addAgent(agent)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {agent.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {agent.specialization}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100" />
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Workflow Builder */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-600" />
            Workflow Designer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Input
              placeholder="Workflow name (e.g., 'Full Stack Audit')"
              value={workflow.name}
              onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
            />
            <Textarea
              placeholder="Workflow description..."
              value={workflow.description}
              onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
              className="h-20"
            />
          </div>

          {/* Agent Chain */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-900">Agent Chain</h4>
              <Badge variant="outline">{workflow.agents.length} agents</Badge>
            </div>

            <AnimatePresence mode="popLayout">
              {workflow.agents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
                >
                  <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Click agents from the library to build your workflow
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {workflow.agents.map((agent, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="relative"
                    >
                      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-600 text-white">
                              {index + 1}
                            </Badge>
                            <span className="text-2xl">{agent.agent_icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">
                                {agent.agent_name}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingAgent(editingAgent === index ? null : index)}
                                className="h-7 w-7 p-0"
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveAgent(index, "up")}
                                disabled={index === 0}
                                className="h-7 w-7 p-0"
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => moveAgent(index, "down")}
                                disabled={index === workflow.agents.length - 1}
                                className="h-7 w-7 p-0"
                              >
                                ↓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeAgent(index)}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {editingAgent === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 pt-3 border-t border-purple-200"
                              >
                                <div>
                                  <Label className="text-xs">Condition (optional)</Label>
                                  <Input
                                    placeholder="e.g., output.score > 0.8"
                                    value={agent.condition || ""}
                                    onChange={(e) => updateAgent(index, { condition: e.target.value })}
                                    className="text-xs h-8"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">On Error</Label>
                                  <Select
                                    value={agent.on_error}
                                    onValueChange={(value) => updateAgent(index, { on_error: value })}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="stop">Stop workflow</SelectItem>
                                      <SelectItem value="continue">Continue anyway</SelectItem>
                                      <SelectItem value="fallback">Use fallback</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-xs">Max Retries</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={agent.max_retries || 2}
                                    onChange={(e) => updateAgent(index, { max_retries: parseInt(e.target.value) })}
                                    className="text-xs h-8"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                      {index < workflow.agents.length - 1 && (
                        <div className="flex justify-center py-1">
                          <ArrowRight className="w-5 h-5 text-purple-400" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={openExecutor}
              disabled={workflow.agents.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Execute Workflow
            </Button>
            <Button
              onClick={saveWorkflow}
              disabled={isSaving || !workflow.name || workflow.agents.length === 0}
              variant="outline"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

WorkflowBuilder.propTypes = {
  project: PropTypes.object.isRequired,
  installedAgents: PropTypes.array
};