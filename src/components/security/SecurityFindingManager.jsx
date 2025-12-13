import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield, AlertTriangle, Edit2, Trash2, User, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../shared/EmptyState";
import { SkeletonList } from "../shared/SkeletonLoader";
import DeleteConfirmDialog from "../shared/DeleteConfirmDialog";

const severityColors = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200"
};

const statusColors = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  false_positive: "bg-gray-100 text-gray-700"
};

export default function SecurityFindingManager({ projectId }) {
  const [findings, setFindings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletingFinding, setDeletingFinding] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadFindings();
  }, [projectId]);

  const loadFindings = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.SecurityFinding.filter({ project_id: projectId });
      setFindings(data || []);
    } catch (error) {
      console.error("Failed to load findings:", error);
      toast.error("Failed to load security findings");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFindingStatus = async (findingId, newStatus) => {
    try {
      await base44.entities.SecurityFinding.update(findingId, { status: newStatus });
      toast.success("Finding status updated");
      loadFindings();
    } catch (error) {
      console.error("Failed to update finding:", error);
      toast.error("Failed to update finding");
    }
  };

  const assignFinding = async (findingId, assignedTo) => {
    try {
      await base44.entities.SecurityFinding.update(findingId, { assigned_to: assignedTo });
      toast.success("Finding assigned successfully");
      loadFindings();
    } catch (error) {
      console.error("Failed to assign finding:", error);
      toast.error("Failed to assign finding");
    }
  };

  const handleDelete = async () => {
    if (!deletingFinding) return;
    
    setIsDeleting(true);
    try {
      await base44.entities.SecurityFinding.delete(deletingFinding.id);
      toast.success("Finding deleted successfully");
      setFindings(findings.filter(f => f.id !== deletingFinding.id));
      setDeletingFinding(null);
    } catch (error) {
      console.error("Failed to delete finding:", error);
      toast.error("Failed to delete finding");
    } finally {
      setIsDeleting(false);
    }
  };

  let filteredFindings = findings;

  if (filterSeverity !== "all") {
    filteredFindings = filteredFindings.filter(f => f.severity === filterSeverity);
  }

  if (filterStatus !== "all") {
    filteredFindings = filteredFindings.filter(f => f.status === filterStatus);
  }

  if (isLoading) {
    return <SkeletonList count={3} />;
  }

  if (findings.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No security findings"
        description="All security checks passed! Your project is secure."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Findings ({findings.length})
          </h3>
          <p className="text-sm text-gray-600">Manage and track security vulnerabilities</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredFindings.map((finding) => (
          <motion.div
            key={finding.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            layout
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${finding.severity === 'critical' || finding.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <CardTitle className="text-base font-semibold">{finding.title}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{finding.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={`${severityColors[finding.severity]} border`}>
                        {finding.severity}
                      </Badge>
                      <Badge className={statusColors[finding.status]}>
                        {finding.status}
                      </Badge>
                      {finding.category && (
                        <Badge variant="outline">{finding.category}</Badge>
                      )}
                      {finding.cwe_id && (
                        <Badge variant="outline">CWE-{finding.cwe_id}</Badge>
                      )}
                    </div>

                    {finding.location && (
                      <p className="text-xs text-gray-500 mb-2">
                        <strong>Location:</strong> {finding.location}
                      </p>
                    )}

                    {finding.remediation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Remediation:</p>
                        <p className="text-xs text-blue-800">{finding.remediation}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Select
                        value={finding.status}
                        onValueChange={(value) => updateFindingStatus(finding.id, value)}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="false_positive">False Positive</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Assign to email..."
                        defaultValue={finding.assigned_to}
                        onBlur={(e) => {
                          if (e.target.value !== finding.assigned_to) {
                            assignFinding(finding.id, e.target.value);
                          }
                        }}
                        className="h-8 text-xs max-w-xs"
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingFinding(finding)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {filteredFindings.length === 0 && (filterSeverity !== "all" || filterStatus !== "all") && (
        <EmptyState
          icon={Filter}
          title="No findings match filters"
          description="Try adjusting your filters"
          actionLabel="Clear Filters"
          onAction={() => {
            setFilterSeverity("all");
            setFilterStatus("all");
          }}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletingFinding}
        onOpenChange={(open) => !open && setDeletingFinding(null)}
        title="Delete Security Finding"
        description="This will permanently remove this security finding from your records."
        itemName={deletingFinding?.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}