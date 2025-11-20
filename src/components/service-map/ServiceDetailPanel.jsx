import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Activity, GitBranch, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { MetricCard } from "../shared/MetricCard";

export const ServiceDetailPanel = ({ service, health, cicd, onClose }) => {
  if (!service) {
    return (
      <Card className="shadow-xl h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Select a Service</h3>
          <p className="text-sm text-gray-600">
            Click on any service node to view detailed metrics and deployment status
          </p>
        </div>
      </Card>
    );
  }

  const metrics = health ? [
    { icon: Activity, value: `${health.latency}ms`, label: "Latency", gradient: "from-blue-50 to-cyan-50", borderColor: "border-blue-200", iconColor: "text-blue-600", valueColor: "text-blue-900" },
    { icon: Activity, value: `${health.uptime.toFixed(1)}%`, label: "Uptime", gradient: "from-green-50 to-emerald-50", borderColor: "border-green-200", iconColor: "text-green-600", valueColor: "text-green-900" },
    { icon: Activity, value: `${health.cpu}%`, label: "CPU", gradient: "from-purple-50 to-pink-50", borderColor: "border-purple-200", iconColor: "text-purple-600", valueColor: "text-purple-900" },
    { icon: Activity, value: `${health.memory}%`, label: "Memory", gradient: "from-orange-50 to-red-50", borderColor: "border-orange-200", iconColor: "text-orange-600", valueColor: "text-orange-900" }
  ] : [];

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-xl sticky top-4">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{service.icon || '⚡'}</div>
              <div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge className="mt-1">{service.category}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Health Metrics */}
          {health && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Health Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric, i) => (
                  <MetricCard key={i} {...metric} />
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requests/sec</span>
                  <span className="font-semibold text-gray-900">{health.requests_per_sec}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Error Rate</span>
                  <span className="font-semibold text-red-600">{health.error_rate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* CI/CD Status */}
          {cicd && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                Deployment Status
              </h3>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={
                    cicd.deploy_status === 'success' ? 'bg-green-600' :
                    cicd.deploy_status === 'in_progress' ? 'bg-blue-600' : 'bg-red-600'
                  }>
                    {cicd.deploy_status}
                  </Badge>
                  <span className="text-sm font-mono text-gray-700">{cicd.version}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-indigo-600" />
                    <span className="text-gray-600">Stage:</span>
                    <span className="font-medium text-gray-900">{cicd.pipeline_stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span className="text-gray-600">Last Deploy:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(cicd.last_deploy).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technologies */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {service.technologies?.map((tech, i) => (
                <Badge key={i} variant="outline">{tech}</Badge>
              ))}
            </div>
          </div>

          {/* APIs */}
          {service.apis?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Endpoints</h3>
              <div className="space-y-2">
                {service.apis.slice(0, 5).map((api, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 font-mono text-xs">
                    <Badge className="mr-2" variant="outline">{api.method}</Badge>
                    {api.path}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};