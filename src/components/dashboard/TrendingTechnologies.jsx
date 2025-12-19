import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

function TrendingTechnologies({ services = [], isLoading = false }) {
  const trendingTechs = useMemo(() => {
    const techCount = {};
    services.forEach(service => {
      if (service.technologies) {
        service.technologies.forEach(tech => {
          techCount[tech] = (techCount[tech] || 0) + 1;
        });
      }
    });
    
    return Object.entries(techCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);
  }, [services]);

  const techColors = [
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
    "bg-cyan-100 text-cyan-800",
    "bg-orange-100 text-orange-800"
  ];

  return (
    <Card className="bg-white shadow-md border-0">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Trending Technologies
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : trendingTechs.length === 0 ? (
          <p className="text-gray-500 text-sm">No technologies data yet</p>
        ) : (
          <div className="space-y-3">
            {trendingTechs.map(([tech, count], index) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-medium text-gray-700">{tech}</span>
                <Badge className={`${techColors[index % techColors.length]} text-xs`}>
                  {count}
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

TrendingTechnologies.propTypes = {
  services: PropTypes.arrayOf(PropTypes.shape({
    technologies: PropTypes.arrayOf(PropTypes.string)
  })),
  isLoading: PropTypes.bool
};

export default TrendingTechnologies;