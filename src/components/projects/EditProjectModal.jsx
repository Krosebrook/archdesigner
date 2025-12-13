import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const categories = [
  { value: "web", label: "Web Application" },
  { value: "mobile", label: "Mobile App" },
  { value: "enterprise", label: "Enterprise System" },
  { value: "ai", label: "AI/ML Platform" },
  { value: "platform", label: "Platform/SaaS" },
  { value: "desktop", label: "Desktop Application" }
];

const architecturePatterns = [
  { value: "microservices", label: "Microservices" },
  { value: "monolithic", label: "Monolithic" },
  { value: "serverless", label: "Serverless" },
  { value: "event_driven", label: "Event-Driven" },
  { value: "layered", label: "Layered Architecture" }
];

export default function EditProjectModal({ open, onOpenChange, project, onSuccess }) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    category: project?.category || "web",
    architecture_pattern: project?.architecture_pattern || "microservices"
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Project.update(project.id, formData);
      toast.success("Project updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details and configuration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="architecture">Architecture Pattern</Label>
                <Select
                  value={formData.architecture_pattern}
                  onValueChange={(value) => setFormData({ ...formData, architecture_pattern: value })}
                >
                  <SelectTrigger id="architecture">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {architecturePatterns.map((pattern) => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}