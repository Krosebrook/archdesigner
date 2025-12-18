import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Database, 
  Zap, 
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PropTypes from "prop-types";
import EditProjectModal from "./EditProjectModal";
import DeleteConfirmDialog from "../shared/DeleteConfirmDialog";

const statusColors = {
  planning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  development: "bg-blue-100 text-blue-800 border-blue-200",
  testing: "bg-purple-100 text-purple-800 border-purple-200",
  deployed: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200"
};

const categoryGradients = {
  desktop: "from-indigo-500 to-purple-600",
  mobile: "from-pink-500 to-rose-600",
  web: "from-cyan-500 to-blue-600",
  enterprise: "from-emerald-500 to-green-600",
  ai: "from-violet-500 to-purple-600",
  platform: "from-orange-500 to-red-600"
};

function ProjectCard({ project, index = 0, onUpdate }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async (e) => {
    e.stopPropagation();
    try {
      const [services, tasks, cicd] = await Promise.all([
        base44.entities.Service.filter({ project_id: project.id }),
        base44.entities.Task.filter({ project_id: project.id }),
        base44.entities.CICDConfiguration.filter({ project_id: project.id })
      ]);

      const exportData = {
        project,
        services,
        tasks,
        cicd,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Project exported successfully");
    } catch (error) {
      console.error("Failed to export project:", error);
      toast.error("Failed to export project");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await base44.entities.Project.delete(project.id);
      toast.success("Project deleted successfully");
      onUpdate?.();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -4 }}
      >
        <Card className="group bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
          {/* Header with gradient */}
          <div className={`h-24 bg-gradient-to-r ${categoryGradients[project.category] || 'from-gray-500 to-gray-600'} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black bg-opacity-20" />
            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        <CardHeader className="relative -mt-8 px-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl border border-gray-100">
              {project.icon || "🏗️"}
            </div>
            <Badge className={`${statusColors[project.status]} border mt-2`}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
            {project.name}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
            {project.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-1">
                <Server className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Services</span>
              <p className="text-sm font-semibold text-gray-900">{project.services_count || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-1">
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">DBs</span>
              <p className="text-sm font-semibold text-gray-900">{project.databases_count || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-1">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">APIs</span>
              <p className="text-sm font-semibold text-gray-900">{project.integrations_count || 0}</p>
            </div>
          </div>

          {/* Category and Action */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {project.category}
            </Badge>
            <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group-hover:shadow-lg transition-all duration-200"
              >
                View
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>

    <EditProjectModal
      open={showEditModal}
      onOpenChange={setShowEditModal}
      project={project}
      onSuccess={onUpdate}
    />

    <DeleteConfirmDialog
      open={showDeleteDialog}
      onOpenChange={setShowDeleteDialog}
      title="Delete Project"
      description="This will permanently delete this project and all associated services, tasks, and configurations."
      itemName={project.name}
      onConfirm={handleDelete}
      isDeleting={isDeleting}
    />
    </>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    icon: PropTypes.string,
    services_count: PropTypes.number,
    databases_count: PropTypes.number,
    integrations_count: PropTypes.number
  }).isRequired,
  index: PropTypes.number,
  onUpdate: PropTypes.func
};

export default ProjectCard;