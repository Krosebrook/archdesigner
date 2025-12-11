import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  FileText, 
  Code, 
  Layers, 
  Activity, 
  Sparkles, 
  Loader2, 
  Download,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

const DOC_TEMPLATES = [
  {
    type: "readme",
    label: "README.md",
    icon: FileText,
    description: "Comprehensive project overview with setup instructions",
    color: "from-blue-500 to-cyan-500"
  },
  {
    type: "api",
    label: "API Documentation",
    icon: Code,
    description: "Complete API reference with endpoints and examples",
    color: "from-purple-500 to-pink-500"
  },
  {
    type: "architecture",
    label: "Architecture Guide",
    icon: Layers,
    description: "System design, patterns, and technical decisions",
    color: "from-orange-500 to-red-500"
  },
  {
    type: "adr",
    label: "Decision Records",
    icon: Layers,
    description: "Architecture Decision Records (ADRs)",
    color: "from-green-500 to-emerald-500"
  },
  {
    type: "contributing",
    label: "Contributing Guide",
    icon: FileText,
    description: "Development workflow and contribution guidelines",
    color: "from-indigo-500 to-blue-500"
  },
  {
    type: "changelog",
    label: "Changelog",
    icon: Activity,
    description: "Version history and release notes",
    color: "from-yellow-500 to-orange-500"
  }
];

export default function AutoDocsGenerator({ project }) {
  const [generating, setGenerating] = useState({});
  const [docs, setDocs] = useState({});
  const [activeTab, setActiveTab] = useState("readme");

  const generateDoc = async (docType) => {
    setGenerating(prev => ({ ...prev, [docType]: true }));
    
    try {
      const response = await base44.functions.invoke('generateDocumentation', {
        project_id: project.id,
        doc_type: docType
      });

      setDocs(prev => ({
        ...prev,
        [docType]: {
          content: response.data.content,
          generated_at: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error(`Error generating ${docType} documentation:`, error);
    } finally {
      setGenerating(prev => ({ ...prev, [docType]: false }));
    }
  };

  const generateAllDocs = async () => {
    for (const template of DOC_TEMPLATES) {
      await generateDoc(template.type);
    }
  };

  const downloadDoc = (docType, content) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                AI Documentation Generator
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Automatically generate and update comprehensive documentation for all your microservices
              </p>
            </div>
            <Button
              onClick={generateAllDocs}
              disabled={Object.values(generating).some(Boolean)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
            >
              {Object.values(generating).some(Boolean) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate All Docs
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Documentation Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOC_TEMPLATES.map((template) => {
          const Icon = template.icon;
          const isGenerating = generating[template.type];
          const doc = docs[template.type];

          return (
            <motion.div
              key={template.type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 bg-gradient-to-br ${template.color} rounded-lg shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {doc && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Generated
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-4">{template.label}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => generateDoc(template.type)}
                    disabled={isGenerating}
                    className="w-full"
                    variant={doc ? "outline" : "default"}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : doc ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  {doc && (
                    <Button
                      onClick={() => downloadDoc(template.type, doc.content)}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Documentation Preview */}
      {Object.keys(docs).length > 0 && (
        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle>Generated Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {DOC_TEMPLATES.filter(t => docs[t.type]).map(template => (
                  <TabsTrigger key={template.type} value={template.type} className="text-xs">
                    {template.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {DOC_TEMPLATES.map(template => (
                docs[template.type] && (
                  <TabsContent key={template.type} value={template.type} className="mt-6">
                    <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline" className="text-xs">
                          Generated: {new Date(docs[template.type].generated_at).toLocaleString()}
                        </Badge>
                        <Button
                          onClick={() => downloadDoc(template.type, docs[template.type].content)}
                          variant="ghost"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{docs[template.type].content}</ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>
                )
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}