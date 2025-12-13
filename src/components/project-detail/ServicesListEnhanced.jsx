import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Server, Search } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../shared/EmptyState";
import { SkeletonList } from "../shared/SkeletonLoader";
import SearchBar from "../shared/SearchBar";
import FilterDropdown from "../shared/FilterDropdown";
import DeleteConfirmDialog from "../shared/DeleteConfirmDialog";
import EditServiceModal from "./EditServiceModal";
import AddServiceModal from "./AddServiceModal";

const categoryColors = {
  api_gateway: "bg-blue-100 text-blue-700",
  authentication: "bg-purple-100 text-purple-700",
  business_logic: "bg-green-100 text-green-700",
  data_processing: "bg-yellow-100 text-yellow-700",
  messaging: "bg-pink-100 text-pink-700",
  storage: "bg-gray-100 text-gray-700",
  frontend: "bg-cyan-100 text-cyan-700",
  backend: "bg-indigo-100 text-indigo-700"
};

export default function ServicesListEnhanced({ projectId, onServicesChange }) {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadServices();
  }, [projectId]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Service.filter({ project_id: projectId });
      setServices(data || []);
      onServicesChange?.(data || []);
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    
    setIsDeleting(true);
    try {
      await base44.entities.Service.delete(deletingService.id);
      toast.success("Service deleted successfully");
      setServices(services.filter(s => s.id !== deletingService.id));
      setDeletingService(null);
      onServicesChange?.(services.filter(s => s.id !== deletingService.id));
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Failed to delete service");
    } finally {
      setIsDeleting(false);
    }
  };

  let filteredServices = services;

  if (searchQuery) {
    filteredServices = filteredServices.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (categoryFilter !== "all") {
    filteredServices = filteredServices.filter(s => s.category === categoryFilter);
  }

  if (isLoading) {
    return <SkeletonList count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Services ({services.length})</h3>
          <p className="text-sm text-gray-600">Manage your microservices</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search services..."
          className="flex-1"
        />
        <FilterDropdown
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          options={[
            { value: "api_gateway", label: "API Gateway" },
            { value: "authentication", label: "Authentication" },
            { value: "business_logic", label: "Business Logic" },
            { value: "data_processing", label: "Data Processing" },
            { value: "messaging", label: "Messaging" },
            { value: "storage", label: "Storage" },
            { value: "frontend", label: "Frontend" },
            { value: "backend", label: "Backend" }
          ]}
          placeholder="All Categories"
        />
      </div>

      {filteredServices.length === 0 ? (
        searchQuery || categoryFilter !== "all" ? (
          <EmptyState
            icon={Search}
            title="No services found"
            description="Try adjusting your search or filters"
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery("");
              setCategoryFilter("all");
            }}
          />
        ) : (
          <EmptyState
            icon={Server}
            title="No services yet"
            description="Add your first microservice to get started"
            actionLabel="Add Service"
            onAction={() => setShowAddModal(true)}
          />
        )
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold mb-2 flex items-center gap-2">
                        <Server className="w-4 h-4 text-gray-600" />
                        {service.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={categoryColors[service.category] || "bg-gray-100 text-gray-700"}>
                          {service.category}
                        </Badge>
                        {service.technologies?.map((tech, idx) => (
                          <Badge key={idx} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingService(service)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingService(service)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <AddServiceModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        projectId={projectId}
        onSuccess={loadServices}
      />

      <EditServiceModal
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        onSuccess={loadServices}
      />

      <DeleteConfirmDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
        title="Delete Service"
        description="This will permanently delete this service and all associated data."
        itemName={deletingService?.name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}