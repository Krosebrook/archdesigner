import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Search, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const complexityColors = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800"
};

export default function ProjectTemplateGallery({ onApplyTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.ProjectTemplate.list();
      setTemplates(data.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)));
    } catch (error) {
      console.error("Error loading templates:", error);
    }
    setIsLoading(false);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-violet-50 to-pink-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI-Driven Project Templates
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Pre-configured architecture templates to jumpstart your projects
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="enterprise">Enterprise</option>
              <option value="ai">AI/ML</option>
              <option value="platform">Platform</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-white hover:shadow-xl transition-shadow h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{template.icon || "📦"}</div>
                  <div className="flex gap-2">
                    {template.usage_count > 10 && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge className={complexityColors[template.complexity_level]}>
                      {template.complexity_level}
                    </Badge>
                    {template.estimated_setup_time && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {template.estimated_setup_time}
                      </Badge>
                    )}
                  </div>

                  {template.architecture_pattern && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Architecture Pattern:</p>
                      <p className="text-sm text-gray-700">{template.architecture_pattern}</p>
                    </div>
                  )}

                  {template.default_services && template.default_services.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Includes {template.default_services.length} Services:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.default_services.slice(0, 3).map((service, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                        {template.default_services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.default_services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{template.usage_count || 0} uses</span>
                  </div>
                </div>

                <Button
                  onClick={() => onApplyTemplate(template)}
                  className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white"
                  size="sm"
                >
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found matching your criteria</p>
        </div>
      )}
    </div>
  );
}