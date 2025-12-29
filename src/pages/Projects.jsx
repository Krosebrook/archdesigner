import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

import ProjectCard from "../components/projects/ProjectCard";
import CreateProjectModal from "../components/projects/CreateProjectModal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Project.list('-created_date');
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
    setIsLoading(false);
  };

  const handleCreateProject = async (projectData) => {
    try {
      const { selectedTemplates, projectTemplateId, templateConfig, enableAIOnboarding, aiGeneratedServices, industryTemplate, ...projectFields } = projectData;
      
      // Create project
      const newProject = await base44.entities.Project.create(projectFields);
      
      // Handle industry-specific scaffolding
      if (industryTemplate?.template) {
        const template = industryTemplate.template;
        
        // Generate CI/CD with compliance checks
        if (template.cicd_pipeline) {
          await base44.entities.CICDConfiguration.create({
            project_id: newProject.id,
            platform: template.cicd_pipeline.deployment_strategy || "github_actions",
            deployment_targets: [{
              name: "production",
              type: "kubernetes",
              environment: "production"
            }],
            pipeline_stages: template.cicd_pipeline.testing_stages ? {
              linting: { enabled: true, tools: ["eslint"] },
              testing: { enabled: true, unit_tests: true, integration_tests: true },
              security_scanning: {
                enabled: true,
                dependency_scan: true,
                sast: true,
                container_scan: true
              },
              build: { enabled: true, docker: true },
              deploy: { enabled: true, auto_staging: true, manual_production: true }
            } : {},
            security_scan_config: {
              enabled: true,
              sast_tools: template.cicd_pipeline.security_scans || ["sonarqube"],
              dependency_scan: true,
              container_scan: true
            }
          });
        }

        // Create services with full scaffolding
        if (template.services) {
          const servicePromises = template.services.map(async (serviceConfig) => {
            const service = await base44.entities.Service.create({
              project_id: newProject.id,
              name: serviceConfig.name,
              description: serviceConfig.purpose,
              category: serviceConfig.category,
              technologies: [serviceConfig.technology],
              apis: serviceConfig.api_endpoints?.map(ep => ({
                method: ep.method || "GET",
                path: ep.path || `/${serviceConfig.name.toLowerCase()}`,
                description: ep.description
              })) || [],
              database_schema: serviceConfig.database_schema,
              position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
            });

            // Generate documentation for service
            await base44.entities.Documentation.create({
              project_id: newProject.id,
              service_id: service.id,
              doc_type: "api",
              content: `# ${serviceConfig.name} API Documentation

## Overview
${serviceConfig.purpose}

## Technology Stack
- **Primary**: ${serviceConfig.technology}
- **Database**: ${serviceConfig.database_type}

## Security Requirements
${serviceConfig.security_requirements?.map(req => `- ${req}`).join('\n') || 'Standard authentication required'}

## Compliance Notes
${serviceConfig.compliance_notes || 'See project-level compliance requirements'}

## API Endpoints
${serviceConfig.api_endpoints?.map(ep => `
### ${ep.method} ${ep.path}
${ep.description || ''}
`).join('\n') || 'No endpoints defined yet'}

## Database Schema
${JSON.stringify(serviceConfig.database_schema, null, 2)}
`
            });

            return service;
          });

          await Promise.all(servicePromises);
        }

        // Generate compliance documentation
        if (template.security_compliance) {
          await base44.entities.Documentation.create({
            project_id: newProject.id,
            doc_type: "status",
            content: `# Security & Compliance Documentation

## Authentication Strategy
${template.security_compliance.authentication}

## Data Encryption
${template.security_compliance.encryption}

## Audit Requirements
${template.security_compliance.audit_requirements?.map(req => `- ${req}`).join('\n') || 'No specific requirements'}

## Required Certifications
${template.security_compliance.certifications?.map(cert => `- ${cert}`).join('\n') || 'No certifications required'}

## Database Architecture
- **Encryption**: ${template.database_architecture?.encryption || 'AES-256'}
- **Audit Logging**: ${template.database_architecture?.audit_logging || 'Enabled'}
- **Backup Policy**: ${template.database_architecture?.backup_policy || 'Daily backups with 30-day retention'}
`
          });
        }

        // Update project counts
        await base44.entities.Project.update(newProject.id, {
          services_count: template.services?.length || 0
        });
      }
      
      // Run AI onboarding if enabled and no industry template
      if (enableAIOnboarding && !industryTemplate && !templateConfig && selectedTemplates.length === 0) {
        const { autoOnboardProject } = await import("../components/projects/AIProjectOnboarding");
        await autoOnboardProject(newProject);
        setShowCreateModal(false);
        loadProjects();
        return;
      }
      
      // If using a project template, create services and tasks from it
      if (templateConfig && templateConfig.default_services) {
        const servicePromises = templateConfig.default_services.map(serviceConfig =>
          base44.entities.Service.create({
            project_id: newProject.id,
            name: serviceConfig.name,
            description: serviceConfig.description,
            category: serviceConfig.category,
            technologies: serviceConfig.technologies || [],
            apis: [],
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
          })
        );
        await Promise.all(servicePromises);

        // Create initial tasks from template
        if (templateConfig.default_tasks) {
          const taskPromises = templateConfig.default_tasks.map(taskConfig =>
            base44.entities.Task.create({
              project_id: newProject.id,
              title: taskConfig.title,
              description: taskConfig.description,
              priority_level: taskConfig.priority_level,
              status: "backlog"
            })
          );
          await Promise.all(taskPromises);
        }

        // Update project counts
        await base44.entities.Project.update(newProject.id, {
          services_count: templateConfig.default_services.length
        });
      }
      
      // If service templates were selected, create services from them
      if (selectedTemplates && selectedTemplates.length > 0) {
        const templates = await base44.entities.ServiceTemplate.list();
        const selectedTemplateData = templates.filter(t => selectedTemplates.includes(t.id));
        
        const servicePromises = selectedTemplateData.map(template =>
          base44.entities.Service.create({
            project_id: newProject.id,
            name: template.name,
            description: template.description,
            icon: template.icon,
            category: template.category,
            technologies: template.default_technologies,
            apis: template.default_apis,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
          })
        );
        
        await Promise.all(servicePromises);
        
        // Update template usage counts
        const updatePromises = selectedTemplateData.map(template =>
          base44.entities.ServiceTemplate.update(template.id, {
            usage_count: (template.usage_count || 0) + 1
          })
        );
        await Promise.all(updatePromises);

        // Update project service count
        const currentCount = await base44.entities.Project.list();
        const project = currentCount.find(p => p.id === newProject.id);
        await base44.entities.Project.update(newProject.id, {
          services_count: (project?.services_count || 0) + selectedTemplates.length
        });
        }

        // If AI-generated services exist, create them
        if (aiGeneratedServices && aiGeneratedServices.length > 0) {
        const aiServicePromises = aiGeneratedServices.map(aiService =>
          base44.entities.Service.create({
            project_id: newProject.id,
            name: aiService.name,
            description: aiService.purpose,
            category: aiService.category,
            technologies: [aiService.technology, ...(aiService.dependencies || [])],
            apis: aiService.api_endpoints || [],
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            database_schema: aiService.database_schema,
            boilerplate_code: aiService.boilerplate_code,
            dockerfile: aiService.dockerfile
          })
        );

        await Promise.all(aiServicePromises);

        // Update project service count
        await base44.entities.Project.update(newProject.id, {
          services_count: (newProject.services_count || 0) + aiGeneratedServices.length
        });
        }

        setShowCreateModal(false);
        loadProjects();
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Projects
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage your microservices architecture projects
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="ai">AI/ML</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Projects Grid */}
        <AnimatePresence>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-2xl animate-pulse shadow-sm border border-gray-100" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first project to get started"
                }
              </p>
              {!searchQuery && categoryFilter === "all" && statusFilter === "all" && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  index={index}
                  onUpdate={loadProjects}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      </div>
    </div>
  );
}