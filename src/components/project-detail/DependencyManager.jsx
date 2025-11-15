import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2, Loader2, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";

const priorityColors = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800"
};

export default function DependencyManager({ project, services }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, [project?.id]);

  const loadAnalyses = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.DependencyManagement.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setAnalyses(data);
      if (data.length > 0) {
        setLatestAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Error loading dependency analyses:", error);
    }
    setIsLoading(false);
  };

  const analyzeDependencies = async () => {
    setIsAnalyzing(true);
    try {
      const servicesContext = services.map(s => `
Service: ${s.name}
Category: ${s.category}
Technologies: ${(s.technologies || []).join(', ')}
      `).join('\n');

      const prompt = `You are a dependency management expert. Analyze the technology stack for this microservices architecture and provide dependency recommendations.

PROJECT: ${project.name}
CATEGORY: ${project.category}

SERVICES & TECHNOLOGIES:
${servicesContext}

For each major technology/framework used, provide:
1. List of dependencies with current and latest versions
2. Count of outdated packages
3. Count of packages with security vulnerabilities
4. Specific update recommendations with:
   - Package name
   - Current and recommended version
   - Whether there are breaking changes
   - Migration steps if needed
   - Priority (critical/high/medium/low)

Be realistic about common packages for the mentioned technologies (e.g., React, Node.js, Python, etc.).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            dependencies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  current_version: { type: "string" },
                  latest_version: { type: "string" },
                  type: { type: "string" },
                  security_vulnerabilities: { type: "number" },
                  update_recommendation: { type: "string" }
                }
              }
            },
            outdated_count: { type: "number" },
            vulnerable_count: { type: "number" },
            update_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  package: { type: "string" },
                  from_version: { type: "string" },
                  to_version: { type: "string" },
                  breaking_changes: { type: "boolean" },
                  migration_steps: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      const newAnalysis = await base44.entities.DependencyManagement.create({
        project_id: project.id,
        dependencies: result.dependencies || [],
        outdated_count: result.outdated_count || 0,
        vulnerable_count: result.vulnerable_count || 0,
        update_recommendations: result.update_recommendations || []
      });

      setLatestAnalysis(newAnalysis);
      await loadAnalyses();
    } catch (error) {
      console.error("Error analyzing dependencies:", error);
    }
    setIsAnalyzing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            AI Dependency Management
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Automated dependency analysis, vulnerability detection, and update recommendations
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzeDependencies}
            disabled={isAnalyzing || services.length === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Dependencies...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Analyze Dependencies
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {latestAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {latestAnalysis.dependencies?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Total Dependencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-orange-600">
                      {latestAnalysis.outdated_count || 0}
                    </p>
                    <p className="text-sm text-gray-500">Outdated Packages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-600">
                      {latestAnalysis.vulnerable_count || 0}
                    </p>
                    <p className="text-sm text-gray-500">Vulnerabilities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {latestAnalysis.update_recommendations && latestAnalysis.update_recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Update Recommendations</h3>
              {latestAnalysis.update_recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-l-4 ${
                    rec.priority === 'critical' ? 'border-l-red-500' :
                    rec.priority === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{rec.package}</h4>
                          <p className="text-sm text-gray-600">
                            {rec.from_version} → {rec.to_version}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority}
                          </Badge>
                          {rec.breaking_changes && (
                            <Badge className="bg-red-100 text-red-800">
                              Breaking Changes
                            </Badge>
                          )}
                        </div>
                      </div>
                      {rec.migration_steps && (
                        <div className="bg-blue-50 rounded p-3 mt-2">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Migration Steps:</p>
                          <p className="text-xs text-blue-800">{rec.migration_steps}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {latestAnalysis.dependencies && latestAnalysis.dependencies.length > 0 && (
            <Card className="bg-white border-0">
              <CardHeader>
                <CardTitle className="text-lg">All Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {latestAnalysis.dependencies.map((dep, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{dep.name}</p>
                        <p className="text-xs text-gray-500">{dep.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {dep.current_version}
                        </Badge>
                        {dep.security_vulnerabilities > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {dep.security_vulnerabilities} CVE
                          </Badge>
                        )}
                        {dep.current_version !== dep.latest_version && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            {dep.latest_version} available
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}