import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Code, Loader2, Download, Copy, CheckCircle2, FileArchive } from "lucide-react";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

const languages = [
  { value: "typescript", label: "TypeScript", frameworks: ["Node.js/Express", "NestJS", "Fastify"] },
  { value: "python", label: "Python", frameworks: ["FastAPI", "Django", "Flask"] },
  { value: "go", label: "Go", frameworks: ["Gin", "Echo", "Chi"] },
  { value: "java", label: "Java", frameworks: ["Spring Boot", "Quarkus", "Micronaut"] },
  { value: "rust", label: "Rust", frameworks: ["Actix", "Rocket", "Axum"] },
  { value: "javascript", label: "Node.js", frameworks: ["Express", "Koa", "Hapi"] },
  { value: "csharp", label: "C#", frameworks: [".NET Core", "ASP.NET"] }
];

const generationTypes = [
  { value: "boilerplate", label: "Service Boilerplate" },
  { value: "endpoint", label: "API Endpoint" },
  { value: "model", label: "Data Model" },
  { value: "test", label: "Test Suite" },
  { value: "full_service", label: "Full Service" },
  { value: "dockerfile", label: "Dockerfile + Docker Compose" }
];

const architecturalPatterns = [
  { value: "microservices", label: "Microservices" },
  { value: "monolithic", label: "Monolithic" },
  { value: "serverless", label: "Serverless" },
  { value: "event-driven", label: "Event-Driven" },
  { value: "cqrs", label: "CQRS" },
  { value: "layered", label: "Layered Architecture" }
];

const codeStyles = [
  { value: "clean", label: "Clean Code" },
  { value: "functional", label: "Functional" },
  { value: "oop", label: "Object-Oriented" },
  { value: "domain-driven", label: "Domain-Driven Design" }
];

const cicdPlatforms = [
  { value: "github", label: "GitHub Actions" },
  { value: "gitlab", label: "GitLab CI" },
  { value: "jenkins", label: "Jenkins" },
  { value: "circleci", label: "CircleCI" },
  { value: "azure", label: "Azure DevOps" }
];

export default function CodeGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [selectedFramework, setSelectedFramework] = useState("Node.js/Express");
  const [selectedType, setSelectedType] = useState("boilerplate");
  const [selectedService, setSelectedService] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("microservices");
  const [selectedCodeStyle, setSelectedCodeStyle] = useState("clean");
  const [selectedCICD, setSelectedCICD] = useState("github");
  const [includeCICD, setIncludeCICD] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const currentLanguage = languages.find(l => l.value === selectedLanguage);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const service = services.find(s => s.id === selectedService);
      
      const prompt = `Generate ${selectedType} code in ${selectedLanguage} using ${selectedFramework} framework for a ${selectedPattern} architecture.

PROJECT: ${project.name}
${service ? `SERVICE: ${service.name} - ${service.description}` : ''}
ARCHITECTURAL PATTERN: ${selectedPattern}
CODE STYLE: ${selectedCodeStyle}
FRAMEWORK: ${selectedFramework}
REQUIREMENTS: ${requirements}

Generate complete, production-ready code with:
- Proper structure following ${selectedPattern} architecture
- ${selectedCodeStyle} code style and principles
- Error handling and validation
- Type safety (if applicable)
- Comprehensive comments
- Best practices for ${selectedLanguage} and ${selectedFramework}
- Security considerations
- Performance optimizations
- Logging and monitoring hooks
${includeCICD ? `\n- CI/CD pipeline configuration for ${selectedCICD}` : ''}

${includeCICD ? `Include CI/CD configuration that:
- Runs tests automatically
- Builds Docker images
- Deploys to staging/production
- Includes health checks
- Has rollback capabilities` : ''}

Return as JSON with:
- file_structure: array of {path, content} for all code files
- setup_instructions: detailed setup and deployment instructions
${includeCICD ? '- cicd_config: CI/CD pipeline configuration' : ''}`;

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
            setup_instructions: { type: "string" },
            cicd_config: { type: "string" }
          }
        }
      });

      await base44.entities.CodeGeneration.create({
        project_id: project.id,
        service_id: selectedService || null,
        generation_type: selectedType,
        language: selectedLanguage,
        framework: selectedFramework,
        file_structure: result.file_structure || [],
        setup_instructions: result.setup_instructions || "",
        generated_code: result.cicd_config || ""
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

  const downloadAsZip = async () => {
    if (!generatedCode?.file_structure) return;
    
    try {
      const zip = new JSZip();
      
      // Add all generated files to ZIP
      generatedCode.file_structure.forEach(file => {
        zip.file(file.path, file.content);
      });
      
      // Add README with setup instructions
      if (generatedCode.setup_instructions) {
        zip.file("README.md", generatedCode.setup_instructions);
      }
      
      // Add CI/CD config if present
      if (generatedCode.cicd_config) {
        const cicdFilename = selectedCICD === 'github' ? '.github/workflows/ci.yml' :
                            selectedCICD === 'gitlab' ? '.gitlab-ci.yml' :
                            selectedCICD === 'jenkins' ? 'Jenkinsfile' :
                            'ci-cd-config.yml';
        zip.file(cicdFilename, generatedCode.cicd_config);
      }
      
      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const serviceName = services.find(s => s.id === selectedService)?.name || 'generated-service';
      saveAs(content, `${serviceName}-${selectedLanguage}.zip`);
      toast.success("Downloaded project as ZIP");
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      toast.error("Failed to create ZIP file");
    }
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
          <div className="grid md:grid-cols-4 gap-4">
            <Select value={selectedLanguage} onValueChange={(val) => {
              setSelectedLanguage(val);
              const lang = languages.find(l => l.value === val);
              if (lang?.frameworks?.[0]) setSelectedFramework(lang.frameworks[0]);
            }}>
              <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger><SelectValue placeholder="Framework" /></SelectTrigger>
              <SelectContent>
                {currentLanguage?.frameworks?.map(fw => (
                  <SelectItem key={fw} value={fw}>{fw}</SelectItem>
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

          <div className="grid md:grid-cols-2 gap-4">
            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger><SelectValue placeholder="Architecture Pattern" /></SelectTrigger>
              <SelectContent>
                {architecturalPatterns.map(pattern => (
                  <SelectItem key={pattern.value} value={pattern.value}>{pattern.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCodeStyle} onValueChange={setSelectedCodeStyle}>
              <SelectTrigger><SelectValue placeholder="Code Style" /></SelectTrigger>
              <SelectContent>
                {codeStyles.map(style => (
                  <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="includeCICD"
              checked={includeCICD}
              onChange={(e) => setIncludeCICD(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="includeCICD" className="text-sm font-medium text-gray-900 flex-1">
              Include CI/CD Pipeline Configuration
            </label>
            {includeCICD && (
              <Select value={selectedCICD} onValueChange={setSelectedCICD}>
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="CI/CD Platform" />
                </SelectTrigger>
                <SelectContent>
                  {cicdPlatforms.map(platform => (
                    <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Textarea
            placeholder="Describe what you need... (e.g., REST API with CRUD operations for users, authentication, rate limiting)"
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
                <div className="flex gap-2">
                  <Button onClick={downloadAsZip} variant="default" size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <FileArchive className="w-4 h-4 mr-2" />
                    Download ZIP
                  </Button>
                  <Button onClick={downloadAll} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Individual Files
                  </Button>
                </div>
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

              {generatedCode.cicd_config && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">CI/CD Pipeline Configuration</CardTitle>
                      <Button
                        onClick={() => copyToClipboard(generatedCode.cicd_config)}
                        variant="ghost"
                        size="sm"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
                      {generatedCode.cicd_config}
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