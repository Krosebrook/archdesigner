import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Server, TrendingUp, Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const statItems = [
  {
    title: "Total Projects",
    icon: Building2,
    gradient: "from-blue-500 to-cyan-500",
    bg: "from-blue-50 to-cyan-50",
    key: "totalProjects"
  },
  {
    title: "Active Services",
    icon: Server,
    gradient: "from-purple-500 to-pink-500",
    bg: "from-purple-50 to-pink-50",
    key: "totalServices"
  },
  {
    title: "In Development",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
    bg: "from-green-50 to-emerald-50",
    key: "activeProjects"
  },
  {
    title: "Integrations",
    icon: Database,
    gradient: "from-orange-500 to-red-500",
    bg: "from-orange-50 to-red-50",
    key: "totalIntegrations"
  }
];

function StatsOverview({ stats = {}, isLoading = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-300 border-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} opacity-40`} />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {item.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {stats[item.key]}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {!isLoading && (
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+12% this month</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

StatsOverview.propTypes = {
  stats: PropTypes.shape({
    totalProjects: PropTypes.number,
    totalServices: PropTypes.number,
    activeProjects: PropTypes.number,
    totalIntegrations: PropTypes.number
  }),
  isLoading: PropTypes.bool
};

export default StatsOverview;