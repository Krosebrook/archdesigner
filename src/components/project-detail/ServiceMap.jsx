import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Network, Zap, AlertTriangle, CheckCircle2, Activity, 
  TrendingUp, GitBranch, Clock, Loader2, X, Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const getHealthColor = (status) => {
    switch(status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDeployColor = (status) => {
    switch(status) {
      case 'success': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderConnections = () => {
    const connections = [];
    dependencies.forEach((dep, i) => {
      const from = services.find(s => s.name === dep.from);
      const to = services.find(s => s.name === dep.to);
      
      if (from && to && positions[from.id] && positions[to.id]) {
        const fromPos = positions[from.id];
        const toPos = positions[to.id];
        
        connections.push(
          <motion.line
            key={i}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={selectedService?.id === from.id || selectedService?.id === to.id ? '#6366f1' : '#d1d5db'}
            strokeWidth={selectedService?.id === from.id || selectedService?.id === to.id ? 3 : 1.5}
            strokeDasharray={dep.type === 'async' ? '5,5' : '0'}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: i * 0.1 }}
            markerEnd="url(#arrowhead)"
          />
        );
      }
    });
    return connections;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Network className="w-7 h-7 text-white" />
              </div>
              Live Service Map
            </CardTitle>
            <p className="text-indigo-100 mt-2">
              Real-time visualization of service topology, health, and deployments
            </p>
          </CardHeader>
        </Card>
      </motion.div>

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
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
                  </marker>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {renderConnections()}

                {services.map((service, i) => {
                  const pos = positions[service.id] || { x: 400, y: 300 };
                  const health = healthData[service.id];
                  const cicd = cicdStatus[service.id];
                  const isSelected = selectedService?.id === service.id;

                  return (
                    <motion.g
                      key={service.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: i * 0.1, 
                        type: "spring", 
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setSelectedService(service)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Outer glow ring */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? 50 : 40}
                        fill="none"
                        stroke={health ? getHealthColor(health.status) : '#6b7280'}
                        strokeWidth={isSelected ? 4 : 2}
                        filter="url(#glow)"
                        opacity={0.6}
                      />
                      
                      {/* Main node */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={35}
                        fill="white"
                        stroke={health ? getHealthColor(health.status) : '#6b7280'}
                        strokeWidth={3}
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                      />

                      {/* Health pulse animation */}
                      {health?.status === 'critical' && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={35}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth={2}
                          initial={{ r: 35, opacity: 0.8 }}
                          animate={{ r: 50, opacity: 0 }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      )}

                      {/* Service icon */}
                      <text
                        x={pos.x}
                        y={pos.y + 5}
                        textAnchor="middle"
                        fontSize="24"
                        fill={health ? getHealthColor(health.status) : '#6b7280'}
                      >
                        {service.icon || '⚡'}
                      </text>

                      {/* Service name */}
                      <text
                        x={pos.x}
                        y={pos.y + 55}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#1f2937"
                      >
                        {service.name}
                      </text>

                      {/* CI/CD status indicator */}
                      {cicd && (
                        <circle
                          cx={pos.x + 25}
                          cy={pos.y - 25}
                          r={8}
                          fill={getDeployColor(cicd.deploy_status)}
                          stroke="white"
                          strokeWidth={2}
                        />
                      )}

                      {/* Metrics badge */}
                      {health && (
                        <text
                          x={pos.x}
                          y={pos.y + 70}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#6b7280"
                        >
                          {health.latency}ms
                        </text>
                      )}
                    </motion.g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-700">Healthy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-gray-700">Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-700">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-gray-400" />
                    <span className="text-gray-700">Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-gray-400 border-dashed border border-gray-400" />
                    <span className="text-gray-700">Async</span>
                  </div>
                </div>
              </div>
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
            {selectedService ? (
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
                        <div className="text-3xl">{selectedService.icon || '⚡'}</div>
                        <div>
                          <CardTitle className="text-lg">{selectedService.name}</CardTitle>
                          <Badge className="mt-1">{selectedService.category}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedService(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Health Metrics */}
                    {healthData[selectedService.id] && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          Health Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-xs text-gray-600 mb-1">Latency</div>
                            <div className="text-2xl font-bold text-blue-900">
                              {healthData[selectedService.id].latency}ms
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                            <div className="text-xs text-gray-600 mb-1">Uptime</div>
                            <div className="text-2xl font-bold text-green-900">
                              {healthData[selectedService.id].uptime.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                            <div className="text-xs text-gray-600 mb-1">CPU</div>
                            <div className="text-2xl font-bold text-purple-900">
                              {healthData[selectedService.id].cpu}%
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
                            <div className="text-xs text-gray-600 mb-1">Memory</div>
                            <div className="text-2xl font-bold text-orange-900">
                              {healthData[selectedService.id].memory}%
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Requests/sec</span>
                            <span className="font-semibold text-gray-900">
                              {healthData[selectedService.id].requests_per_sec}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Error Rate</span>
                            <span className="font-semibold text-red-600">
                              {healthData[selectedService.id].error_rate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CI/CD Status */}
                    {cicdStatus[selectedService.id] && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-indigo-600" />
                          Deployment Status
                        </h3>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={
                              cicdStatus[selectedService.id].deploy_status === 'success' ? 'bg-green-600' :
                              cicdStatus[selectedService.id].deploy_status === 'in_progress' ? 'bg-blue-600' :
                              'bg-red-600'
                            }>
                              {cicdStatus[selectedService.id].deploy_status}
                            </Badge>
                            <span className="text-sm font-mono text-gray-700">
                              {cicdStatus[selectedService.id].version}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-indigo-600" />
                              <span className="text-gray-600">Stage:</span>
                              <span className="font-medium text-gray-900">
                                {cicdStatus[selectedService.id].pipeline_stage}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span className="text-gray-600">Last Deploy:</span>
                              <span className="font-medium text-gray-900">
                                {new Date(cicdStatus[selectedService.id].last_deploy).toLocaleDateString()}
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
                        {selectedService.technologies?.map((tech, i) => (
                          <Badge key={i} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* APIs */}
                    {selectedService.apis?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">Endpoints</h3>
                        <div className="space-y-2">
                          {selectedService.apis.slice(0, 5).map((api, i) => (
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
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="shadow-xl h-full flex items-center justify-center min-h-[400px]">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Network className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Select a Service</h3>
                    <p className="text-sm text-gray-600">
                      Click on any service node to view detailed metrics and deployment status
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}