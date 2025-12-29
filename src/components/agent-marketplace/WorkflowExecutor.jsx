import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from "@/api/base44Client";
import {
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Activity,
  Terminal
} from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

export default function WorkflowExecutor({ workflow, project, agents, onComplete }) {
  const [execution, setExecution] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [agentResults, setAgentResults] = useState([]);

  const addLog = useCallback((level, message, agentId = null) => {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      agent_id: agentId
    };
    setLogs(prev => [...prev, log]);
  }, []);

  const evaluateCondition = (condition, previousOutput) => {
    if (!condition) return true;
    
    try {
      // Simple condition evaluation
      // Format: "output.score > 0.8" or "output.status === 'success'"
      const fn = new Function('output', `return ${condition}`);
      return fn(previousOutput);
    } catch (error) {
      addLog('error', `Condition evaluation failed: ${error.message}`);
      return false;
    }
  };

  const executeAgent = async (agentStep, previousOutputs) => {
    const agentDef = agents.find(a => a.id === agentStep.agent_id);
    if (!agentDef) {
      throw new Error(`Agent ${agentStep.agent_id} not found`);
    }

    const startTime = Date.now();
    addLog('info', `Starting ${agentDef.name}`, agentStep.agent_id);

    // Check dependencies
    if (agentStep.depends_on && agentStep.depends_on.length > 0) {
      const dependencyOutputs = agentStep.depends_on.map(depId => {
        const depResult = previousOutputs.find(r => r.agent_id === depId);
        if (!depResult || depResult.status !== 'completed') {
          throw new Error(`Dependency ${depId} not satisfied`);
        }
        return depResult.output;
      });

      addLog('info', `Dependencies satisfied: ${agentStep.depends_on.length}`, agentStep.agent_id);
    }

    // Check conditional execution
    if (agentStep.condition) {
      const lastOutput = previousOutputs[previousOutputs.length - 1]?.output;
      if (!evaluateCondition(agentStep.condition, lastOutput)) {
        addLog('info', `Condition not met, skipping`, agentStep.agent_id);
        return {
          agent_id: agentStep.agent_id,
          agent_name: agentDef.name,
          status: 'skipped',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 0
        };
      }
    }

    // Execute with retry logic
    let lastError;
    const maxRetries = agentStep.max_retries || 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          addLog('warning', `Retry attempt ${attempt}/${maxRetries}`, agentStep.agent_id);
        }

        const contextData = {
          project: { name: project.name, description: project.description },
          previousOutputs: previousOutputs.map(o => ({
            agent: o.agent_name,
            output: o.output
          }))
        };

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${agentDef.system_prompt}\n\nContext: ${JSON.stringify(contextData)}\n\nTask: ${agentStep.instructions || 'Analyze and provide recommendations.'}`,
          add_context_from_internet: agentStep.use_internet_context !== false,
          response_json_schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    impact: { type: "string" },
                    priority: { type: "string" }
                  }
                }
              },
              metrics: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  confidence: { type: "number" }
                }
              },
              next_action: { type: "string" }
            }
          }
        });

        const duration = Date.now() - startTime;
        addLog('success', `Completed in ${duration}ms`, agentStep.agent_id);

        return {
          agent_id: agentStep.agent_id,
          agent_name: agentDef.name,
          status: 'completed',
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          output: result,
          retry_count: attempt
        };
      } catch (error) {
        lastError = error;
        addLog('error', `Attempt ${attempt + 1} failed: ${error.message}`, agentStep.agent_id);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed
    throw new Error(`Agent ${agentDef.name} failed after ${maxRetries + 1} attempts: ${lastError.message}`);
  };

  const executeWorkflow = async () => {
    setIsRunning(true);
    setLogs([]);
    setAgentResults([]);
    setCurrentStep(0);

    const executionId = Date.now().toString();
    const startTime = Date.now();

    addLog('info', `Starting workflow: ${workflow.name}`);

    try {
      const executionRecord = await base44.entities.WorkflowExecution.create({
        workflow_id: workflow.id,
        project_id: project.id,
        status: 'running',
        started_at: new Date().toISOString(),
        agent_results: [],
        logs: []
      });

      setExecution(executionRecord);

      const results = [];
      
      for (let i = 0; i < workflow.agents.length; i++) {
        const agentStep = workflow.agents[i];
        setCurrentStep(i);

        try {
          const result = await executeAgent(agentStep, results);
          results.push(result);
          setAgentResults([...results]);

          // Update execution record
          await base44.entities.WorkflowExecution.update(executionRecord.id, {
            agent_results: results,
            logs: logs
          });

        } catch (error) {
          addLog('error', `Workflow failed at step ${i + 1}: ${error.message}`);
          
          // Handle error strategy
          if (agentStep.on_error === 'continue') {
            addLog('warning', 'Continuing despite error...');
            results.push({
              agent_id: agentStep.agent_id,
              status: 'failed',
              error: error.message
            });
            continue;
          } else if (agentStep.on_error === 'fallback' && agentStep.fallback_agent_id) {
            addLog('info', 'Executing fallback agent...');
            const fallbackStep = { ...agentStep, agent_id: agentStep.fallback_agent_id };
            const fallbackResult = await executeAgent(fallbackStep, results);
            results.push(fallbackResult);
          } else {
            // Stop execution
            await base44.entities.WorkflowExecution.update(executionRecord.id, {
              status: 'failed',
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
              agent_results: results,
              logs: logs,
              error_details: {
                failed_agent: agentStep.agent_id,
                error_message: error.message
              }
            });
            throw error;
          }
        }
      }

      // Workflow completed
      const duration = Date.now() - startTime;
      addLog('success', `Workflow completed in ${(duration / 1000).toFixed(2)}s`);

      await base44.entities.WorkflowExecution.update(executionRecord.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        agent_results: results,
        logs: logs
      });

      toast.success('Workflow completed successfully!');
      onComplete?.(results);

    } catch (error) {
      toast.error(`Workflow failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const progress = workflow.agents.length > 0 
    ? ((currentStep + 1) / workflow.agents.length) * 100 
    : 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Execution Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Execution Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            onClick={executeWorkflow}
            disabled={isRunning}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute Workflow
              </>
            )}
          </Button>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">Agent Steps</h4>
            <AnimatePresence mode="popLayout">
              {workflow.agents.map((agent, index) => {
                const result = agentResults.find(r => r.agent_id === agent.agent_id);
                const isActive = index === currentStep && isRunning;
                
                return (
                  <motion.div
                    key={agent.agent_id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 border rounded-lg transition-all ${
                      isActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : result 
                        ? 'border-gray-200 bg-white' 
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-2xl">{agent.agent_icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{agent.agent_name}</p>
                        {result && (
                          <p className="text-xs text-gray-600">
                            {result.duration_ms}ms
                            {result.retry_count > 0 && ` (${result.retry_count} retries)`}
                          </p>
                        )}
                      </div>
                      {result ? (
                        getStatusIcon(result.status)
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-4 h-4 text-blue-600" />
                        </motion.div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Live Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-600" />
            Execution Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full">
            <div className="space-y-1 font-mono text-xs">
              <AnimatePresence mode="popLayout">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 rounded ${getLogColor(log.level)}`}
                  >
                    <span className="text-gray-400">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{' '}
                    <span className="font-semibold">[{log.level.toUpperCase()}]</span>{' '}
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

WorkflowExecutor.propTypes = {
  workflow: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  agents: PropTypes.array.isRequired,
  onComplete: PropTypes.func
};