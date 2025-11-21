import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SecurityWidget() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFindings();
  }, []);

  const loadFindings = async () => {
    try {
      const data = await base44.entities.SecurityFinding.list('-created_date', 5);
      setFindings(data);
    } catch (error) {
      console.error("Error loading security findings:", error);
    }
    setLoading(false);
  };

  const critical = findings.filter(f => f.severity === 'critical').length;
  const open = findings.filter(f => f.status === 'open').length;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Security</h3>
          <p className="text-xs text-gray-500">Recent findings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{critical}</p>
              <p className="text-xs text-gray-600">Critical</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{open}</p>
              <p className="text-xs text-gray-600">Open</p>
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-auto">
            {findings.slice(0, 3).map(finding => (
              <div key={finding.id} className="border-l-4 border-red-600 pl-3 py-2 bg-red-50 rounded">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{finding.title}</p>
                  <Badge className={
                    finding.severity === 'critical' ? 'bg-red-600' :
                    finding.severity === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                  }>
                    {finding.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}