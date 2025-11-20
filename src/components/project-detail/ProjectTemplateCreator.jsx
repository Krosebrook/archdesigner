import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Sparkles, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";

const categories = ["web", "mobile", "enterprise", "ai", "platform", "desktop"];
const complexityLevels = ["beginner", "intermediate", "advanced"];
const architecturePatterns = ["microservices", "monolithic", "serverless", "event-driven", "layered", "cqrs"];

export default function ProjectTemplateCreator({ existingTemplate, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "web",
    icon: "📦",
    architecture_pattern: "microservices",
    complexity_level: "intermediate",
    estimated_setup_time: "",
    is_public: false
  });

  const [defaultServices, setDefaultServices] = useState([]);
  const [recommendedIntegrations, setRecommendedIntegrations] = useState([]);
  const [defaultTasks, setDefaultTasks] = useState([]);
  const [cicdConfig, setCicdConfig] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingTemplate) {
      setFormData({
        name: existingTemplate.name,
        description: existingTemplate.description,
        category: existingTemplate.category,
        icon: existingTemplate.icon || "📦",
        architecture_pattern: existingTemplate.architecture_pattern || "microservices",
        complexity_level: existingTemplate.complexity_level || "intermediate",
        estimated_setup_time: existingTemplate.estimated_setup_time || "",
        is_public: existingTemplate.is_public || false
      });
      setDefaultServices(existingTemplate.default_services || []);
      setRecommendedIntegrations(existingTemplate.recommended_integrations || []);
    }
  }, [existingTemplate]);

  const generateWithAI = async () => {
    if (!formData.name || !formData.description) {
      alert("Please enter name and description first");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate a comprehensive project template configuration for:
NAME: ${formData.name}
DESCRIPTION: ${formData.description}
CATEGORY: ${formData.category}
ARCHITECTURE: ${formData.architecture_pattern}

Generate:
1. default_services: Array of 5-8 essential microservices with name, category, description, technologies (array), and example api endpoints
2. recommended_integrations: Array of recommended third-party services/tools
3. initial_tasks: Array of 8-12 initial project tasks with title, description, and priority (critical/high/medium/low)
4. cicd_template: Basic CI/CD configuration description
5. estimated_setup_time: Realistic time estimate (e.g., "2-4 hours")

Return as JSON.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            default_services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  technologies: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommended_integrations: { type: "array", items: { type: "string" } },
            initial_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority_level: { type: "string" }
                }
              }
            },
            cicd_template: { type: "string" },
            estimated_setup_time: { type: "string" }
          }
        }
      });

      setDefaultServices(result.default_services || []);
      setRecommendedIntegrations(result.recommended_integrations || []);
      setDefaultTasks(result.initial_tasks || []);
      setCicdConfig(result.cicd_template || "");
      setFormData(prev => ({
        ...prev,
        estimated_setup_time: result.estimated_setup_time || prev.estimated_setup_time
      }));
    } catch (error) {
      console.error("Error generating template:", error);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const templateData = {
        ...formData,
        default_services: defaultServices,
        recommended_integrations: recommendedIntegrations,
        default_tasks: defaultTasks,
        cicd_template: cicdConfig,
        usage_count: existingTemplate?.usage_count || 0
      };

      if (existingTemplate) {
        await base44.entities.ProjectTemplate.update(existingTemplate.id, templateData);
      } else {
        await base44.entities.ProjectTemplate.create(templateData);
      }

      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving template:", error);
    }
    setIsSaving(false);
  };

  const addService = () => {
    setDefaultServices([...defaultServices, { name: "", category: "core", description: "", technologies: [] }]);
  };

  const removeService = (index) => {
    setDefaultServices(defaultServices.filter((_, i) => i !== index));
  };

  const updateService = (index, field, value) => {
    const updated = [...defaultServices];
    updated[index] = { ...updated[index], [field]: value };
    setDefaultServices(updated);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {existingTemplate ? "Edit Project Template" : "Create Project Template"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="E-Commerce Microservices"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📦"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Complete e-commerce platform with microservices architecture..."
              className="h-20"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Architecture Pattern</Label>
              <Select value={formData.architecture_pattern} onValueChange={(value) => setFormData({ ...formData, architecture_pattern: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {architecturePatterns.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Complexity Level</Label>
              <Select value={formData.complexity_level} onValueChange={(value) => setFormData({ ...formData, complexity_level: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {complexityLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateWithAI} disabled={isGenerating} className="w-full bg-purple-600 text-white">
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            AI Generate Services & Tasks
          </Button>
        </CardContent>
      </Card>

      {defaultServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Default Services ({defaultServices.length})
              <Button onClick={addService} size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {defaultServices.map((service, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Input
                    placeholder="Service name"
                    value={service.name}
                    onChange={(e) => updateService(i, 'name', e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button onClick={() => removeService(i)} variant="ghost" size="sm">
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Service description"
                  value={service.description}
                  onChange={(e) => updateService(i, 'description', e.target.value)}
                  className="mb-2 h-16"
                />
                <div className="flex gap-2">
                  <Badge>{service.category}</Badge>
                  {service.technologies?.map((tech, j) => <Badge key={j} variant="outline">{tech}</Badge>)}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {defaultTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Initial Tasks ({defaultTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {defaultTasks.map((task, i) => (
                <Card key={i} className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge className={
                        task.priority_level === 'critical' ? 'bg-red-100 text-red-800' :
                        task.priority_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }>{task.priority_level}</Badge>
                    </div>
                    <p className="text-xs text-gray-600">{task.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Template
        </Button>
      </div>
    </div>
  );
}