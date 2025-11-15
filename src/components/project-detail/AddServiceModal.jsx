import { useState } from "react";
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
import { X, Plus } from "lucide-react";

const categories = [
  { value: "core", label: "Core Service", icon: "⚙️" },
  { value: "integration", label: "Integration", icon: "🔌" },
  { value: "storage", label: "Storage/Database", icon: "💾" },
  { value: "ai", label: "AI/ML", icon: "🤖" },
  { value: "analytics", label: "Analytics", icon: "📊" },
  { value: "security", label: "Security", icon: "🔒" },
  { value: "ui", label: "UI/Frontend", icon: "🎨" }
];

export default function AddServiceModal({ isOpen, onClose, onSubmit, existingServices }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    icon: "",
    technologies: [],
    apis: [],
    depends_on: []
  });

  const [currentTech, setCurrentTech] = useState("");
  const [currentApi, setCurrentApi] = useState({ endpoint: "", description: "", method: "GET" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCategory = categories.find(c => c.value === formData.category);
    
    onSubmit({
      ...formData,
      icon: formData.icon || selectedCategory?.icon || "⚙️"
    });

    // Reset form
    setFormData({
      name: "",
      description: "",
      category: "",
      icon: "",
      technologies: [],
      apis: [],
      depends_on: []
    });
  };

  const addTechnology = () => {
    if (currentTech.trim()) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, currentTech.trim()]
      }));
      setCurrentTech("");
    }
  };

  const removeTechnology = (index) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };

  const addApi = () => {
    if (currentApi.endpoint.trim()) {
      setFormData(prev => ({
        ...prev,
        apis: [...prev.apis, currentApi]
      }));
      setCurrentApi({ endpoint: "", description: "", method: "GET" });
    }
  };

  const removeApi = (index) => {
    setFormData(prev => ({
      ...prev,
      apis: prev.apis.filter((_, i) => i !== index)
    }));
  };

  const toggleDependency = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      depends_on: prev.depends_on.includes(serviceId)
        ? prev.depends_on.filter(id => id !== serviceId)
        : [...prev.depends_on, serviceId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add New Service
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., User Authentication Service"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this service does..."
                required
                className="mt-1 h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="⚙️"
                  className="mt-1"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Technologies */}
          <div>
            <Label>Technologies</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={currentTech}
                onChange={(e) => setCurrentTech(e.target.value)}
                placeholder="e.g., Node.js, PostgreSQL"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              />
              <Button type="button" onClick={addTechnology} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.technologies.map((tech, index) => (
                <Badge key={index} variant="outline" className="gap-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechnology(index)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* APIs */}
          <div>
            <Label>APIs</Label>
            <div className="space-y-2 mt-1">
              <div className="flex gap-2">
                <Select 
                  value={currentApi.method} 
                  onValueChange={(value) => setCurrentApi(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={currentApi.endpoint}
                  onChange={(e) => setCurrentApi(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="/api/endpoint"
                  className="flex-1"
                />
                <Button type="button" onClick={addApi} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Input
                value={currentApi.description}
                onChange={(e) => setCurrentApi(prev => ({ ...prev, description: e.target.value }))}
                placeholder="API description (optional)"
              />
            </div>
            <div className="space-y-2 mt-2">
              {formData.apis.map((api, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{api.method}</Badge>
                      <code className="text-sm font-mono">{api.endpoint}</code>
                    </div>
                    {api.description && (
                      <p className="text-xs text-gray-600 mt-1">{api.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeApi(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dependencies */}
          {existingServices && existingServices.length > 0 && (
            <div>
              <Label>Dependencies (Optional)</Label>
              <p className="text-sm text-gray-500 mb-2">Select services this service depends on</p>
              <div className="grid grid-cols-2 gap-2">
                {existingServices.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleDependency(service.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.depends_on.includes(service.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{service.icon || "⚙️"}</span>
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              Add Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}