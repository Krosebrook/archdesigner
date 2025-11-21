import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

const severityColors = {
  critical: "bg-red-100 text-red-900 border-red-300",
  high: "bg-orange-100 text-orange-900 border-orange-300",
  medium: "bg-yellow-100 text-yellow-900 border-yellow-300",
  low: "bg-blue-100 text-blue-900 border-blue-300"
};

const statusIcons = {
  open: AlertTriangle,
  in_progress: Clock,
  resolved: CheckCircle2,
  false_positive: CheckCircle2
};

export const SecurityFindingsPanel = ({ project }) => {
  const [findings, setFindings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFindings();
  }, [project.id]);

  const loadFindings = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SecurityFinding.filter(
        { project_id: project.id },
        '-created_date'
      );
      setFindings(data);
    } catch (error) {
      console.error("Error loading findings:", error);
    }
    setLoading(false);
  };

  const updateStatus = async (findingId, newStatus) => {
    try {
      await base44.entities.SecurityFinding.update(findingId, { status: newStatus });
      loadFindings();
    } catch (error) {
      console.error("Error updating finding:", error);
    }
  };

  const filteredFindings = filter === "all" 
    ? findings 
    : findings.filter(f => f.severity === filter);

  const criticalCount = findings.filter(f => f.severity === "critical" && f.status === "open").length;
  const openCount = findings.filter(f => f.status === "open").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Security Findings
            {criticalCount > 0 && (
              <Badge className="bg-red-100 text-red-900">{criticalCount} Critical</Badge>
            )}
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({findings.length})</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading findings...</div>
        ) : filteredFindings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No security findings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFindings.map((finding, i) => {
              const StatusIcon = statusIcons[finding.status];
              return (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <StatusIcon className="w-5 h-5 mt-0.5 text-gray-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{finding.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={severityColors[finding.severity]}>
                            {finding.severity}
                          </Badge>
                          <Badge variant="outline">{finding.source}</Badge>
                          <Badge variant="outline">{finding.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">{finding.description}</p>
                  
                  {finding.remediation && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 mt-2 text-sm text-green-800">
                      <strong>Fix:</strong> {finding.remediation.substring(0, 150)}...
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {finding.status === "open" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus(finding.id, "in_progress")}
                      >
                        Start Work
                      </Button>
                    )}
                    {finding.status === "in_progress" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus(finding.id, "resolved")}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};