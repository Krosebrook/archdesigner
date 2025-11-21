import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TaskWidget() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await base44.entities.Task.list('-created_date', 10);
      setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
    setLoading(false);
  };

  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = ((completed / (tasks.length || 1)) * 100).toFixed(0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Tasks</h3>
          <p className="text-xs text-gray-500">{tasks.length} total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
              <p className="text-xs text-gray-600">In Progress</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-auto">
            {tasks.slice(0, 3).map(task => (
              <div key={task.id} className="border-l-4 border-green-600 pl-3 py-2 bg-green-50 rounded">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{task.title}</p>
                <Badge variant="outline" className="mt-1">
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}