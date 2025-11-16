import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const addService = async (serviceData) => {
    await base44.entities.Service.create({
      ...serviceData,
      project_id: projectId,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
    });
    
    await base44.entities.Project.update(projectId, {
      services_count: (project.services_count || 0) + 1
    });
    
    await loadProjectData();
  };

  const updateService = async (serviceId, updates) => {
    await base44.entities.Service.update(serviceId, updates);
    await loadProjectData();
  };

  const deleteService = async (serviceId) => {
    await base44.entities.Service.delete(serviceId);
    
    await base44.entities.Project.update(projectId, {
      services_count: Math.max(0, (project.services_count || 1) - 1)
    });
    
    await loadProjectData();
  };

  const createFromTemplate = async (template) => {
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
    
    await loadProjectData();
  };

  return {
    project,
    services,
    isLoading,
    addService,
    updateService,
    deleteService,
    createFromTemplate
  };
}