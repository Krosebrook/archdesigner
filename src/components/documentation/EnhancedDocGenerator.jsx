import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Loader2, 
  Copy, 
  Download,
  CheckCircle2,
  RefreshCw,
  Layers,
  Code,
  Cloud,
  Network
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";

const docTypes = [
  { id: "readme", label: "README", icon: FileText, color: "text-blue-600" },
  { id: "architecture", label: "Architecture", icon: Layers, color: "text-purple-600" },
  { id: "api", label: "API Reference", icon: Network, color: "text-green-600" },
  { id: "deployment", label: "Deployment", icon: Cloud, color: "text-orange-600" },
  { id: "code", label: "Code Docs", icon: Code, color: "text-teal-600" }
];

function EnhancedDocGenerator({ project, services = [], analysis }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [documentation, setDocumentation] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [copied, setCopied] = useState({});

  useEffect(() => {
    loadExistingDocs();
  }, [project.id]);

  const loadExistingDocs = async () => {
    try {
      const docs = await base44.entities.Documentation.filter({ 
        project_id: project.id 
      }, '-created_date', 1);
      
      if (docs.length > 0) {
        setDocumentation(docs[0]);
        setLastSynced(docs[0].updated_date);
      }
    } catch (error) {
      console.error("Failed to load docs:", error);
    }
  };

  const generateDocumentation = async () => {
    setIsGenerating(true);
    try {
      const serviceDetails = services.map(s => ({
        name: s.name,
        category: s.category,
        technologies: s.technologies || [],
        apis: s.apis || [],
        database_schema: s.database_schema
      }));

      const prompt = `You are a technical documentation expert. Generate comprehensive, production-ready documentation for this project:

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
CATEGORY: ${project.category}
SERVICES: ${serviceDetails.map(s => `${s.name} (${s.technologies.join(", ")})`).join("; ")}

${analysis?.issues ? `RECENT CODE IMPROVEMENTS:
${analysis.issues.slice(0, 5).map(i => `- ${i.title}: ${i.description}`).join("\n")}` : ""}

Generate complete documentation with:

1. **README.md** - Project overview:
   - Hero section with project description
   - Key features and capabilities
   - Tech stack with reasoning
   - Quick start guide
   - Project structure
   - Contributing guidelines
   - License info

2. **ARCHITECTURE.md** - System design:
   - High-level architecture diagram (Mermaid)
   - Service breakdown with responsibilities
   - Data flow and communication patterns
   - Design patterns used
   - Scalability considerations
   - Security architecture
   - Technology choices rationale

3. **API.md** - Complete API reference:
   - Base URLs and authentication
   - Endpoint documentation (method, path, params, responses)
   - Request/response examples
   - Error codes and handling
   - Rate limiting
   - Webhooks if applicable
   - SDKs and client libraries

4. **DEPLOYMENT.md** - Infrastructure guide:
   - Environment setup
   - Configuration management
   - CI/CD pipeline
   - Cloud infrastructure (${project.cloud_provider || "AWS/Azure/GCP"})
   - Monitoring and logging
   - Scaling strategies
   - Disaster recovery
   - Security best practices

5. **CODE_GUIDE.md** - Developer docs:
   - Code organization
   - Naming conventions
   - Key abstractions and patterns
   - Testing strategy
   - Code review checklist
   - Common pitfalls
   - Performance tips

Use proper markdown formatting, code blocks with syntax highlighting, and Mermaid diagrams where helpful.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            readme: { type: "string" },
            architecture: { type: "string" },
            api_reference: { type: "string" },
            deployment_guide: { type: "string" },
            code_guide: { type: "string" },
            change_summary: { type: "string" },
            version: { type: "string" }
          }
        }
      });

      // Save to database
      const savedDoc = await base44.entities.Documentation.create({
        project_id: project.id,
        doc_type: "full",
        content: JSON.stringify(result),
        version: result.version || "1.0.0",
        sections: {
          readme: result.readme,
          architecture: result.architecture,
          api_reference: result.api_reference,
          deployment: result.deployment_guide,
          code: result.code_guide
        },
        sync_status: "synced",
        last_synced: new Date().toISOString()
      });

      setDocumentation(savedDoc);
      setLastSynced(new Date().toISOString());
      toast.success("Documentation generated successfully");
    } catch (error) {
      console.error("Documentation generation failed:", error);
      toast.error("Failed to generate documentation");
    } finally {
      setIsGenerating(false);
    }
  };

  const syncDocumentation = async () => {
    if (!documentation) return;
    
    setIsGenerating(true);
    try {
      const changes = analysis?.issues?.map(i => ({
        title: i.title,
        category: i.category,
        description: i.description
      })) || [];

      const prompt = `Update existing documentation to reflect recent code changes:

EXISTING DOCS VERSION: ${documentation.version}
PROJECT: ${project.name}

RECENT CHANGES:
${changes.map(c => `- [${c.category}] ${c.title}: ${c.description}`).join("\n")}

CURRENT SECTIONS:
${Object.keys(documentation.sections || {}).join(", ")}

Review and update ONLY the affected sections. Maintain consistency with existing style and structure.
Add changelog entry for this update.

Return updated sections with version bump.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            updated_sections: {
              type: "object",
              properties: {
                readme: { type: "string" },
                architecture: { type: "string" },
                api_reference: { type: "string" },
                deployment: { type: "string" },
                code: { type: "string" }
              }
            },
            changelog: { type: "string" },
            version: { type: "string" }
          }
        }
      });

      // Update documentation
      const updatedDoc = await base44.entities.Documentation.update(documentation.id, {
        sections: result.updated_sections,
        version: result.version,
        sync_status: "synced",
        last_synced: new Date().toISOString()
      });

      setDocumentation(updatedDoc);
      setLastSynced(new Date().toISOString());
      toast.success(`Documentation synced to v${result.version}`);
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync documentation");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    toast.success("Copied to clipboard");
  };

  const downloadDocs = () => {
    if (!documentation?.sections) return;

    Object.entries(documentation.sections).forEach(([type, content]) => {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type.toUpperCase()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });

    toast.success("Downloaded all documentation");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                AI Documentation Engine
              </CardTitle>
              <CardDescription>
                Comprehensive docs with auto-sync on code changes
              </CardDescription>
            </div>
            {lastSynced && (
              <Badge variant="outline" className="text-xs">
                Synced {new Date(lastSynced).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-sm">Auto-Sync</div>
                <div className="text-xs text-gray-600">Update docs on code changes</div>
              </div>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Button
              onClick={generateDocumentation}
              disabled={isGenerating}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {documentation ? "Regenerate All" : "Generate Documentation"}
                </>
              )}
            </Button>

            <Button
              onClick={syncDocumentation}
              disabled={isGenerating || !documentation}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync with Latest Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {documentation?.sections && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="secondary">v{documentation.version || "1.0.0"}</Badge>
                <Badge variant="outline">{Object.keys(documentation.sections).length} sections</Badge>
              </div>
              <Button onClick={downloadDocs} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <Tabs defaultValue="readme" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {docTypes.map(type => (
                  <TabsTrigger key={type.id} value={type.id}>
                    <type.icon className="w-4 h-4 mr-1" />
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {docTypes.map(type => (
                <TabsContent key={type.id} value={type.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <type.icon className={`w-5 h-5 ${type.color}`} />
                          {type.label}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(documentation.sections[type.id] || "", type.id)}
                        >
                          {copied[type.id] ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none bg-white rounded-lg border p-6">
                        <ReactMarkdown>
                          {documentation.sections[type.id] || `No ${type.label} documentation available`}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

EnhancedDocGenerator.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    cloud_provider: PropTypes.string
  }).isRequired,
  services: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string,
    technologies: PropTypes.arrayOf(PropTypes.string),
    apis: PropTypes.array,
    database_schema: PropTypes.object
  })),
  analysis: PropTypes.shape({
    issues: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      category: PropTypes.string,
      description: PropTypes.string
    }))
  })
};

export default EnhancedDocGenerator;