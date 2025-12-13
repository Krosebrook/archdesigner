import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import CinematicButton from "../components/shared/CinematicButton";
import StaggeredContainer from "../components/shared/StaggeredContainer";

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
    <div className="p-6 md:p-8 space-y-8 relative">
      {/* Golden hour lighting effect */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-400/20 via-pink-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.6
          }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12"
        >
          <div>
            <motion.h1 
              className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2"
              style={{ 
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Architecture Dashboard
            </motion.h1>
            <motion.p 
              className="text-gray-600 text-lg"
              style={{ lineHeight: 1.5 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Design and manage your microservices architectures
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <Link to={createPageUrl("Projects")}>
              <CinematicButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl">
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </CinematicButton>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
        >
          <StatsOverview stats={stats} isLoading={isLoading} />
        </motion.div>

        <StaggeredContainer staggerDelay={0.1} className="grid lg:grid-cols-3 gap-8">
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
        </StaggeredContainer>
        </div>
        </div>
        );
}