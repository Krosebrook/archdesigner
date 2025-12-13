import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../shared/EmptyState";
import { SkeletonList } from "../shared/SkeletonLoader";
import DeleteConfirmDialog from "../shared/DeleteConfirmDialog";
import TaskEditModal from "./TaskEditModal";

const statusColors = {
  backlog: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700"
};

const priorityColors = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700"
};

export default function TaskManager({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Task.filter({ project_id: projectId });
      setTasks(data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    
    setIsDeleting(true);
    try {
      await base44.entities.Task.delete(deletingTask.id);
      toast.success("Task deleted successfully");
      setTasks(tasks.filter(t => t.id !== deletingTask.id));
      setDeletingTask(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <SkeletonList count={3} />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="No tasks yet"
        description="AI-generated tasks will appear here, or create one manually"
        actionLabel="Create Task"
        onAction={() => setEditingTask({})}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks ({tasks.length})</h3>
        <Button
          onClick={() => setEditingTask({})}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            layout
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold mb-2">
                      {task.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusColors[task.status]}>
                        {task.status}
                      </Badge>
                      {task.priority_level && (
                        <Badge className={priorityColors[task.priority_level]}>
                          {task.priority_level}
                        </Badge>
                      )}
                      {task.assigned_to && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assigned_to}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTask(task)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {task.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">{task.description}</p>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <TaskEditModal
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        projectId={projectId}
        onSuccess={loadTasks}
      />

      <DeleteConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Delete Task"
        itemName={deletingTask?.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}