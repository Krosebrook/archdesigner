import React from "react";
import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RecentProjectsWidget({ projects = [] }) {
  const statusColors = {
    planning: "bg-gray-100 text-gray-800",
    development: "bg-blue-100 text-blue-800",
    testing: "bg-yellow-100 text-yellow-800",
    deployed: "bg-green-100 text-green-800",
    archived: "bg-red-100 text-red-800"
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Recent Projects</h3>
          <p className="text-xs text-gray-500">{projects.length} total</p>
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-auto">
        {projects.slice(0, 5).map(project => (
          <div key={project.id} className="border-l-4 border-pink-600 pl-3 py-2 bg-pink-50 rounded">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                <p className="text-xs text-gray-600 mt-1">{project.services_count || 0} services</p>
              </div>
              <Badge className={statusColors[project.status] || 'bg-gray-100'}>
                {project.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}