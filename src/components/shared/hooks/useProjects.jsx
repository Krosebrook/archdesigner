import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Custom hook for managing project data and operations
 * Provides CRUD operations with loading states and error handling
 */
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await base44.entities.Project.list('-created_date');
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err.message || "Failed to load projects");
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData) => {
    try {
      const newProject = await base44.entities.Project.create(projectData);
      setProjects(prev => [newProject, ...prev]);
      toast.success("Project created successfully");
      return newProject;
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error("Failed to create project");
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (projectId, updates) => {
    try {
      const updated = await base44.entities.Project.update(projectId, updates);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updated } : p));
      toast.success("Project updated successfully");
      return updated;
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("Failed to update project");
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await base44.entities.Project.delete(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project");
      throw err;
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject
  };
}