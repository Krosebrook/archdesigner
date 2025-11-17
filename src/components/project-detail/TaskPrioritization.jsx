import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Loader2, CheckCircle2, Clock, AlertCircle, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig = {
  critical: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
  high: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: ArrowUp },
  medium: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  low: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock }
};

const statusConfig = {
  backlog: { color: "bg-gray-100 text-gray-700", label: "Backlog" },
  in_progress: { color: "bg-blue-100 text-blue-700", label: "In Progress" },
  completed: { color: "bg-green-100 text-green-700", label: "Completed" },
  blocked: { color: "bg-red-100 text-red-700", label: "Blocked" }
};

export default function TaskPrioritization({ project, services }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = async () => {
    setIsLoading(true);
    const allTasks = await base44.entities.Task.filter({ project_id: project.id }, '-priority_score');
    setTasks(allTasks);
    setIsLoading(false);
  };

  const analyzePriorities = async () => {
    setIsAnalyzing(true);
    
    const prompt = `Analyze and prioritize these tasks for a microservices project:

Project: ${project.name}
Description: ${project.description}
Services: ${services.map(s => s.name).join(', ')}

Tasks:
${tasks.map((t, i) => `${i + 1}. ${t.title}: ${t.description}`).join('\n')}

For each task, provide:
- priority_score (0-100)
- priority_level (critical/high/medium/low)
- reasoning for the priority
- estimated_effort
- suggested dependencies (task indices that should be completed first)

Consider: business value, technical dependencies, risk, complexity, and project goals.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          priorities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task_index: { type: "number" },
                priority_score: { type: "number" },
                priority_level: { type: "string" },
                reasoning: { type: "string" },
                estimated_effort: { type: "string" },
                dependency_indices: { type: "array", items: { type: "number" } }
              }
            }
          }
        }
      }
    });

    for (const priority of result.priorities) {
      const task = tasks[priority.task_index];
      if (task) {
        const dependencies = priority.dependency_indices.map(idx => tasks[idx]?.id).filter(Boolean);
        
        await base44.entities.Task.update(task.id, {
          priority_score: priority.priority_score,
          priority_level: priority.priority_level,
          ai_reasoning: priority.reasoning,
          estimated_effort: priority.estimated_effort,
          dependencies
        });
      }
    }

    await loadTasks();
    setIsAnalyzing(false);
  };

  const addTask = async () => {
    if (!newTask.title) return;

    await base44.entities.Task.create({
      project_id: project.id,
      title: newTask.title,
      description: newTask.description,
      status: "backlog"
    });

    setNewTask({ title: "", description: "" });
    setShowAddForm(false);
    await loadTasks();
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    await base44.entities.Task.update(taskId, { status: newStatus });
    await loadTasks();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Task Prioritization
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Task
              </Button>
              <Button
                onClick={analyzePriorities}
                disabled={isAnalyzing || tasks.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-1" />
                    Prioritize All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3"
              >
                <Input
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Task description..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="h-20"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addTask}>Add Task</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks yet. Add your first task to get AI-powered prioritization.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const PriorityIcon = task.priority_level ? priorityConfig[task.priority_level].icon : Clock;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          {task.priority_score && (
                            <Badge className={priorityConfig[task.priority_level].color}>
                              <PriorityIcon className="w-3 h-3 mr-1" />
                              {task.priority_level} ({task.priority_score})
                            </Badge>
                          )}
                          <Badge className={statusConfig[task.status].color}>
                            {statusConfig[task.status].label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        
                        {task.ai_reasoning && (
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-2">
                            <p className="text-xs text-purple-900">
                              <strong>AI Analysis:</strong> {task.ai_reasoning}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {task.estimated_effort && (
                            <span>⏱️ {task.estimated_effort}</span>
                          )}
                          {task.assigned_to && (
                            <span>👤 {task.assigned_to}</span>
                          )}
                          {task.dependencies?.length > 0 && (
                            <span>🔗 {task.dependencies.length} dependencies</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 
                              task.status === 'backlog' ? 'in_progress' : 'completed'
                            )}
                          >
                            {task.status === 'backlog' ? 'Start' : 'Complete'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}