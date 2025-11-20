import React from "react";
import { motion } from "framer-motion";

export const ServiceConnections = ({ dependencies, services, positions, selectedServiceId }) => {
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
          stroke={selectedServiceId === from.id || selectedServiceId === to.id ? '#6366f1' : '#d1d5db'}
          strokeWidth={selectedServiceId === from.id || selectedServiceId === to.id ? 3 : 1.5}
          strokeDasharray={dep.type === 'async' ? '5,5' : '0'}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: i * 0.1 }}
          markerEnd="url(#arrowhead)"
        />
      );
    }
  });
  
  return <>{connections}</>;
};

export const SVGDefinitions = () => (
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
);

export const MapLegend = () => (
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
);