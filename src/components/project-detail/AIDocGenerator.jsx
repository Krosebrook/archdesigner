import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Sparkles, 
  Loader2,
  Clock,
  RefreshCw,
  BookOpen,
  Code,
  Activity,
  GitBranch,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

const docTypes = [
  { value: "full", label: "Full Documentation", icon: FileText },
  { value: "readme", label: "Service READMEs", icon: BookOpen },
  { value: "api", label: "API Documentation", icon: Code },
  { value: "status", label: "Project Status", icon: Activity },
  { value: "architecture", label: "Architecture Decisions", icon: GitBranch }
];

export default function AIDocGenerator({ project, services }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("full");
  const [selectedService, setSelectedService] = useState("");
  const [allDocs, setAllDocs] = useState([]);
  const [documentation, setDocumentation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({});

  useEffect(() => {
    loadDocumentation();
  }, [project?.id]);

  const loadDocumentation = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const docs = await base44.entities.Documentation.filter(
        { project_id: project.id },
        '-created_date'
      );
      setAllDocs(docs);
      
      if (docs.length > 0) {
        setDocumentation(docs[0]);
        
        // Check sync status
        const cicdConfigs = await base44.entities.CICDConfiguration.filter(
          { project_id: project.id },
          '-created_date',
          1
        );
        
        if (cicdConfigs.length > 0 && docs[0].last_synced) {
          const configDate = new Date(cicdConfigs[0].created_date);
          const docDate = new Date(docs[0].last_synced);
          setSyncStatus({
            cicd: configDate > docDate ? 'outdated' : 'synced'
          });
        }
      }
    } catch (error) {
      console.error("Error loading documentation:", error);
    }
    setIsLoading(false);
  };

  const generateServiceReadme = async (service) => {
    const prompt = `Generate a comprehensive README.md for this microservice:

SERVICE: ${service.name}
CATEGORY: ${service.category}
DESCRIPTION: ${service.description}
TECHNOLOGIES: ${(service.technologies || []).join(', ')}
APIs:
${(service.apis || []).map(api => `- ${api.method} ${api.endpoint}: ${api.description}`).join('\n')}

Include:
1. Service Overview
2. Prerequisites & Installation
3. Configuration (environment variables)
4. API Endpoints documentation
5. Running locally
6. Testing
7. Deployment
8. Troubleshooting
9. Contributing guidelines

Make it professional, clear, and actionable.`;

    const content = await base44.integrations.Core.InvokeLLM({ prompt });
    
    return await base44.entities.Documentation.create({
      project_id: project.id,
      service_id: service.id,
      doc_type: "readme",
      content,
      version: "1.0.0",
      last_synced: new Date().toISOString(),
      sync_status: "synced"
    });
  };

  const generateAPIDocumentation = async (service) => {
    const prompt = `Generate OpenAPI-style API documentation for this service:

SERVICE: ${service.name}
ENDPOINTS:
${(service.apis || []).map(api => `
${api.method} ${api.endpoint}
Description: ${api.description}
`).join('\n')}

Generate comprehensive API documentation with:
- Authentication requirements
- Request/Response schemas
- Error codes and handling
- Rate limiting
- Examples (curl, JavaScript, Python)

Format as structured markdown.`;

    const content = await base44.integrations.Core.InvokeLLM({ prompt });
    
    return await base44.entities.Documentation.create({
      project_id: project.id,
      service_id: service.id,
      doc_type: "api",
      content,
      version: "1.0.0",
      last_synced: new Date().toISOString(),
      sync_status: "synced"
    });
  };

  const generateProjectStatus = async () => {
    const cicdConfigs = await base44.entities.CICDConfiguration.filter(
      { project_id: project.id },
      '-created_date',
      1
    );
    
    const validationReports = await base44.entities.ValidationReport.filter(
      { project_id: project.id },
      '-created_date',
      1
    );

    const prompt = `Generate a comprehensive project status report:

PROJECT: ${project.name}
STATUS: ${project.status}
SERVICES: ${services.length}
${cicdConfigs.length > 0 ? `CI/CD: ${cicdConfigs[0].platform} configured` : 'CI/CD: Not configured'}
${validationReports.length > 0 ? `Architecture Health: ${validationReports[0].overall_score}/100` : ''}

Create a status summary including:
1. Executive Summary
2. Current Sprint/Milestone status
3. Service deployment status
4. Recent changes and updates
5. Blockers and risks
6. Next steps and roadmap
7. Team metrics (if applicable)
8. CI/CD pipeline status

Make it suitable for stakeholder updates.`;

    const content = await base44.integrations.Core.InvokeLLM({ prompt });
    
    return await base44.entities.Documentation.create({
      project_id: project.id,
      doc_type: "status",
      content,
      version: "1.0.0",
      last_synced: new Date().toISOString(),
      sync_status: "synced"
    });
  };

  const generateArchitectureDecisions = async () => {
    const refactorRecommendations = await base44.entities.RefactoringRecommendation.filter(
      { project_id: project.id },
      '-created_date',
      1
    );

    const prompt = `Generate Architecture Decision Records (ADRs) for this project:

PROJECT: ${project.name}
CATEGORY: ${project.category}
SERVICES:
${services.map(s => `- ${s.name} (${s.category}): ${s.technologies?.join(', ')}`).join('\n')}

${refactorRecommendations.length > 0 ? `Recent Refactoring: ${refactorRecommendations[0].summary}` : ''}

Generate ADRs covering:
1. Technology stack choices
2. Communication patterns selected
3. Data storage decisions
4. Security approach
5. Scalability strategy
6. Monitoring and observability
7. Recent architectural changes

Format as structured ADRs with: Context, Decision, Consequences, Status.`;

    const content = await base44.integrations.Core.InvokeLLM({ prompt });
    
    return await base44.entities.Documentation.create({
      project_id: project.id,
      doc_type: "architecture",
      content,
      version: "1.0.0",
      last_synced: new Date().toISOString(),
      sync_status: "synced"
    });
  };

  const generateDocumentation = async () => {
    setIsGenerating(true);
    try {
      let newDoc;

      if (selectedDocType === "readme") {
        if (!selectedService) {
          // Generate for all services
          const docs = await Promise.all(
            services.map(service => generateServiceReadme(service))
          );
          newDoc = docs[0];
        } else {
          const service = services.find(s => s.id === selectedService);
          newDoc = await generateServiceReadme(service);
        }
      } else if (selectedDocType === "api") {
        if (!selectedService) {
          // Generate combined API docs
          const docs = await Promise.all(
            services.map(service => generateAPIDocumentation(service))
          );
          newDoc = docs[0];
        } else {
          const service = services.find(s => s.id === selectedService);
          newDoc = await generateAPIDocumentation(service);
        }
      } else if (selectedDocType === "status") {
        newDoc = await generateProjectStatus();
      } else if (selectedDocType === "architecture") {
        newDoc = await generateArchitectureDecisions();
      } else {
        // Full documentation (existing logic)
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
        newDoc = await base44.entities.Documentation.create({
          project_id: project.id,
          doc_type: "full",
          content: fullContent,
          sections: result,
          version: "1.0.0",
          last_synced: new Date().toISOString(),
          sync_status: "synced"
        });
      }

      setDocumentation(newDoc);
      await loadDocumentation();
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <Card className="bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              AI Documentation Assistant
            </CardTitle>
            <p className="text-purple-100 mt-2 text-base">
              Auto-generate READMEs, API docs, status reports, and architecture decisions—kept in sync with your code
            </p>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Documentation Type</label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(selectedDocType === "readme" || selectedDocType === "api") && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <label className="text-sm font-semibold text-white mb-2 block">Service (Optional)</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All Services</SelectItem>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>

            {syncStatus.cicd === 'outdated' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-yellow-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Documentation may be outdated</span>
                </div>
                <p className="text-sm text-yellow-100 mt-1 ml-7">
                  CI/CD configuration has changed. Consider regenerating docs.
                </p>
              </motion.div>
            )}

            <Button
              onClick={generateDocumentation}
              disabled={isGenerating || services.length === 0}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate {docTypes.find(t => t.value === selectedDocType)?.label}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Documentation List */}
      {allDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Generated Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allDocs.slice(0, 10).map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setDocumentation(doc)}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-lg cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {docTypes.find(t => t.value === doc.doc_type)?.icon && (
                        React.createElement(docTypes.find(t => t.value === doc.doc_type).icon, {
                          className: "w-5 h-5 text-blue-600"
                        })
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {docTypes.find(t => t.value === doc.doc_type)?.label || doc.doc_type}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(doc.created_date), 'PPp')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={doc.sync_status === 'synced' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}
                      >
                        {doc.sync_status === 'synced' ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />Synced</>
                        ) : (
                          <><AlertCircle className="w-3 h-3 mr-1" />Outdated</>
                        )}
                      </Badge>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const blob = new Blob([doc.content], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${doc.doc_type}-${format(new Date(doc.created_date), 'yyyy-MM-dd')}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <AnimatePresence>
        {documentation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="shadow-2xl">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {docTypes.find(t => t.value === documentation.doc_type)?.icon && 
                        React.createElement(docTypes.find(t => t.value === documentation.doc_type).icon, {
                          className: "w-5 h-5 text-blue-600"
                        })
                      }
                      {docTypes.find(t => t.value === documentation.doc_type)?.label}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {format(new Date(documentation.created_date), 'PPp')}
                      <Badge variant="outline">v{documentation.version}</Badge>
                      <Badge 
                        className={documentation.sync_status === 'synced' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                      >
                        {documentation.sync_status === 'synced' ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />Synced</>
                        ) : (
                          <><AlertCircle className="w-3 h-3 mr-1" />Outdated</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportDocumentation} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button onClick={generateDocumentation} variant="outline" size="sm" disabled={isGenerating}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {documentation.doc_type === "full" && documentation.sections ? (
                  <Tabs defaultValue="full" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-7 bg-gray-100">
                      <TabsTrigger value="full">Full</TabsTrigger>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="services">Services</TabsTrigger>
                      <TabsTrigger value="api">APIs</TabsTrigger>
                      <TabsTrigger value="architecture">Architecture</TabsTrigger>
                      <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                      <TabsTrigger value="health">Health</TabsTrigger>
                    </TabsList>

                    <TabsContent value="full" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.content}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="overview" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.sections.project_overview}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="services" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.sections.service_catalog}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="api" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.sections.api_reference}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="architecture" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.sections.architecture_diagram}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="dependencies" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.sections.dependencies}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="health" className="prose prose-sm max-w-none">
                      <ReactMarkdown>{documentation.sections.health_summary}</ReactMarkdown>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{documentation.content}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}