import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus } from "lucide-react";
import { motion } from "framer-motion";

const builtInTemplates = [
  {
    name: "API Gateway",
    description: "Central entry point for all client requests with routing, authentication, and rate limiting",
    icon: "🚪",
    category: "core",
    default_technologies: ["Node.js", "Express", "JWT", "Redis", "NGINX"],
    default_apis: [
      { endpoint: "/api/*", method: "ANY", description: "Route all API requests" },
      { endpoint: "/health", method: "GET", description: "Health check endpoint" }
    ]
  },
  {
    name: "Authentication Service",
    description: "Handles user authentication, authorization, and session management",
    icon: "🔐",
    category: "security",
    default_technologies: ["Node.js", "JWT", "Passport", "PostgreSQL", "Redis"],
    default_apis: [
      { endpoint: "/auth/login", method: "POST", description: "User login" },
      { endpoint: "/auth/register", method: "POST", description: "User registration" },
      { endpoint: "/auth/refresh", method: "POST", description: "Refresh access token" },
      { endpoint: "/auth/logout", method: "POST", description: "User logout" },
      { endpoint: "/auth/verify", method: "GET", description: "Verify token" }
    ]
  },
  {
    name: "User Service",
    description: "Manages user profiles, preferences, and account information",
    icon: "👤",
    category: "core",
    default_technologies: ["Node.js", "PostgreSQL", "Redis", "S3"],
    default_apis: [
      { endpoint: "/users", method: "GET", description: "List users" },
      { endpoint: "/users/:id", method: "GET", description: "Get user by ID" },
      { endpoint: "/users", method: "POST", description: "Create user" },
      { endpoint: "/users/:id", method: "PUT", description: "Update user" },
      { endpoint: "/users/:id", method: "DELETE", description: "Delete user" }
    ]
  },
  {
    name: "Message Queue",
    description: "Asynchronous message processing for event-driven architecture",
    icon: "📬",
    category: "integration",
    default_technologies: ["RabbitMQ", "Kafka", "Redis"],
    default_apis: [
      { endpoint: "/queue/publish", method: "POST", description: "Publish message" },
      { endpoint: "/queue/subscribe", method: "POST", description: "Subscribe to topic" }
    ]
  },
  {
    name: "Cache Layer",
    description: "Distributed caching service for performance optimization",
    icon: "⚡",
    category: "storage",
    default_technologies: ["Redis", "Memcached"],
    default_apis: [
      { endpoint: "/cache/get/:key", method: "GET", description: "Get cached value" },
      { endpoint: "/cache/set", method: "POST", description: "Set cache value" },
      { endpoint: "/cache/delete/:key", method: "DELETE", description: "Delete cached value" },
      { endpoint: "/cache/flush", method: "POST", description: "Flush all cache" }
    ]
  },
  {
    name: "Database Service",
    description: "Primary data persistence layer with CRUD operations",
    icon: "💾",
    category: "storage",
    default_technologies: ["PostgreSQL", "MongoDB", "MySQL"],
    default_apis: [
      { endpoint: "/db/health", method: "GET", description: "Database health check" },
      { endpoint: "/db/migrate", method: "POST", description: "Run migrations" }
    ]
  },
  {
    name: "Notification Service",
    description: "Multi-channel notification delivery (email, SMS, push)",
    icon: "📧",
    category: "integration",
    default_technologies: ["Node.js", "SendGrid", "Twilio", "Firebase"],
    default_apis: [
      { endpoint: "/notifications/send", method: "POST", description: "Send notification" },
      { endpoint: "/notifications/templates", method: "GET", description: "Get templates" },
      { endpoint: "/notifications/preferences", method: "PUT", description: "Update preferences" }
    ]
  },
  {
    name: "Analytics Service",
    description: "Data collection and analysis for business intelligence",
    icon: "📊",
    category: "analytics",
    default_technologies: ["Python", "pandas", "PostgreSQL", "Redis"],
    default_apis: [
      { endpoint: "/analytics/track", method: "POST", description: "Track event" },
      { endpoint: "/analytics/reports", method: "GET", description: "Generate report" },
      { endpoint: "/analytics/metrics", method: "GET", description: "Get metrics" }
    ]
  },
  {
    name: "Payment Service",
    description: "Secure payment processing and transaction management",
    icon: "💳",
    category: "integration",
    default_technologies: ["Node.js", "Stripe", "PostgreSQL", "PCI DSS"],
    default_apis: [
      { endpoint: "/payments/charge", method: "POST", description: "Process payment" },
      { endpoint: "/payments/refund", method: "POST", description: "Refund transaction" },
      { endpoint: "/payments/webhooks", method: "POST", description: "Payment webhooks" }
    ]
  },
  {
    name: "Search Service",
    description: "Full-text search and indexing service",
    icon: "🔍",
    category: "core",
    default_technologies: ["Elasticsearch", "Logstash", "Kibana"],
    default_apis: [
      { endpoint: "/search", method: "GET", description: "Search query" },
      { endpoint: "/search/index", method: "POST", description: "Index document" },
      { endpoint: "/search/suggest", method: "GET", description: "Auto-suggest" }
    ]
  },
  {
    name: "File Storage Service",
    description: "Secure file upload, storage, and retrieval",
    icon: "📁",
    category: "storage",
    default_technologies: ["Node.js", "S3", "CloudFront", "ImageMagick"],
    default_apis: [
      { endpoint: "/files/upload", method: "POST", description: "Upload file" },
      { endpoint: "/files/:id", method: "GET", description: "Download file" },
      { endpoint: "/files/:id", method: "DELETE", description: "Delete file" }
    ]
  },
  {
    name: "Logging Service",
    description: "Centralized logging and monitoring",
    icon: "📝",
    category: "core",
    default_technologies: ["ELK Stack", "Fluentd", "Grafana"],
    default_apis: [
      { endpoint: "/logs/push", method: "POST", description: "Push log entry" },
      { endpoint: "/logs/query", method: "GET", description: "Query logs" }
    ]
  }
];

export default function ServiceTemplates({ isOpen, onClose, onSelectTemplate }) {
  const [templates, setTemplates] = useState(builtInTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "core", "security", "storage", "integration", "analytics"];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Service Templates
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            Choose from common microservice patterns to quickly scaffold your architecture
          </p>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  {/* Technologies */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.default_technologies.slice(0, 3).map((tech, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {template.default_technologies.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.default_technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* APIs */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      {template.default_apis.length} API Endpoints
                    </p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No templates found matching your criteria.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}