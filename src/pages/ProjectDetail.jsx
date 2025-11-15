import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Plus, Network, List, Sparkles, Zap, FileText, BookOpen,
  Code2, FileCode2, DollarSign, Package, GitBranch, Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import VisualEditor from "../components/project-detail/VisualEditor";
import ServicesList from "../components/project-detail/ServicesList";
import AIValidator from "../components/project-detail/AIValidator";
import AddServiceModal from "../components/project-detail/AddServiceModal";
import ServiceTemplates from "../components/project-detail/ServiceTemplates";
import DependencyVisualizer from "../components/project-detail/DependencyVisualizer";
import AIRefactor from "../components/project-detail/AIRefactor";
import PerformanceMonitor from "../components/project-detail/PerformanceMonitor";
import AIDocGenerator from "../components/project-detail/AIDocGenerator";
import RuleManagement from "../components/project-detail/RuleManagement";
import AICodeReview from "../components/project-detail/AICodeReview";
import APIGenerator from "../components/project-detail/APIGenerator";
import CostOptimizer from "../components/project-detail/CostOptimizer";
import DependencyManager from "../components/project-detail/DependencyManager";
import CICDGenerator from "../components/project-detail/CICDGenerator";
import ProjectTemplateGallery from "../components/project-detail/ProjectTemplateGallery";

export default function ProjectDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddService, setShowAddService] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const projects = await base44.entities.Project.list();
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject);

      const allServices = await base44.entities.Service.list();
      const projectServices = allServices.filter(s => s.project_id === projectId);
      setServices(projectServices);
    } catch (error) {
      console.error("Error loading project:", error);
    }
    setIsLoading(false);
  };

  const handleAddService = async (serviceData) => {
    try {
      await base44.entities.Service.create({
        ...serviceData,
        project_id: projectId,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
      });
      
      await base44.entities.Project.update(projectId, {
        services_count: (project.services_count || 0) + 1
      });
      
      setShowAddService(false);
      loadProjectData();
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleUpdateService = async (serviceId, updates) => {
    try {
      await base44.entities.Service.update(serviceId, updates);
      loadProjectData();
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await base44.entities.Service.delete(serviceId);
      
      await base44.entities.Project.update(projectId, {
        services_count: Math.max(0, (project.services_count || 1) - 1)
      });
      
      loadProjectData();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleSelectTemplate = async (template) => {
    try {
      await base44.entities.Service.create({
        project_id: projectId,
        name: template.name,
        description: template.description,
        icon: template.icon,
        category: template.category,
        technologies: template.default_technologies,
        apis: template.default_apis,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
      });
      
      await base44.entities.Project.update(projectId, {
        services_count: (project.services_count || 0) + 1
      });
      
      setShowTemplates(false);
      loadProjectData();
    } catch (error) {
      console.error("Error creating service from template:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Link to={createPageUrl("Projects")}>
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Projects")}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                {project.icon || "🏗️"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className="capitalize">{project.category}</Badge>
                  <Badge variant="outline" className="capitalize">{project.status}</Badge>
                  <span className="text-sm text-gray-500">{services.length} services</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTemplates(true)}
                variant="outline"
                className="border-blue-200 hover:bg-blue-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Templates
              </Button>
              <Button
                onClick={() => setShowAddService(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto min-w-full">
              <TabsTrigger value="visual"><Network className="w-4 h-4 mr-1" />Visual</TabsTrigger>
              <TabsTrigger value="list"><List className="w-4 h-4 mr-1" />Services</TabsTrigger>
              <TabsTrigger value="validate"><Sparkles className="w-4 h-4 mr-1" />Validate</TabsTrigger>
              <TabsTrigger value="dependencies"><Network className="w-4 h-4 mr-1" />Dependencies</TabsTrigger>
              <TabsTrigger value="refactor"><Sparkles className="w-4 h-4 mr-1" />Refactor</TabsTrigger>
              <TabsTrigger value="performance"><Zap className="w-4 h-4 mr-1" />Performance</TabsTrigger>
              <TabsTrigger value="documentation"><FileText className="w-4 h-4 mr-1" />Docs</TabsTrigger>
              <TabsTrigger value="rules"><BookOpen className="w-4 h-4 mr-1" />Rules</TabsTrigger>
              <TabsTrigger value="code-review"><Code2 className="w-4 h-4 mr-1" />Code Review</TabsTrigger>
              <TabsTrigger value="api-gen"><FileCode2 className="w-4 h-4 mr-1" />API Gen</TabsTrigger>
              <TabsTrigger value="cost"><DollarSign className="w-4 h-4 mr-1" />Cost</TabsTrigger>
              <TabsTrigger value="deps"><Package className="w-4 h-4 mr-1" />Deps</TabsTrigger>
              <TabsTrigger value="cicd"><GitBranch className="w-4 h-4 mr-1" />CI/CD</TabsTrigger>
              <TabsTrigger value="templates"><Layers className="w-4 h-4 mr-1" />Templates</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="visual"><VisualEditor services={services} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} /></TabsContent>
          <TabsContent value="list"><ServicesList services={services} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} /></TabsContent>
          <TabsContent value="validate"><AIValidator project={project} services={services} /></TabsContent>
          <TabsContent value="dependencies"><DependencyVisualizer project={project} services={services} /></TabsContent>
          <TabsContent value="refactor"><AIRefactor project={project} services={services} /></TabsContent>
          <TabsContent value="performance"><PerformanceMonitor project={project} /></TabsContent>
          <TabsContent value="documentation"><AIDocGenerator project={project} services={services} /></TabsContent>
          <TabsContent value="rules"><RuleManagement project={project} /></TabsContent>
          <TabsContent value="code-review"><AICodeReview project={project} services={services} /></TabsContent>
          <TabsContent value="api-gen"><APIGenerator project={project} services={services} /></TabsContent>
          <TabsContent value="cost"><CostOptimizer project={project} services={services} /></TabsContent>
          <TabsContent value="deps"><DependencyManager project={project} services={services} /></TabsContent>
          <TabsContent value="cicd"><CICDGenerator project={project} services={services} /></TabsContent>
          <TabsContent value="templates"><ProjectTemplateGallery onApplyTemplate={(t) => console.log('Apply template', t)} /></TabsContent>
        </Tabs>

        <AddServiceModal isOpen={showAddService} onClose={() => setShowAddService(false)} onSubmit={handleAddService} existingServices={services} />
        <ServiceTemplates isOpen={showTemplates} onClose={() => setShowTemplates(false)} onSelectTemplate={handleSelectTemplate} />
      </div>
    </div>
  );
}