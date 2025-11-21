import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, TrendingUp } from "lucide-react";

export default function HealthWidget({ projects }) {
  const [analytics, setAnalytics] = useState({ security: [], tasks: [], apis: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [security, tasks, apis] = await Promise.all([
        base44.entities.SecurityFinding.list(),
        base44.entities.Task.list(),
        base44.entities.APIIntegration.list()
      ]);
      setAnalytics({ security, tasks, apis });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setLoading(false);
  };

  const healthScore = Math.round(
    ((analytics.security.filter(f => f.status === 'resolved').length / (analytics.security.length || 1)) * 30) +
    ((analytics.apis.filter(a => a.status === 'active').length / (analytics.apis.length || 1)) * 30) +
    ((analytics.tasks.filter(t => t.status === 'completed').length / (analytics.tasks.length || 1)) * 40)
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">System Health</h3>
          <p className="text-xs text-gray-500">Overall status</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - healthScore / 100)}`}
                className="text-gradient-to-r from-orange-600 to-red-600"
                style={{ stroke: healthScore > 70 ? '#10b981' : healthScore > 50 ? '#f59e0b' : '#ef4444' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{healthScore}</span>
              <span className="text-xs text-gray-600">Health Score</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>+12% this week</span>
          </div>
        </div>
      )}
    </div>
  );
}