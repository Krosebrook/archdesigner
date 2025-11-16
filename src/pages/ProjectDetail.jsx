import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useProject } from "../components/shared/useProject";
import { tabConfig } from "../components/project-detail/ProjectTabs";
import ProjectHeader from "../components/project-detail/ProjectHeader";
import AddServiceModal from "../components/project-detail/AddServiceModal";
import ServiceTemplates from "../components/project-detail/ServiceTemplates";

export default function ProjectDetail() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const projectId = urlParams.get("id");

  const { project, services, isLoading, addService, updateService, deleteService, createFromTemplate } = useProject(projectId);
  const [showAddService, setShowAddService] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");

  const handleAddService = async (serviceData) => {
    await addService(serviceData);
    setShowAddService(false);
  };

  const handleSelectTemplate = async (template) => {
    await createFromTemplate(template);
    setShowTemplates(false);
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

  const componentProps = {
    project,
    services,
    onUpdateService: updateService,
    onDeleteService: deleteService
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ProjectHeader
          project={project}
          servicesCount={services.length}
          onAddService={() => setShowAddService(true)}
          onShowTemplates={() => setShowTemplates(true)}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto min-w-full gap-1 flex-wrap">
              {tabConfig.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <tab.icon className="w-4 h-4 mr-1" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tabConfig.map(tab => {
            const TabComponent = tab.component;
            const props = tab.props.reduce((acc, propName) => {
              if (componentProps[propName] !== undefined) {
                acc[propName] = componentProps[propName];
              }
              return acc;
            }, {});

            return (
              <TabsContent key={tab.id} value={tab.id}>
                <TabComponent {...props} />
              </TabsContent>
            );
          })}
        </Tabs>

        <AddServiceModal
          isOpen={showAddService}
          onClose={() => setShowAddService(false)}
          onSubmit={handleAddService}
          existingServices={services}
        />
        <ServiceTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    </div>
  );
}