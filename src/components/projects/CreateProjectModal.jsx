import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { autoOnboardProject } from "./AIProjectOnboarding";

const categories = [
  { value: "desktop", label: "Desktop Application", icon: "🖥️" },
  { value: "mobile", label: "Mobile Application", icon: "📱" },
  { value: "web", label: "Web Application", icon: "🌐" },
  { value: "enterprise", label: "Enterprise System", icon: "🏢" },
  { value: "ai", label: "AI/ML Platform", icon: "🤖" },
  { value: "platform", label: "Development Platform", icon: "⚡" }
];

const statuses = [
  { value: "planning", label: "Planning" },
  { value: "development", label: "In Development" },
  { value: "testing", label: "Testing" },
  { value: "deployed", label: "Deployed" }
];

export default function CreateProjectModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    status: "planning",
    icon: "",
    services_count: 0,
    integrations_count: 0,
    databases_count: 0,
    ai_models_count: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isGeneratingMetrics, setIsGeneratingMetrics] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [topCategories, setTopCategories] = useState([]);
  const [topTemplates, setTopTemplates] = useState([]);
  const [suggestedServices, setSuggestedServices] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [projectTemplates, setProjectTemplates] = useState([]);
  const [selectedProjectTemplate, setSelectedProjectTemplate] = useState(null);
  const [isGeneratingFromTemplate, setIsGeneratingFromTemplate] = useState(false);
  const [enableAIOnboarding, setEnableAIOnboarding] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTopData();
    }
  }, [isOpen]);

  const loadTopData = async () => {
    try {
      // Load all projects to find top categories
      const projects = await base44.entities.Project.list();
      const categoryCounts = {};
      projects.forEach(p => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });
      const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat]) => cat);
      setTopCategories(sortedCategories);

      // Load top service templates
      const templates = await base44.entities.ServiceTemplate.list();
      const sortedTemplates = templates.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 10);
      setTopTemplates(sortedTemplates);

      // Load project templates
      const projTemplates = await base44.entities.ProjectTemplate.filter({ is_public: true });
      setProjectTemplates(projTemplates.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)));
    } catch (error) {
      console.error("Error loading top data:", error);
    }
  };

  const generateNameAndDescription = async () => {
    if (!formData.category) {
      alert("Please select a category first");
      return;
    }

    setIsGeneratingName(true);
    try {
      const categoryLabel = categories.find(c => c.value === formData.category)?.label || formData.category;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a creative, professional project name and a 2-3 sentence description for a ${categoryLabel} microservices architecture project. Be specific and technical. Return as JSON with 'name' and 'description' fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        name: result.name,
        description: result.description
      }));
    } catch (error) {
      console.error("Error generating name:", error);
    }
    setIsGeneratingName(false);
  };

  const suggestCategoryAndIcon = async () => {
    if (!formData.name && !formData.description) {
      alert("Please enter a project name or description first");
      return;
    }

    setIsSuggestingCategory(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Given the project name "${formData.name}" and description "${formData.description}", suggest the most appropriate category from [desktop, mobile, web, enterprise, ai, platform] and a fitting emoji icon. Return as JSON with 'category' and 'icon' fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            icon: { type: "string" }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        category: result.category,
        icon: result.icon
      }));
    } catch (error) {
      console.error("Error suggesting category:", error);
    }
    setIsSuggestingCategory(false);
  };

  const predictMetrics = async () => {
    if (!formData.category || !formData.description) {
      alert("Please select a category and enter a description first");
      return;
    }

    setIsGeneratingMetrics(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `For a ${formData.category} project described as "${formData.description}", predict reasonable initial counts for services, integrations, databases, and ai_models. Be realistic. Return as JSON with numeric fields.`,
        response_json_schema: {
          type: "object",
          properties: {
            services_count: { type: "number" },
            integrations_count: { type: "number" },
            databases_count: { type: "number" },
            ai_models_count: { type: "number" }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        services_count: result.services_count || 0,
        integrations_count: result.integrations_count || 0,
        databases_count: result.databases_count || 0,
        ai_models_count: result.ai_models_count || 0
      }));

      // Also suggest initial services
      await suggestInitialServices();
    } catch (error) {
      console.error("Error predicting metrics:", error);
    }
    setIsGeneratingMetrics(false);
  };

  const suggestInitialServices = async () => {
    if (!formData.category || !formData.description) return;

    try {
      const templateNames = topTemplates.map(t => t.name).join(', ');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `For a ${formData.category} project: "${formData.description}", suggest 3-5 essential microservices. Available templates: ${templateNames}. For each service, provide a name (use template name if applicable) and brief rationale. Return as JSON array.`,
        response_json_schema: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  rationale: { type: "string" },
                  is_template: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      setSuggestedServices(result.services || []);
    } catch (error) {
      console.error("Error suggesting services:", error);
    }
  };

  const toggleTemplate = (templateId) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]
    );
  };

  const generateFromTemplate = async (template) => {
    setIsGeneratingFromTemplate(true);
    setSelectedProjectTemplate(template);

    try {
      // Pre-fill form with template data
      setFormData(prev => ({
        ...prev,
        name: template.name.replace(/Template$/i, '').trim(),
        description: template.description,
        category: template.category,
        icon: template.icon || "🏗️"
      }));

      // Pre-select service templates if they match
      if (template.default_services) {
        const matchingTemplateIds = topTemplates
          .filter(st => template.default_services.some(ds => ds.name === st.name))
          .map(st => st.id);
        setSelectedTemplates(matchingTemplateIds);
      }

      // Update template usage count
      await base44.entities.ProjectTemplate.update(template.id, {
        usage_count: (template.usage_count || 0) + 1
      });
    } catch (error) {
      console.error("Error generating from template:", error);
    }
    setIsGeneratingFromTemplate(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const selectedCategory = categories.find(c => c.value === formData.category);
    
    try {
      await onSubmit({
        ...formData,
        icon: formData.icon || selectedCategory?.icon || "🏗️",
        selectedTemplates: selectedTemplates,
        projectTemplateId: selectedProjectTemplate?.id,
        templateConfig: selectedProjectTemplate,
        enableAIOnboarding
      });
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "",
        status: "planning",
        icon: "",
        services_count: 0,
        integrations_count: 0,
        databases_count: 0,
        ai_models_count: 0
      });
      setSelectedTemplates([]);
      setSuggestedServices([]);
      setSelectedProjectTemplate(null);
    } catch (error) {
      console.error("Error creating project:", error);
    }
    
    setIsSubmitting(false);
  };

  const handleCategoryChange = (value) => {
    const selectedCategory = categories.find(c => c.value === value);
    setFormData(prev => ({
      ...prev,
      category: value,
      icon: prev.icon || selectedCategory?.icon || "🏗️"
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Create New Project with AI Assistance
          </DialogTitle>
        </DialogHeader>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Project Templates */}
          {projectTemplates.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Start from AI-Powered Template
              </h3>
              <div className="grid md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {projectTemplates.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedProjectTemplate?.id === template.id
                        ? 'border-2 border-purple-500 bg-purple-50 shadow-lg'
                        : 'hover:border-purple-300'
                    }`}
                    onClick={() => generateFromTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{template.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                            <Badge variant="outline" className="text-xs">{template.complexity_level}</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{template.description}</p>
                      {template.default_services && (
                        <p className="text-xs text-purple-700 font-medium">
                          {template.default_services.length} services • {template.architecture_pattern}
                        </p>
                      )}
                      {template.usage_count > 0 && (
                        <Badge className="mt-2 bg-purple-100 text-purple-800 text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {template.usage_count} uses
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Project Name *
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateNameAndDescription}
                  disabled={isGeneratingName || !formData.category}
                  className="h-7"
                >
                  {isGeneratingName ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  AI Generate
                </Button>
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project..."
                required
                className="mt-1 h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                    Category *
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={suggestCategoryAndIcon}
                    disabled={isSuggestingCategory}
                    className="h-7"
                  >
                    {isSuggestingCategory ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    Suggest
                  </Button>
                </div>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {topCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-purple-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Popular
                        </div>
                        {categories.filter(c => topCategories.includes(c.value)).map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            <span className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              {category.label}
                            </span>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1 text-xs text-gray-500">All Categories</div>
                      </>
                    )}
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="icon" className="text-sm font-semibold text-gray-700">
                Project Icon (Emoji)
              </Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🏗️"
                className="mt-1"
                maxLength={2}
              />
            </div>
          </div>

          {/* AI-Predicted Metrics */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Initial Architecture Metrics</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={predictMetrics}
                disabled={isGeneratingMetrics || !formData.category || !formData.description}
                className="bg-purple-50"
              >
                {isGeneratingMetrics ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Predict
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="services" className="text-sm font-medium text-gray-700">
                  Services
                </Label>
                <Input
                  id="services"
                  type="number"
                  min="0"
                  value={formData.services_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, services_count: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="integrations" className="text-sm font-medium text-gray-700">
                  Integrations
                </Label>
                <Input
                  id="integrations"
                  type="number"
                  min="0"
                  value={formData.integrations_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, integrations_count: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="databases" className="text-sm font-medium text-gray-700">
                  Databases
                </Label>
                <Input
                  id="databases"
                  type="number"
                  min="0"
                  value={formData.databases_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, databases_count: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ai_models" className="text-sm font-medium text-gray-700">
                  AI Models
                </Label>
                <Input
                  id="ai_models"
                  type="number"
                  min="0"
                  value={formData.ai_models_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, ai_models_count: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* AI-Suggested Services */}
          {suggestedServices.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Suggested Initial Services</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {suggestedServices.map((service, idx) => (
                  <Card key={idx} className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900">{service.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{service.rationale}</p>
                          {service.is_template && (
                            <Badge variant="outline" className="mt-2 text-xs">Template Available</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Top Service Templates */}
          {topTemplates.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Popular Service Templates (Select to Add)
              </h3>
              <div className="grid md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {topTemplates.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplates.includes(template.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleTemplate(template.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{template.icon}</span>
                        <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {template.usage_count || 0} uses
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* AI Onboarding Toggle */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={enableAIOnboarding}
                onChange={(e) => setEnableAIOnboarding(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-gray-900">AI-Powered Onboarding</span>
                  <Badge className="bg-indigo-600">Recommended</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Automatically generate CI/CD configs, feature flags, service discovery, and initial scaffolding
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isSubmitting ? "Creating..." : `Create Project${selectedTemplates.length > 0 ? ` + ${selectedTemplates.length} Services` : ''}`}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}