import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const CATEGORIES = [
  { id: "web", label: "Web Application", icon: "🌐", desc: "Modern web apps with frontend & backend" },
  { id: "mobile", label: "Mobile App", icon: "📱", desc: "Native or cross-platform mobile" },
  { id: "enterprise", label: "Enterprise System", icon: "🏢", desc: "Large-scale business applications" },
  { id: "ai", label: "AI/ML Platform", icon: "🤖", desc: "Machine learning & AI services" },
  { id: "platform", label: "Platform/SaaS", icon: "☁️", desc: "Multi-tenant SaaS platforms" },
  { id: "desktop", label: "Desktop App", icon: "💻", desc: "Cross-platform desktop applications" }
];

export default function ProjectInfoStep({ data, onComplete }) {
  const [formData, setFormData] = useState({
    name: data.projectInfo?.name || "",
    description: data.projectInfo?.description || "",
    category: data.projectInfo?.category || "",
    icon: data.projectInfo?.icon || "",
    goals: data.projectInfo?.goals || ""
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (formData.name && formData.category) {
      onComplete(formData);
    }
  }, [formData]);

  const generateProjectDetails = async () => {
    if (!formData.name) {
      toast.error("Please enter a project name first");
      return;
    }

    setIsGenerating(true);
    try {
      const categoryInfo = CATEGORIES.find(c => c.id === formData.category);
      
      const prompt = `You are an expert software architect with knowledge of current market trends. Based on the following project details, generate a comprehensive project setup:

PROJECT NAME: ${formData.name}
CATEGORY: ${categoryInfo?.label || "Not specified"}
CURRENT DESCRIPTION: ${formData.description || "None"}

Generate using current industry insights:
1. A compelling 2-3 sentence project description that explains:
   - The problem it solves
   - Target audience/users
   - Unique value proposition
   - Technical approach aligned with 2024-2025 best practices

2. Key project goals (3-5 SMART goals):
   - Specific, measurable, achievable objectives
   - Technical milestones
   - User experience targets
   - Business/impact metrics

3. Suggested emoji icon that represents this project visually

Make it professional, specific, actionable, and aligned with current tech trends.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            goals: { type: "string" },
            icon: { type: "string" }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        description: result.description,
        goals: result.goals,
        icon: result.icon
      }));

      toast.success("Project details generated!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate details");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-5 h-5" />
            Let's Create Your Project
          </CardTitle>
          <CardDescription className="text-blue-700">
            Tell us about your project and let AI help you set up the perfect architecture
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-semibold">Project Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Awesome Project"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-3 block">Project Category *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <Card
                key={cat.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  formData.category === cat.id
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setFormData({ ...formData, category: cat.id })}
              >
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="font-semibold text-sm">{cat.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{cat.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateProjectDetails}
            disabled={isGenerating || !formData.name}
            variant="outline"
            className="flex-1 border-purple-300 hover:bg-purple-50"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "AI Generate Details"}
          </Button>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your project's purpose and goals..."
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="goals" className="text-sm font-semibold">Project Goals</Label>
          <Textarea
            id="goals"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            placeholder="• Goal 1&#10;• Goal 2&#10;• Goal 3"
            rows={4}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="icon" className="text-sm font-semibold">Project Icon (Emoji)</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="🚀"
            className="mt-1 text-2xl"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
}

ProjectInfoStep.propTypes = {
  data: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired
};