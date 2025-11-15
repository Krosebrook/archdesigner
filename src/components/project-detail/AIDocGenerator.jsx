import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Sparkles, 
  Loader2,
  Clock,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

export default function AIDocGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentation, setDocumentation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocumentation();
  }, [project?.id]);

  const loadDocumentation = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const docs = await base44.entities.Documentation.filter(
        { project_id: project.id },
        '-created_date',
        1
      );
      if (docs.length > 0) {
        setDocumentation(docs[0]);
      }
    } catch (error) {
      console.error("Error loading documentation:", error);
    }
    setIsLoading(false);
  };

  const generateDocumentation = async () => {
    setIsGenerating(true);
    try {
      // Gather all project data
      const dependencyGraphs = await base44.entities.DependencyGraph.filter(
        { project_id: project.id },
        '-created_date',
        1
      );
      
      const validationReports = await base44.entities.ValidationReport.filter(
        { project_id: project.id },
        '-created_date',
        1
      );
      
      const refactorRecommendations = await base44.entities.RefactoringRecommendation.filter(
        { project_id: project.id },
        '-created_date',
        1
      );

      // Build comprehensive context
      const servicesContext = services.map(s => `
### ${s.name}
**Category:** ${s.category}
**Description:** ${s.description}
**Technologies:** ${(s.technologies || []).join(', ')}
**APIs:**
${(s.apis || []).map(api => `- ${api.method || 'GET'} ${api.endpoint} - ${api.description || ''}`).join('\n')}
**Dependencies:** ${(s.depends_on || []).length} service(s)
      `).join('\n\n');

      const prompt = `You are a technical documentation expert. Generate comprehensive, professional architecture documentation for this microservices project.

PROJECT INFORMATION:
Name: ${project.name}
Description: ${project.description}
Category: ${project.category}
Status: ${project.status}
Total Services: ${services.length}

SERVICES DETAILS:
${servicesContext}

${dependencyGraphs.length > 0 ? `DEPENDENCY ANALYSIS:
Total Nodes: ${dependencyGraphs[0].metrics?.total_nodes || 0}
Total Edges: ${dependencyGraphs[0].metrics?.total_edges || 0}
Complexity Score: ${dependencyGraphs[0].metrics?.complexity_score || 0}
Hotspots: ${(dependencyGraphs[0].analysis?.hotspots || []).length}
Cycles Detected: ${(dependencyGraphs[0].analysis?.cycles || []).length}
` : ''}

${validationReports.length > 0 ? `LATEST VALIDATION:
Overall Score: ${validationReports[0].overall_score}/100
Critical Issues: ${validationReports[0].critical_count || 0}
High Priority Issues: ${validationReports[0].high_count || 0}
` : ''}

${refactorRecommendations.length > 0 ? `REFACTORING STATUS:
Summary: ${refactorRecommendations[0].summary}
Risks Identified: ${(refactorRecommendations[0].risks || []).length}
Patterns Suggested: ${(refactorRecommendations[0].patterns_suggested || []).length}
` : ''}

Generate a complete, well-structured documentation with the following sections. Return as JSON with these fields:
- project_overview: Executive summary, purpose, and key features
- service_catalog: Detailed description of each service with its role
- api_reference: Complete API endpoints documentation
- architecture_diagram: Textual description of the architecture (describe how services connect)
- dependencies: Explanation of service dependencies and data flow
- health_summary: Current architecture health status and recommendations

Make it professional, detailed, and suitable for technical and non-technical stakeholders.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            project_overview: { type: "string" },
            service_catalog: { type: "string" },
            api_reference: { type: "string" },
            architecture_diagram: { type: "string" },
            dependencies: { type: "string" },
            health_summary: { type: "string" }
          },
          required: ["project_overview", "service_catalog", "api_reference"]
        }
      });

      // Build full markdown content
      const fullContent = `# ${project.name} - Architecture Documentation

## Project Overview
${result.project_overview}

## Service Catalog
${result.service_catalog}

## API Reference
${result.api_reference}

## Architecture Diagram
${result.architecture_diagram}

## Dependencies & Data Flow
${result.dependencies}

## Health Summary
${result.health_summary}

---
*Generated on ${new Date().toISOString()}*
*Total Services: ${services.length}*
${validationReports.length > 0 ? `*Architecture Health Score: ${validationReports[0].overall_score}/100*` : ''}
`;

      // Save documentation
      const newDoc = await base44.entities.Documentation.create({
        project_id: project.id,
        content: fullContent,
        sections: result,
        version: "1.0.0",
        generated_at: new Date().toISOString()
      });

      setDocumentation(newDoc);
    } catch (error) {
      console.error("Error generating documentation:", error);
    }
    setIsGenerating(false);
  };

  const exportDocumentation = () => {
    if (!documentation) return;
    
    const blob = new Blob([documentation.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-architecture-docs-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                AI Documentation Generator
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Automatically generate comprehensive architecture documentation
              </p>
            </div>
            <div className="flex gap-2">
              {documentation && (
                <>
                  <Button
                    onClick={exportDocumentation}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={generateDocumentation}
                    variant="outline"
                    size="sm"
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!documentation ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Documentation Generated Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Generate comprehensive documentation for your microservices architecture
              </p>
              <Button
                onClick={generateDocumentation}
                disabled={isGenerating || services.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Documentation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Documentation
                  </>
                )}
              </Button>
              {services.length === 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  Add services to your project first
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Last generated: {format(new Date(documentation.created_date), 'PPp')}
              <Badge variant="outline" className="ml-2">v{documentation.version}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {documentation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs defaultValue="full" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="full">Full Document</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="api">APIs</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>

            <TabsContent value="full">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.content}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.sections.project_overview}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.sections.service_catalog}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.sections.api_reference}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="architecture">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.sections.architecture_diagram}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dependencies">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.sections.dependencies}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health">
              <Card className="bg-white">
                <CardContent className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{documentation.sections.health_summary}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}