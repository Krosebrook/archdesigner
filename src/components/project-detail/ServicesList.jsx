import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const categoryColors = {
  core: "bg-blue-100 text-blue-800",
  integration: "bg-purple-100 text-purple-800",
  storage: "bg-green-100 text-green-800",
  ai: "bg-pink-100 text-pink-800",
  analytics: "bg-orange-100 text-orange-800",
  security: "bg-red-100 text-red-800",
  ui: "bg-cyan-100 text-cyan-800"
};

export default function ServicesList({ services, onUpdateService, onDeleteService }) {
  if (services.length === 0) {
    return (
      <Card className="bg-white shadow-md border-0">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚙️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-500">Add services to start building your architecture</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service, index) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-white shadow-md border-0 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                    {service.icon || "⚙️"}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <p className="text-gray-600 mt-1">{service.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={categoryColors[service.category] || "bg-gray-100 text-gray-800"}>
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteService(service.id)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* APIs */}
                {service.apis && service.apis.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">🔌</span>
                      APIs ({service.apis.length})
                    </h4>
                    <div className="space-y-2">
                      {service.apis.map((api, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {api.method && (
                              <Badge variant="outline" className="text-xs">
                                {api.method}
                              </Badge>
                            )}
                            <code className="text-sm font-mono text-gray-900">
                              {api.endpoint}
                            </code>
                          </div>
                          {api.description && (
                            <p className="text-xs text-gray-600 mt-1">{api.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technologies */}
                {service.technologies && service.technologies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-purple-600">🛠️</span>
                      Technologies ({service.technologies.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {service.technologies.map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-sm">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {service.depends_on && service.depends_on.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-green-600">🔗</span>
                      Dependencies ({service.depends_on.length})
                    </h4>
                    <div className="space-y-1">
                      {service.depends_on.map((depId, i) => {
                        const depService = services.find(s => s.id === depId);
                        return (
                          <div key={i} className="text-sm text-gray-700 bg-green-50 rounded px-3 py-2">
                            {depService ? depService.name : 'Unknown Service'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}