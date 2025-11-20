import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export const MetricCard = ({ 
  icon: Icon, 
  value, 
  label, 
  gradient = "from-blue-50 to-cyan-50",
  borderColor = "border-blue-200",
  iconColor = "text-blue-900",
  valueColor = "text-blue-900",
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
    >
      <Card className={`bg-gradient-to-br ${gradient} border ${borderColor}`}>
        <CardContent className="p-6">
          <Icon className={`w-6 h-6 ${iconColor} mb-2`} />
          <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
          <div className="text-sm text-gray-600 mt-1">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const MetricGrid = ({ metrics, columns = 4 }) => {
  return (
    <div className={`grid md:grid-cols-${columns} gap-4`}>
      {metrics.map((metric, i) => (
        <MetricCard key={i} {...metric} delay={i * 0.1} />
      ))}
    </div>
  );
};