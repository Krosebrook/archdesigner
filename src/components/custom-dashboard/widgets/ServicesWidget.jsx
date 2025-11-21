import React from "react";
import { Layers, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ServicesWidget({ services = [] }) {
  const categories = services.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Services</h3>
          <p className="text-xs text-gray-500">{services.length} total</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-indigo-600">{services.length}</p>
          <p className="text-xs text-gray-600">Services</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-600">{Object.keys(categories).length}</p>
          <p className="text-xs text-gray-600">Categories</p>
        </div>
      </div>

      <div className="space-y-2 flex-1 overflow-auto">
        {topCategories.map(([category, count]) => (
          <div key={category} className="border-l-4 border-indigo-600 pl-3 py-2 bg-indigo-50 rounded">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 capitalize">{category}</p>
              <Badge variant="outline">{count}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}