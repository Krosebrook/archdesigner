import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectHeader({ project, servicesCount, onAddService, onShowTemplates }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
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
              <span className="text-sm text-gray-500">{servicesCount} services</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onShowTemplates} variant="outline" className="border-blue-200 hover:bg-blue-50">
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={onAddService} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>
    </motion.div>
  );
}