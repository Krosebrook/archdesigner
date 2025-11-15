import { useState, useEffect } from "react";
import { Project, Service } from "@/entities/all";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus,
  ArrowRight,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

import StatsOverview from "../components/dashboard/StatsOverview";
import RecentProjects from "../components/dashboard/RecentProjects";
import TrendingTechnologies from "../components/dashboard/TrendingTechnologies";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalServices: 0,
    activeProjects: 0,
    totalIntegrations: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, servicesData] = await Promise.all([
        Project.list('-created_date'),
        Service.list('-created_date')
      ]);
      
      setProjects(projectsData);
      setServices(servicesData);
      
      // Calculate stats
      const activeProjects = projectsData.filter(p => p.status !== 'archived').length;
      const totalIntegrations = projectsData.reduce((sum, p) => sum + (p.integrations_count || 0), 0);
      
      setStats({
        totalProjects: projectsData.length,
        totalServices: servicesData.length,
        activeProjects,
        totalIntegrations
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Stats Overview */}
        <StatsOverview stats={stats} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <RecentProjects 
              projects={projects} 
              services={services}
              isLoading={isLoading}
            />
          </div>

          {/* Side Content */}
          <div className="space-y-6">
            <TrendingTechnologies services={services} isLoading={isLoading} />
            
            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Services</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {stats.totalServices} Running
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deployment Status</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    All Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">Just now</span>
                </div>
                <Link to={createPageUrl("Analytics")}>
                  <Button variant="outline" className="w-full mt-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                    View Analytics
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}