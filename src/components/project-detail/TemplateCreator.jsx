import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateCreator({ project, services }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: project?.category || "web",
    icon: "",
    architecture_pattern: "",
    estimated_setup_time: "",
    complexity_level: "intermediate"
  });
  const [created, setCreated] = useState(false);

  const generateFromProject = async () => {
    setIsGenerating(true);
    try {
      const servicesContext = services.map(s => `
- ${s.name} (${s.category}): ${s.description}
  Technologies: ${(s.technologies || []).join(', ')}
      `).join('\n');

      const prompt = `Based on this microservices architecture, generate a reusable project template.

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
SERVICES:
${servicesContext}

Generate:
1. A descriptive template name
2. A compelling description
3. Suggested icon (emoji)
4. Architecture pattern name (e.g., "API Gateway with Microservices")
5. Estimated setup time (e.g., "2-4 hours")
6. Complexity level (beginner/intermediate/advanced)

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            icon: { type: "string" },
            architecture_pattern: { type: "string" },
            estimated_setup_time: { type: "string" },
            complexity_level: { type: "string" }
          }
        }
      });

      setTemplateData({
        ...templateData,
        ...result
      });
    } catch (error) {
      console.error("Error generating template:", error);
    }
    setIsGenerating(false);
  };

  const createTemplate = async () => {
    setIsCreating(true);
    try {
      const defaultServices = services.map(s => ({
        name: s.name,
        category: s.category,
        description: s.description,
        technologies: s.technologies || []
      }));

      const recommendedIntegrations = [...new Set(
        services.flatMap(s => s.technologies || [])
      )].slice(0, 5);

      await base44.entities.ProjectTemplate.create({
        ...templateData,
        default_services: defaultServices,
        recommended_integrations: recommendedIntegrations,
        usage_count: 0,
        is_public: true
      });

      setCreated(true);
      setTimeout(() => setCreated(false), 3000);
    } catch (error) {
      console.error("Error creating template:", error);
    }
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            Intelligent Template Creator
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Create reusable templates from your projects with AI assistance
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generateFromProject}
            disabled={isGenerating || services.length === 0}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white mb-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Template from Project...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate Template from Current Project
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="bg-white border-0">
          <CardHeader>
            <CardTitle>Template Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={templateData.name}
                onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                placeholder="e.g., E-Commerce Microservices"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={templateData.description}
                onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                placeholder="Describe what this template is for and what it includes..."
                className="h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={templateData.category} onValueChange={(v) => setTemplateData({...templateData, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="ai">AI/ML</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Complexity Level</Label>
                <Select value={templateData.complexity_level} onValueChange={(v) => setTemplateData({...templateData, complexity_level: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon (Emoji)</Label>
                <Input
                  value={templateData.icon}
                  onChange={(e) => setTemplateData({...templateData, icon: e.target.value})}
                  placeholder="🛒"
                  maxLength={2}
                />
              </div>

              <div>
                <Label>Setup Time</Label>
                <Input
                  value={templateData.estimated_setup_time}
                  onChange={(e) => setTemplateData({...templateData, estimated_setup_time: e.target.value})}
                  placeholder="2-4 hours"
                />
              </div>
            </div>

            <div>
              <Label>Architecture Pattern</Label>
              <Input
                value={templateData.architecture_pattern}
                onChange={(e) => setTemplateData({...templateData, architecture_pattern: e.target.value})}
                placeholder="e.g., API Gateway with Event-Driven Microservices"
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">
                This template will include {services.length} services from your current project
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {services.slice(0, 5).map((s, i) => (
                  <Badge key={i} variant="outline">{s.name}</Badge>
                ))}
                {services.length > 5 && (
                  <Badge variant="outline">+{services.length - 5} more</Badge>
                )}
              </div>
            </div>

            <Button
              onClick={createTemplate}
              disabled={isCreating || !templateData.name || !templateData.description}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Template...
                </>
              ) : created ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Template Created!
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}