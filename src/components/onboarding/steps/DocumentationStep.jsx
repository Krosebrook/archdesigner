import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const DOC_TEMPLATES = [
  { id: "readme", title: "README", category: "readme", pinned: true },
  { id: "architecture", title: "Architecture Overview", category: "architecture", pinned: true },
  { id: "getting-started", title: "Getting Started Guide", category: "onboarding", pinned: false },
  { id: "api-docs", title: "API Documentation", category: "api_docs", pinned: false },
  { id: "deployment", title: "Deployment Guide", category: "runbook", pinned: false },
  { id: "contributing", title: "Contributing Guidelines", category: "wiki", pinned: false }
];

export default function DocumentationStep({ data, onComplete }) {
  const [docs, setDocs] = useState(data.documentation || []);
  const [selectedDocs, setSelectedDocs] = useState(DOC_TEMPLATES.map((_, i) => i));
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (docs.length === 0) {
      generateDocumentation();
    }
  }, []);

  useEffect(() => {
    const selected = docs.filter((_, i) => selectedDocs.includes(i));
    onComplete(selected);
  }, [selectedDocs, docs]);

  const generateDocumentation = async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are a technical writer. Generate comprehensive documentation for this project:

PROJECT: ${data.projectInfo.name}
DESCRIPTION: ${data.projectInfo.description}
ARCHITECTURE: ${data.architecture?.pattern}
SERVICES: ${data.services?.map(s => s.name).join(', ')}
TECHNOLOGIES: ${data.architecture?.technologies?.join(', ')}

Generate the following documentation in Markdown format:

1. **README.md**: Project overview, quick start, features, tech stack
2. **Architecture Overview**: System design, service interactions, data flow
3. **Getting Started Guide**: Setup instructions, prerequisites, local development
4. **API Documentation**: Endpoint reference, authentication, examples
5. **Deployment Guide**: Production deployment, environment configuration, scaling
6. **Contributing Guidelines**: Code style, PR process, testing requirements

Make each document detailed, professional, and easy to follow.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            readme: { type: "string" },
            architecture: { type: "string" },
            getting_started: { type: "string" },
            api_docs: { type: "string" },
            deployment: { type: "string" },
            contributing: { type: "string" }
          }
        }
      });

      const generatedDocs = DOC_TEMPLATES.map(template => ({
        title: template.title,
        content: result[template.id] || "",
        category: template.category,
        tags: ["auto-generated", "onboarding"],
        pinned: template.pinned
      }));

      setDocs(generatedDocs);
      toast.success("Documentation generated!");
    } catch (error) {
      console.error("Documentation generation failed:", error);
      toast.error("Failed to generate documentation");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDoc = (index) => {
    setSelectedDocs(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">Generating Documentation...</h3>
          <p className="text-gray-600">AI is writing comprehensive guides for your project</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <BookOpen className="w-5 h-5" />
            Knowledge Base Setup
          </CardTitle>
          <CardDescription className="text-amber-700">
            AI-generated documentation to help your team get started quickly
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedDocs.length} of {docs.length} documents selected
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDocs(docs.map((_, i) => i))}
        >
          Select All
        </Button>
      </div>

      <div className="space-y-3">
        {docs.map((doc, index) => (
          <Card
            key={index}
            className={`transition-all ${
              selectedDocs.includes(index)
                ? "border-2 border-amber-500 bg-amber-50/50"
                : "border border-gray-200"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedDocs.includes(index)}
                  onCheckedChange={() => toggleDoc(index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold">{doc.title}</div>
                    {doc.pinned && (
                      <span className="text-xs text-amber-600">📌 Pinned</span>
                    )}
                  </div>
                  
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold mb-2">
                      <FileText className="w-3 h-3 inline mr-1" />
                      Preview Content
                    </summary>
                    <div className="prose prose-sm max-w-none bg-white p-3 rounded border mt-2 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {doc.content.substring(0, 500)}...
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={generateDocumentation}
        variant="outline"
        className="w-full"
      >
        Regenerate Documentation
      </Button>
    </div>
  );
}

DocumentationStep.propTypes = {
  data: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired
};