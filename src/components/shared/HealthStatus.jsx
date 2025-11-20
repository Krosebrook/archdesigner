import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const getHealthColor = (status) => {
  switch(status) {
    case 'healthy': return '#10b981';
    case 'warning': return '#f59e0b';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

export const getHealthBadge = (status) => {
  const config = {
    healthy: { icon: CheckCircle2, className: 'bg-green-600', label: 'Healthy' },
    warning: { icon: AlertTriangle, className: 'bg-yellow-600', label: 'Warning' },
    critical: { icon: XCircle, className: 'bg-red-600', label: 'Critical' },
  };
  
  return config[status] || config.healthy;
};

export const HealthStatusBadge = ({ status }) => {
  const { icon: Icon, className, label } = getHealthBadge(status);
  
  return (
    <Badge className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
};

export const HealthStatusIndicator = ({ status, size = 'md' }) => {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  
  return (
    <div 
      className={`${sizeMap[size]} rounded-full`}
      style={{ backgroundColor: getHealthColor(status) }}
    />
  );
};