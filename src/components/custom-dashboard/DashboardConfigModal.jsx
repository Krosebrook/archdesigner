import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Trash2 } from "lucide-react";

export default function DashboardConfigModal({ 
  isOpen, 
  onClose, 
  dashboards, 
  currentDashboard, 
  onSelect,
  onCreate,
  onUpdate
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await onCreate(newName);
    setNewName("");
    setCreating(false);
  };

  const setDefault = async (dashboard) => {
    try {
      await Promise.all([
        ...dashboards.map(d => 
          base44.entities.CustomDashboard.update(d.id, { is_default: false })
        ),
        base44.entities.CustomDashboard.update(dashboard.id, { is_default: true })
      ]);
      onUpdate();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const deleteDashboard = async (dashboard) => {
    if (dashboards.length === 1) return;
    try {
      await base44.entities.CustomDashboard.delete(dashboard.id);
      onUpdate();
    } catch (error) {
      console.error("Error deleting dashboard:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dashboard Configurations</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="New dashboard name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>

          <div className="space-y-2">
            {dashboards.map(dashboard => (
              <div
                key={dashboard.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  currentDashboard?.id === dashboard.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  onSelect(dashboard);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{dashboard.name}</h3>
                    {dashboard.is_default && (
                      <Badge className="bg-yellow-100 text-yellow-900">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {dashboard.layout?.length || 0} widgets
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    {!dashboard.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefault(dashboard);
                        }}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    {dashboards.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDashboard(dashboard);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}