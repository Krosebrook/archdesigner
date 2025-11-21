import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Code, CheckSquare, GitBranch, Activity, Layers, FolderKanban } from "lucide-react";

const WIDGET_TYPES = [
  { type: 'security', label: 'Security Findings', icon: Shield, color: 'red' },
  { type: 'api', label: 'API Performance', icon: Code, color: 'blue' },
  { type: 'tasks', label: 'Task Progress', icon: CheckSquare, color: 'green' },
  { type: 'cicd', label: 'CI/CD Status', icon: GitBranch, color: 'purple' },
  { type: 'health', label: 'Project Health', icon: Activity, color: 'orange' },
  { type: 'services', label: 'Services Overview', icon: Layers, color: 'indigo' },
  { type: 'recent_projects', label: 'Recent Projects', icon: FolderKanban, color: 'pink' }
];

export default function WidgetSelector({ isOpen, onClose, onSelect }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WIDGET_TYPES.map(widget => {
            const Icon = widget.icon;
            return (
              <Card
                key={widget.type}
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-400"
                onClick={() => onSelect(widget.type)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 bg-${widget.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-6 h-6 text-${widget.color}-600`} />
                  </div>
                  <p className="font-semibold">{widget.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}