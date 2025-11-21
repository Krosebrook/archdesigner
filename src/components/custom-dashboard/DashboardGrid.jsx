import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SecurityWidget from "./widgets/SecurityWidget";
import APIWidget from "./widgets/APIWidget";
import TaskWidget from "./widgets/TaskWidget";
import CICDWidget from "./widgets/CICDWidget";
import HealthWidget from "./widgets/HealthWidget";
import ServicesWidget from "./widgets/ServicesWidget";
import RecentProjectsWidget from "./widgets/RecentProjectsWidget";

const WIDGET_COMPONENTS = {
  security: SecurityWidget,
  api: APIWidget,
  tasks: TaskWidget,
  cicd: CICDWidget,
  health: HealthWidget,
  services: ServicesWidget,
  recent_projects: RecentProjectsWidget
};

export default function DashboardGrid({ layout, setLayout, isEditing }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, servicesData] = await Promise.all([
        base44.entities.Project.list('-created_date'),
        base44.entities.Service.list('-created_date')
      ]);
      setProjects(projectsData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleDragStart = (e, widget) => {
    if (!isEditing) return;
    setDraggedItem(widget);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    if (!isEditing) return;
    e.preventDefault();
  };

  const handleDrop = (e, targetWidget) => {
    if (!isEditing || !draggedItem) return;
    e.preventDefault();

    const newLayout = layout.map(w => {
      if (w.id === draggedItem.id) {
        return { ...w, y: targetWidget.y };
      }
      if (w.id === targetWidget.id) {
        return { ...w, y: draggedItem.y };
      }
      return w;
    });

    setLayout(newLayout.sort((a, b) => a.y - b.y));
    setDraggedItem(null);
  };

  const removeWidget = (widgetId) => {
    setLayout(layout.filter(w => w.id !== widgetId));
  };

  const resizeWidget = (widgetId, delta) => {
    setLayout(layout.map(w => 
      w.id === widgetId 
        ? { ...w, width: Math.max(1, Math.min(4, w.width + delta)) }
        : w
    ));
  };

  const gridCols = 4;
  const gap = 6;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {layout.map((widget) => {
        const WidgetComponent = WIDGET_COMPONENTS[widget.type];
        if (!WidgetComponent) return null;

        return (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden
              ${isEditing ? 'ring-2 ring-blue-300 cursor-move' : ''}`}
            style={{
              gridColumn: `span ${widget.width}`,
              minHeight: `${widget.height * 150}px`
            }}
            draggable={isEditing}
            onDragStart={(e) => handleDragStart(e, widget)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget)}
          >
            {isEditing && (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resizeWidget(widget.id, -1)}
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                >
                  -
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resizeWidget(widget.id, 1)}
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeWidget(widget.id)}
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
            
            {isEditing && (
              <div className="absolute top-2 left-2 z-10">
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
            )}

            <WidgetComponent 
              projects={projects}
              services={services}
              config={widget.config}
            />
          </motion.div>
        );
      })}
    </div>
  );
}