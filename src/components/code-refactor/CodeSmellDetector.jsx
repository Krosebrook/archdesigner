import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Loader2, Code } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const codeSmells = [
  { id: "long_method", name: "Long Method", description: "Methods that are too long" },
  { id: "god_class", name: "God Class", description: "Classes doing too much" },
  { id: "duplicate_code", name: "Duplicate Code", description: "Repeated code blocks" },
  { id: "long_param_list", name: "Long Parameter List", description: "Too many parameters" },
  { id: "deep_nesting", name: "Deep Nesting", description: "Excessive nesting levels" },
  { id: "magic_numbers", name: "Magic Numbers", description: "Hardcoded values" }
];

export default function CodeSmellDetector({ project, services }) {
  const [selectedSmell, setSelectedSmell] = useState("all");
  const [selectedService, setSelectedService] = useState("all");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSmells, setDetectedSmells] = useState([]);

  const detectSmells = async () => {
    setIsDetecting(true);
    try {
      const serviceFilter = selectedService !== "all" 
        ? services.find(s => s.id === selectedService) 
        : null;

      const prompt = `Detect code smells in the following project:

PROJECT: ${project.name}
${serviceFilter ? `SERVICE: ${serviceFilter.name}` : 'ALL SERVICES'}
${selectedSmell !== 'all' ? `FOCUS ON: ${codeSmells.find(s => s.id === selectedSmell)?.name}` : ''}

Analyze for these code smells:
- Long Method: Methods with too many lines or responsibilities
- God Class: Classes doing too much
- Duplicate Code: Similar or identical code in multiple places
- Long Parameter List: Functions with too many parameters
- Deep Nesting: Excessive indentation levels
- Magic Numbers: Hardcoded values that should be constants

For each smell detected, provide:
- Type of smell
- Severity (critical, high, medium, low)
- Location description
- Code snippet showing the smell
- Why it's a problem
- How to fix it
- Priority for fixing

Return detailed findings.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            smells: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  severity: { type: "string" },
                  location: { type: "string" },
                  code_snippet: { type: "string" },
                  problem: { type: "string" },
                  fix: { type: "string" },
                  priority: { type: "number" }
                }
              }
            }
          }
        }
      });

      setDetectedSmells(result.smells || []);
      toast.success(`Found ${result.smells?.length || 0} code smells`);
    } catch (error) {
      console.error("Detection failed:", error);
      toast.error("Failed to detect code smells");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Code Smell Detector
        </CardTitle>
        <CardDescription>
          Identify specific anti-patterns and code smells
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Select value={selectedSmell} onValueChange={setSelectedSmell}>
            <SelectTrigger>
              <SelectValue placeholder="Smell Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Code Smells</SelectItem>
              {codeSmells.map(smell => (
                <SelectItem key={smell.id} value={smell.id}>
                  {smell.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger>
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={detectSmells}
          disabled={isDetecting}
          className="w-full"
          variant="outline"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Detect Code Smells
            </>
          )}
        </Button>

        {detectedSmells.length > 0 && (
          <div className="space-y-3 mt-6">
            {detectedSmells.map((smell, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-orange-900">{smell.type}</span>
                      </div>
                      <Badge variant={
                        smell.severity === 'critical' ? 'destructive' :
                        smell.severity === 'high' ? 'default' : 'secondary'
                      }>
                        {smell.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-orange-700 mb-2">📍 {smell.location}</p>
                    <pre className="bg-white border border-orange-200 rounded p-2 text-xs overflow-x-auto mb-2">
                      {smell.code_snippet}
                    </pre>
                    <div className="text-sm text-orange-800 space-y-1">
                      <p><strong>Problem:</strong> {smell.problem}</p>
                      <p><strong>Fix:</strong> {smell.fix}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}