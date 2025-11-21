import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Save, Layout } from "lucide-react";
import { motion } from "framer-motion";
import DashboardGrid from "../components/custom-dashboard/DashboardGrid";
import DashboardConfigModal from "../components/custom-dashboard/DashboardConfigModal";
import WidgetSelector from "../components/custom-dashboard/WidgetSelector";

export default function CustomDashboard() {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [layout, setLayout] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showWidgets, setShowWidgets] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.CustomDashboard.filter({ created_by: user.email });
      setDashboards(data);
      
      const defaultDb = data.find(d => d.is_default) || data[0];
      if (defaultDb) {
        setCurrentDashboard(defaultDb);
        setLayout(defaultDb.layout || []);
      }
    } catch (error) {
      console.error("Error loading dashboards:", error);
    }
    setLoading(false);
  };

  const saveDashboard = async () => {
    if (!currentDashboard) return;
    
    try {
      await base44.entities.CustomDashboard.update(currentDashboard.id, {
        layout
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving dashboard:", error);
    }
  };

  const createDashboard = async (name) => {
    try {
      const user = await base44.auth.me();
      const newDashboard = await base44.entities.CustomDashboard.create({
        name,
        layout: [],
        is_default: dashboards.length === 0,
        created_by: user.email
      });
      setDashboards([...dashboards, newDashboard]);
      setCurrentDashboard(newDashboard);
      setLayout([]);
      setShowConfig(false);
    } catch (error) {
      console.error("Error creating dashboard:", error);
    }
  };

  const addWidget = (widgetType) => {
    const newWidget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      x: 0,
      y: layout.length * 2,
      width: widgetType === 'health' ? 4 : 2,
      height: 2,
      config: {}
    };
    setLayout([...layout, newWidget]);
    setShowWidgets(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              {currentDashboard?.name || 'My Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              Customize your workspace with drag-and-drop widgets
            </p>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Layout className="w-4 h-4 mr-2" />
                  Edit Layout
                </Button>
                <Button onClick={() => setShowConfig(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setShowWidgets(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
                <Button onClick={saveDashboard} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {currentDashboard ? (
          <DashboardGrid 
            layout={layout}
            setLayout={setLayout}
            isEditing={isEditing}
          />
        ) : (
          <div className="text-center py-16">
            <Layout className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Dashboard Yet</h3>
            <p className="text-gray-600 mb-6">Create your first custom dashboard</p>
            <Button onClick={() => setShowConfig(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Dashboard
            </Button>
          </div>
        )}

        <DashboardConfigModal
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          dashboards={dashboards}
          currentDashboard={currentDashboard}
          onSelect={setCurrentDashboard}
          onCreate={createDashboard}
          onUpdate={loadDashboards}
        />

        <WidgetSelector
          isOpen={showWidgets}
          onClose={() => setShowWidgets(false)}
          onSelect={addWidget}
        />
      </div>
    </div>
  );
}