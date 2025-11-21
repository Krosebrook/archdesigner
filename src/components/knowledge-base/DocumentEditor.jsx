import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, Plus, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

const categories = [
  { value: "onboarding", label: "Onboarding Guide", icon: "🚀" },
  { value: "architecture", label: "Architecture", icon: "🏗️" },
  { value: "api_docs", label: "API Documentation", icon: "📡" },
  { value: "runbook", label: "Runbook", icon: "📖" },
  { value: "wiki", label: "Wiki", icon: "📚" },
  { value: "release_notes", label: "Release Notes", icon: "🎉" },
  { value: "best_practices", label: "Best Practices", icon: "⭐" }
];

export const DocumentEditor = ({ article, projectId, onSave, onCancel }) => {
  const [formData, setFormData] = useState(article || {
    title: "",
    content: "",
    category: "wiki",
    tags: [],
    is_pinned: false
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const enhanceWithAI = async () => {
    setEnhancing(true);
    try {
      const enhanced = await invokeLLM(
        `Enhance this documentation article. Make it more comprehensive, well-structured, and professional. Add relevant sections, examples, and best practices.
        
        Title: ${formData.title}
        Category: ${formData.category}
        Current Content: ${formData.content}
        
        Return enhanced markdown content with proper headings, code blocks, and examples.`,
        {
          type: "object",
          properties: {
            enhanced_content: { type: "string" },
            suggested_tags: { type: "array", items: { type: "string" } }
          }
        }
      );

      setFormData(prev => ({
        ...prev,
        content: enhanced.enhanced_content,
        tags: [...new Set([...prev.tags, ...enhanced.suggested_tags])]
      }));
    } catch (error) {
      console.error("Enhancement error:", error);
    }
    setEnhancing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (article?.id) {
        await base44.entities.KnowledgeBase.update(article.id, formData);
      } else {
        await base44.entities.KnowledgeBase.create({
          ...formData,
          project_id: projectId,
          auto_generated: false
        });
      }
      onSave();
    } catch (error) {
      console.error("Save error:", error);
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>{article ? "Edit Document" : "New Document"}</span>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter document title..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
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
            <div className="flex items-center justify-between mb-1">
              <Label>Content (Markdown)</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={enhanceWithAI}
                disabled={enhancing || !formData.content}
              >
                {enhancing ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                AI Enhance
              </Button>
            </div>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your documentation in markdown..."
              className="mt-1 h-64 font-mono text-sm"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
              />
              <Button size="icon" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_pinned}
              onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
              className="rounded"
            />
            <Label>Pin to top</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.title || !formData.content}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};