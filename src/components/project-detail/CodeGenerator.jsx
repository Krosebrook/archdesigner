import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code, Loader2, Download, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const languages = [
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "rust", label: "Rust" }
];

const generationTypes = [
  { value: "boilerplate", label: "Service Boilerplate" },
  { value: "endpoint", label: "API Endpoint" },
  { value: "model", label: "Data Model" },
  { value: "test", label: "Test Suite" },
  { value: "full_service", label: "Full Service" }
];

export default function CodeGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [selectedType, setSelectedType] = useState("boilerplate");
  const [selectedService, setSelectedService] = useState("");
  const [requirements, setRequirements] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const service = services.find(s => s.id === selectedService);
      
      const prompt = `Generate ${selectedType} code in ${selectedLanguage} for a microservice.

PROJECT: ${project.name}
${service ? `SERVICE: ${service.name} - ${service.description}` : ''}
REQUIREMENTS: ${requirements}

Generate complete, production-ready code with:
- Proper structure and organization
- Error handling
- Type safety
- Comments
- Best practices for ${selectedLanguage}

Return as JSON with file_structure array (path and content for each file) and setup_instructions.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            file_structure: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  content: { type: "string" }
                }
              }
            },
            setup_instructions: { type: "string" }
          }
        }
      });

      await base44.entities.CodeGeneration.create({
        project_id: project.id,
        service_id: selectedService || null,
        generation_type: selectedType,
        language: selectedLanguage,
        framework: selectedLanguage === "typescript" ? "Node.js/Express" : "Standard",
        file_structure: result.file_structure || [],
        setup_instructions: result.setup_instructions || ""
      });

      setGeneratedCode(result);
    } catch (error) {
      console.error("Error generating code:", error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAll = () => {
    if (!generatedCode?.file_structure) return;
    
    generatedCode.file_structure.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.path.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-violet-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-violet-600" />
            AI Code Generation
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate production-ready code for your microservices
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {generationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger><SelectValue placeholder="Service (Optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>New Service</SelectItem>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Describe what you need... (e.g., REST API with CRUD operations for users)"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="h-24"
          />

          <Button
            onClick={generateCode}
            disabled={isGenerating || !requirements}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Code...
              </>
            ) : (
              <>
                <Code className="w-4 h-4 mr-2" />
                Generate Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedCode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Generated Files</CardTitle>
                <Button onClick={downloadAll} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedCode.file_structure?.map((file, i) => (
                <Card key={i} className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{file.path}</Badge>
                      <Button
                        onClick={() => copyToClipboard(file.content)}
                        variant="ghost"
                        size="sm"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
                      {file.content}
                    </pre>
                  </CardContent>
                </Card>
              ))}

              {generatedCode.setup_instructions && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Setup Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedCode.setup_instructions}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}