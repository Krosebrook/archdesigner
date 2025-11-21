import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Code, TrendingUp, Activity } from "lucide-react";

export default function APIWidget() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAPIs();
  }, []);

  const loadAPIs = async () => {
    try {
      const data = await base44.entities.APIIntegration.list('-created_date', 10);
      setApis(data);
    } catch (error) {
      console.error("Error loading APIs:", error);
    }
    setLoading(false);
  };

  const avgResponseTime = apis.reduce((sum, api) => 
    sum + (api.metrics?.avg_response_time || 0), 0) / (apis.length || 1);
  
  const successRate = apis.reduce((sum, api) => 
    sum + (api.metrics?.success_rate || 100), 0) / (apis.length || 1);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Code className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">API Performance</h3>
          <p className="text-xs text-gray-500">{apis.length} integrations</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{avgResponseTime.toFixed(0)}ms</p>
              <p className="text-xs text-gray-600">Avg Response</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">Success Rate</p>
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-auto">
            {apis.slice(0, 3).map(api => (
              <div key={api.id} className="border-l-4 border-blue-600 pl-3 py-2 bg-blue-50 rounded">
                <p className="text-sm font-medium text-gray-900">{api.name}</p>
                <p className="text-xs text-gray-600">
                  {api.metrics?.total_requests || 0} requests
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}