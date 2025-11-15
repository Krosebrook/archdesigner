import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CICDAutomationEngine({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState("blue_green");
  const [automation, setAutomation] = useState(null);
  const [copied, setCopied] = useState("");

  const generateAutomation = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Generate CI/CD automation configuration for ${strategy} deployment strategy.

PROJECT: ${project.name}
SERVICES: ${services.length}

Provide:
1. automation_scripts: rollback, health_check, smoke_test scripts
2. deployment_phases: Detailed phases with duration, actions, rollback triggers
3. monitoring_config: Metrics to track and alerts to configure

Be specific with actual commands and configurations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            automation_scripts: {
              type: "object",
              properties: {
                rollback: { type: "string" },
                health_check: { type: "string" },
                smoke_test: { type: "string" }
              }
            },
            deployment_phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  duration: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  rollback_trigger: { type: "string" }
                }
              }
            },
            monitoring_config: {
              type: "object",
              properties: {
                metrics: { type: "array", items: { type: "string" } },
                alerts: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      const newAutomation = await base44.entities.CICDAutomation.create({
        project_id: project.id,
        deployment_strategy: strategy,
        automation_scripts: result.automation_scripts || {},
        deployment_phases: result.deployment_phases || [],
        monitoring_config: result.monitoring_config || {}
      });

      setAutomation(newAutomation);
    } catch (error) {
      console.error("Error generating automation:", error);
    }
    setIsGenerating(false);
  };

  const copyScript = (scriptName, content) => {
    navigator.clipboard.writeText(content);
    setCopied(scriptName);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-green-600" />
            Enhanced CI/CD Automation
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate automated deployment strategies and scripts
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_green">Blue-Green Deployment</SelectItem>
              <SelectItem value="canary">Canary Release</SelectItem>
              <SelectItem value="rolling">Rolling Update</SelectItem>
              <SelectItem value="recreate">Recreate</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={generateAutomation}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Automation...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Generate Automation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {automation && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Automation Scripts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(automation.automation_scripts || {}).map(([name, script]) => (
                <div key={name}>
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline">{name}</Badge>
                    <Button onClick={() => copyScript(name, script)} size="sm" variant="ghost">
                      {copied === name ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {script}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>

          {automation.deployment_phases && automation.deployment_phases.length > 0 && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Deployment Phases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {automation.deployment_phases.map((phase, i) => (
                  <div key={i} className="border-l-4 border-l-green-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{phase.phase}</h4>
                      <Badge variant="outline">{phase.duration}</Badge>
                    </div>
                    <ul className="text-sm space-y-1 mb-2">
                      {phase.actions?.map((action, j) => (
                        <li key={j} className="text-gray-700">• {action}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                      Rollback: {phase.rollback_trigger}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}