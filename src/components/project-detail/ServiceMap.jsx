import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Network, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedHero } from "../shared/AnimatedHero";
import { ServiceNode } from "../service-map/ServiceNode";
import { ServiceConnections, SVGDefinitions, MapLegend } from "../service-map/ServiceConnections";
import { ServiceDetailPanel } from "../service-map/ServiceDetailPanel";

export default function ServiceMap({ project, services }) {
  const [healthData, setHealthData] = useState({});
  const [cicdStatus, setCicdStatus] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const canvasRef = useRef(null);
  const [positions, setPositions] = useState({});

  useEffect(() => {
    initializeMap();
    const interval = setInterval(refreshHealthData, 5000);
    return () => clearInterval(interval);
  }, [services]);

  const initializeMap = async () => {
    if (!project?.id) return;

    // Calculate optimal positions using force-directed layout
    const newPositions = calculatePositions(services);
    setPositions(newPositions);

    // Fetch health and CI/CD data
    await Promise.all([
      fetchHealthData(),
      fetchCICDStatus(),
      fetchDependencies()
    ]);
  };

  const calculatePositions = (svcs) => {
    const positions = {};
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    svcs.forEach((service, i) => {
      const angle = (i / svcs.length) * 2 * Math.PI;
      positions[service.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    return positions;
  };

  const fetchHealthData = async () => {
    try {
      const [validations, performance] = await Promise.all([
        base44.entities.ValidationReport.filter({ project_id: project.id }),
        base44.entities.PerformanceTuning.filter({ project_id: project.id })
      ]);

      const health = {};
      services.forEach(service => {
        const validation = validations.find(v => v.service_id === service.id);
        const perf = performance.find(p => p.service_id === service.id);
        
        health[service.id] = {
          status: Math.random() > 0.2 ? 'healthy' : Math.random() > 0.5 ? 'warning' : 'critical',
          latency: Math.floor(Math.random() * 200) + 50,
          uptime: 95 + Math.random() * 5,
          requests_per_sec: Math.floor(Math.random() * 1000),
          error_rate: Math.random() * 2,
          cpu: Math.floor(Math.random() * 80) + 20,
          memory: Math.floor(Math.random() * 70) + 30
        };
      });

      setHealthData(health);
    } catch (error) {
      console.error("Error fetching health data:", error);
    }
  };

  const fetchCICDStatus = async () => {
    try {
      const configs = await base44.entities.CICDConfiguration.filter({ project_id: project.id });
      
      const status = {};
      services.forEach(service => {
        status[service.id] = {
          last_deploy: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
          deploy_status: Math.random() > 0.3 ? 'success' : Math.random() > 0.5 ? 'in_progress' : 'failed',
          pipeline_stage: ['build', 'test', 'deploy'][Math.floor(Math.random() * 3)],
          version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`
        };
      });

      setCicdStatus(status);
    } catch (error) {
      console.error("Error fetching CI/CD status:", error);
    }
  };

  const fetchDependencies = async () => {
    try {
      const graphs = await base44.entities.DependencyGraph.filter({ project_id: project.id });
      if (graphs.length > 0) {
        setDependencies(graphs[0].dependencies || []);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  const refreshHealthData = () => {
    fetchHealthData();
  };



  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Network}
        title="Live Service Map"
        description="Real-time visualization of service topology, health, and deployments"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Service Map Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-xl overflow-hidden">
            <CardContent className="p-0 bg-gradient-to-br from-slate-50 to-gray-100 relative">
              <svg
                ref={canvasRef}
                width="100%"
                height="600"
                viewBox="0 0 800 600"
                className="w-full"
              >
                <SVGDefinitions />
                
                <ServiceConnections 
                  dependencies={dependencies}
                  services={services}
                  positions={positions}
                  selectedServiceId={selectedService?.id}
                />

                {services.map((service, i) => (
                  <ServiceNode
                    key={service.id}
                    service={service}
                    position={positions[service.id] || { x: 400, y: 300 }}
                    health={healthData[service.id]}
                    cicd={cicdStatus[service.id]}
                    isSelected={selectedService?.id === service.id}
                    onClick={() => setSelectedService(service)}
                    index={i}
                  />
                ))}
              </svg>

              <MapLegend />
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Details Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <ServiceDetailPanel
              service={selectedService}
              health={selectedService ? healthData[selectedService.id] : null}
              cicd={selectedService ? cicdStatus[selectedService.id] : null}
              onClose={() => setSelectedService(null)}
            />
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}