import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Server } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const statusColors = {
  planning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  development: "bg-blue-100 text-blue-800 border-blue-200",
  testing: "bg-purple-100 text-purple-800 border-purple-200",
  deployed: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200"
};

const categoryColors = {
  desktop: "bg-indigo-100 text-indigo-800",
  mobile: "bg-pink-100 text-pink-800",
  web: "bg-cyan-100 text-cyan-800",
  enterprise: "bg-emerald-100 text-emerald-800",
  ai: "bg-violet-100 text-violet-800",
  platform: "bg-orange-100 text-orange-800"
};

function RecentProjects({ projects = [], services = [], isLoading = false }) {
  const recentProjects = projects.slice(0, 6);
  
  const getProjectServiceCount = (projectId) => {
    return services.filter(s => s.project_id === projectId).length;
  };

  return (
    <Card className="bg-white shadow-md border-0">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Recent Projects
          </CardTitle>
          <Link to={createPageUrl("Projects")}>
            <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl animate-pulse">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link to={createPageUrl("Projects")}>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Create Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                    {project.icon || "🏗️"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={categoryColors[project.category] || "bg-gray-100 text-gray-800"}>
                        {project.category}
                      </Badge>
                      <Badge className={`${statusColors[project.status]} border`}>
                        {project.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Server className="w-3 h-3" />
                        {getProjectServiceCount(project.id)} services
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

RecentProjects.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string,
    status: PropTypes.string,
    icon: PropTypes.string
  })),
  services: PropTypes.arrayOf(PropTypes.shape({
    project_id: PropTypes.string
  })),
  isLoading: PropTypes.bool
};

export default RecentProjects;