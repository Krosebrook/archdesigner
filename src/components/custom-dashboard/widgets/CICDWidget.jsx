import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { GitBranch, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CICDWidget() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await base44.entities.CICDConfiguration.list('-created_date', 10);
      setConfigs(data);
    } catch (error) {
      console.error("Error loading CI/CD configs:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">CI/CD</h3>
          <p className="text-xs text-gray-500">{configs.length} pipelines</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : configs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-sm">No pipelines configured</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-auto">
          {configs.slice(0, 4).map(config => (
            <div key={config.id} className="border-l-4 border-purple-600 pl-3 py-2 bg-purple-50 rounded">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{config.platform}</p>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {config.deployment_targets?.length || 0} targets
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}