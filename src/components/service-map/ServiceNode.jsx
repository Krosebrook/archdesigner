import React from "react";
import { motion } from "framer-motion";
import { getHealthColor } from "../shared/HealthStatus";

export const ServiceNode = ({ 
  service, 
  position, 
  health, 
  cicd, 
  isSelected,
  onClick,
  index 
}) => {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        type: "spring", 
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer glow ring */}
      <circle
        cx={position.x}
        cy={position.y}
        r={isSelected ? 50 : 40}
        fill="none"
        stroke={health ? getHealthColor(health.status) : '#6b7280'}
        strokeWidth={isSelected ? 4 : 2}
        filter="url(#glow)"
        opacity={0.6}
      />
      
      {/* Main node */}
      <circle
        cx={position.x}
        cy={position.y}
        r={35}
        fill="white"
        stroke={health ? getHealthColor(health.status) : '#6b7280'}
        strokeWidth={3}
        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
      />

      {/* Health pulse for critical */}
      {health?.status === 'critical' && (
        <motion.circle
          cx={position.x}
          cy={position.y}
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
        x={position.x}
        y={position.y + 5}
        textAnchor="middle"
        fontSize="24"
        fill={health ? getHealthColor(health.status) : '#6b7280'}
      >
        {service.icon || '⚡'}
      </text>

      {/* Service name */}
      <text
        x={position.x}
        y={position.y + 55}
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
          cx={position.x + 25}
          cy={position.y - 25}
          r={8}
          fill={cicd.deploy_status === 'success' ? '#10b981' : 
                cicd.deploy_status === 'in_progress' ? '#3b82f6' : '#ef4444'}
          stroke="white"
          strokeWidth={2}
        />
      )}

      {/* Latency badge */}
      {health && (
        <text
          x={position.x}
          y={position.y + 70}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {health.latency}ms
        </text>
      )}
    </motion.g>
  );
};