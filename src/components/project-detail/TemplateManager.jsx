import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Edit, Trash2, Copy, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const allTemplates = await base44.entities.ProjectTemplate.list();
      
      const myTemplates = allTemplates.filter(t => t.created_by === user.email);
      setTemplates(myTemplates.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)));
    } catch (error) {
      console.error("Error loading templates:", error);
    }
    setIsLoading(false);
  };

  const deleteTemplate = async (id) => {
    if (!confirm("Delete this template?")) return;
    
    try {
      await base44.entities.ProjectTemplate.delete(id);
      await loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      const { id, created_date, updated_date, created_by, ...templateData } = template;
      
      await base44.entities.ProjectTemplate.create({
        ...templateData,
        name: `${template.name} (Copy)`,
        usage_count: 0
      });
      
      await loadTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const togglePublic = async (template) => {
    try {
      await base44.entities.ProjectTemplate.update(template.id, {
        is_public: !template.is_public
      });
      await loadTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Advanced Template Management
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Manage, edit, and share your custom project templates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="enterprise">Enterprise</option>
              <option value="ai">AI/ML</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
              <div className="text-xs text-gray-600">Total Templates</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.is_public).length}
              </div>
              <div className="text-xs text-gray-600">Public</div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
              </div>
              <div className="text-xs text-gray-600">Total Uses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-white hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{template.icon || "📦"}</span>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  <Badge variant="outline">{template.complexity_level}</Badge>
                  {template.estimated_setup_time && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {template.estimated_setup_time}
                    </Badge>
                  )}
                  {template.usage_count > 0 && (
                    <Badge className="bg-purple-100 text-purple-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {template.usage_count} uses
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => togglePublic(template)}
                    variant={template.is_public ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                  >
                    {template.is_public ? "Public" : "Private"}
                  </Button>
                  <Button onClick={() => duplicateTemplate(template)} variant="outline" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => deleteTemplate(template.id)} variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-white">
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No templates found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}