import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Sparkles, Plus, X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const AGENT_TEMPLATES = [
  {
    name: "Code Reviewer",
    category: "testing",
    description: "Reviews code for best practices, identifies bugs, and suggests improvements",
    capabilities: ["Code analysis", "Bug detection", "Best practices", "Refactoring suggestions"],
    icon: "🔍"
  },
  {
    name: "Performance Analyzer",
    category: "performance",
    description: "Analyzes application performance and suggests optimization strategies",
    capabilities: ["Performance profiling", "Bottleneck detection", "Optimization recommendations", "Metrics analysis"],
    icon: "⚡"
  },
  {
    name: "Security Scanner",
    category: "security",
    description: "Scans for security vulnerabilities and compliance issues",
    capabilities: ["Vulnerability scanning", "Security audit", "Compliance checks", "Threat detection"],
    icon: "🔒"
  },
  {
    name: "Documentation Writer",
    category: "documentation",
    description: "Generates comprehensive documentation from code and specifications",
    capabilities: ["Auto-documentation", "API docs", "Code comments", "User guides"],
    icon: "📚"
  },
  {
    name: "API Designer",
    category: "backend",
    description: "Designs RESTful and GraphQL APIs with best practices",
    capabilities: ["API design", "Endpoint generation", "Schema design", "Validation rules"],
    icon: "🌐"
  },
  {
    name: "UI Component Generator",
    category: "frontend",
    description: "Generates reusable UI components with accessibility standards",
    capabilities: ["Component generation", "Accessibility", "Responsive design", "Storybook integration"],
    icon: "🎨"
  }
];

const CATEGORIES = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "database", label: "Database" },
  { value: "security", label: "Security" },
  { value: "performance", label: "Performance" },
  { value: "devops", label: "DevOps" },
  { value: "testing", label: "Testing" },
  { value: "documentation", label: "Documentation" }
];

export default function AgentBuilder({ onAgentCreated }) {
  const [agentData, setAgentData] = useState({
    name: "",
    description: "",
    category: "",
    icon: "🤖",
    color: "#8b5cf6",
    specialization: "",
    capabilities: [],
    system_prompt: "",
    tags: []
  });

  const [newCapability, setNewCapability] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const applyTemplate = (template) => {
    setAgentData({
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      color: "#8b5cf6",
      specialization: template.description.split(",")[0],
      capabilities: template.capabilities,
      system_prompt: `You are a ${template.name} agent specializing in ${template.description.toLowerCase()}. Your role is to help developers with ${template.capabilities.join(", ").toLowerCase()}.`,
      tags: template.capabilities.map(c => c.toLowerCase().replace(/\s+/g, "-"))
    });
    toast.success(`Applied ${template.name} template`);
  };

  const generateWithAI = async () => {
    if (!agentData.name || !agentData.category) {
      toast.error("Please provide at least a name and category");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a specialized AI agent for a microservices platform. Agent details:
        
Name: ${agentData.name}
Category: ${agentData.category}
Current Description: ${agentData.description || "Not provided"}

Generate:
1. A comprehensive description (2-3 sentences)
2. Specific specialization area
3. 5-7 key capabilities this agent should have
4. A detailed system prompt (3-5 sentences) that defines the agent's role and expertise
5. 5-7 relevant tags
6. Suggest an appropriate emoji icon

Return as structured JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            specialization: { type: "string" },
            capabilities: { type: "array", items: { type: "string" } },
            system_prompt: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            icon: { type: "string" }
          }
        }
      });

      setAgentData(prev => ({
        ...prev,
        description: result.description,
        specialization: result.specialization,
        capabilities: result.capabilities,
        system_prompt: result.system_prompt,
        tags: result.tags,
        icon: result.icon
      }));

      toast.success("AI generated agent details!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate agent details");
    }
    setIsGenerating(false);
  };

  const addCapability = () => {
    if (newCapability.trim() && !agentData.capabilities.includes(newCapability.trim())) {
      setAgentData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }));
      setNewCapability("");
    }
  };

  const removeCapability = (capability) => {
    setAgentData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(c => c !== capability)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !agentData.tags.includes(newTag.trim())) {
      setAgentData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setAgentData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const saveAgent = async () => {
    if (!agentData.name || !agentData.description || !agentData.category || !agentData.system_prompt) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const newAgent = await base44.entities.AgentDefinition.create({
        ...agentData,
        slug: agentData.name.toLowerCase().replace(/\s+/g, "-"),
        is_public: false,
        is_official: false,
        rating: 0,
        installs_count: 0,
        configuration_schema: {},
        default_config: {},
        output_format: "suggestions"
      });

      toast.success("Agent created successfully!");
      onAgentCreated?.(newAgent);
      
      // Reset form
      setAgentData({
        name: "",
        description: "",
        category: "",
        icon: "🤖",
        color: "#8b5cf6",
        specialization: "",
        capabilities: [],
        system_prompt: "",
        tags: []
      });
    } catch (error) {
      console.error("Save agent error:", error);
      toast.error("Failed to create agent");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Wand2 className="w-6 h-6" />
            Agent Builder
          </CardTitle>
          <p className="text-sm text-purple-700 mt-2">
            Create custom AI agents for your specific workflow needs
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Templates */}
          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Start Templates</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {AGENT_TEMPLATES.map((template) => (
                <motion.div
                  key={template.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-purple-300 transition-all"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{template.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">{template.category}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={agentData.name}
                onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Code Review Expert"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={agentData.category} 
                onValueChange={(value) => setAgentData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={agentData.icon}
                onChange={(e) => setAgentData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🤖"
                className="mt-1"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="color">Color (Hex)</Label>
              <Input
                id="color"
                value={agentData.color}
                onChange={(e) => setAgentData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#8b5cf6"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={agentData.description}
              onChange={(e) => setAgentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this agent does..."
              className="mt-1 h-20"
            />
          </div>

          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={agentData.specialization}
              onChange={(e) => setAgentData(prev => ({ ...prev, specialization: e.target.value }))}
              placeholder="e.g., React Performance Optimization"
              className="mt-1"
            />
          </div>

          {/* AI Generate Button */}
          <Button
            onClick={generateWithAI}
            disabled={isGenerating || !agentData.name || !agentData.category}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isGenerating ? (
              <>Generating with AI...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Agent Details with AI
              </>
            )}
          </Button>

          {/* Capabilities */}
          <div>
            <Label>Capabilities</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCapability())}
                placeholder="Add capability..."
              />
              <Button type="button" onClick={addCapability} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {agentData.capabilities.map((cap) => (
                <Badge key={cap} className="flex items-center gap-1">
                  {cap}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeCapability(cap)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
              />
              <Button type="button" onClick={addTag} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {agentData.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <Label htmlFor="system_prompt">System Prompt *</Label>
            <Textarea
              id="system_prompt"
              value={agentData.system_prompt}
              onChange={(e) => setAgentData(prev => ({ ...prev, system_prompt: e.target.value }))}
              placeholder="Define the agent's role, expertise, and behavior..."
              className="mt-1 h-32 font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={saveAgent}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isSaving ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

AgentBuilder.propTypes = {
  onAgentCreated: PropTypes.func
};