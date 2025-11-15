import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import StatsOverview from "../components/dashboard/StatsOverview";
import RecentProjects from "../components/dashboard/RecentProjects";
import TrendingTechnologies from "../components/dashboard/TrendingTechnologies";
import SystemHealth from "../components/dashboard/SystemHealth";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, servicesData] = await Promise.all([
        base44.entities.Project.list('-created_date'),
        base44.entities.Service.list('-created_date')
      ]);
      
      setProjects(projectsData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const stats = {
    totalProjects: projects.length,
    totalServices: services.length,
    activeProjects: projects.filter(p => p.status !== 'archived').length,
    totalIntegrations: projects.reduce((sum, p) => sum + (p.integrations_count || 0), 0)
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Architecture Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Design and manage your microservices architectures
            </p>
          </div>
          <Link to={createPageUrl("Projects")}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </Link>
        </motion.div>

        <StatsOverview stats={stats} isLoading={isLoading} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentProjects 
              projects={projects} 
              services={services}
              isLoading={isLoading}
            />
          </div>

          <div className="space-y-6">
            <TrendingTechnologies services={services} isLoading={isLoading} />
            <SystemHealth stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}