import React, { useState } from "react";
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
import { motion } from "framer-motion";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const selectedCategory = categories.find(c => c.value === formData.category);
    
    try {
      await onSubmit({
        ...formData,
        icon: formData.icon || selectedCategory?.icon || "🏗️"
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Project Name *
              </Label>
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
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                  Category *
                </Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
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

          {/* Initial Metrics */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Architecture Metrics</h3>
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
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}