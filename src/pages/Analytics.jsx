import React, { useState, useEffect } from "react";
import { Project, Service } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import PortfolioHealthDashboard from "../components/analytics/PortfolioHealthDashboard";

export default function AnalyticsPage() {
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
        Project.list(),
        Service.list()
      ]);
      setProjects(projectsData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setIsLoading(false);
  };

  const getProjectsByCategory = () => {
    const categories = {};
    projects.forEach(project => {
      categories[project.category] = (categories[project.category] || 0) + 1;
    });
    return categories;
  };

  const getProjectsByStatus = () => {
    const statuses = {};
    projects.forEach(project => {
      statuses[project.status] = (statuses[project.status] || 0) + 1;
    });
    return statuses;
  };

  const getTechDistribution = () => {
    const techs = {};
    services.forEach(service => {
      if (service.technologies) {
        service.technologies.forEach(tech => {
          techs[tech] = (techs[tech] || 0) + 1;
        });
      }
    });
    return Object.entries(techs).sort(([,a], [,b]) => b - a).slice(0, 10);
  };

  const categoryData = getProjectsByCategory();
  const statusData = getProjectsByStatus();
  const techData = getTechDistribution();

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Portfolio Health Dashboard */}
        <PortfolioHealthDashboard />

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Detailed Analytics
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Deep dive into your microservices architecture metrics
          </p>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects by Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Projects by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(categoryData).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${
                            category === 'web' ? 'from-cyan-500 to-blue-600' :
                            category === 'mobile' ? 'from-pink-500 to-rose-600' :
                            category === 'desktop' ? 'from-indigo-500 to-purple-600' :
                            category === 'enterprise' ? 'from-emerald-500 to-green-600' :
                            category === 'ai' ? 'from-violet-500 to-purple-600' :
                            'from-orange-500 to-red-600'
                          }`} />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {category}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Projects by Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Projects by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(statusData).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            status === 'deployed' ? 'bg-green-500' :
                            status === 'development' ? 'bg-blue-500' :
                            status === 'testing' ? 'bg-purple-500' :
                            status === 'planning' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`} />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {status}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Technology Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Most Used Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Array(10).fill(0).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : techData.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No technology data available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {techData.map(([tech, count], index) => (
                      <div key={tech} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{tech}</span>
                          <span className="text-xs text-gray-500">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${
                              index === 0 ? 'from-blue-500 to-cyan-500' :
                              index === 1 ? 'from-purple-500 to-pink-500' :
                              index === 2 ? 'from-green-500 to-emerald-500' :
                              'from-orange-500 to-red-500'
                            }`}
                            style={{ 
                              width: `${(count / Math.max(...techData.map(([,c]) => c))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}