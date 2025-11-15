import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowDown,
  PieChart
} from "lucide-react";
import { motion } from "framer-motion";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const effortColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800"
};

const priorityColors = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800"
};

export default function CostOptimizer({ project, services }) {
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
      const data = await base44.entities.CostAnalysis.filter(
        { project_id: project.id },
        '-created_date',
        10
      );
      setAnalyses(data);
      if (data.length > 0) {
        setLatestAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Error loading cost analyses:", error);
    }
    setIsLoading(false);
  };

  const runCostAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const servicesContext = services.map(s => `
Service: ${s.name} (${s.category})
Description: ${s.description}
Technologies: ${(s.technologies || []).join(', ')}
APIs: ${(s.apis || []).length} endpoints
Dependencies: ${(s.depends_on || []).length} other services
      `).join('\n');

      const prompt = `You are a cloud cost optimization expert. Analyze this microservices architecture and provide detailed cost estimates and optimization recommendations.

PROJECT: ${project.name}
DESCRIPTION: ${project.description}
CATEGORY: ${project.category}
TOTAL SERVICES: ${services.length}

SERVICES:
${servicesContext}

Provide:
1. Estimated monthly costs broken down by: compute, storage, network, database, other
2. Total estimated monthly cost
3. Potential monthly savings if optimizations are applied
4. Specific optimization recommendations with:
   - Title and description
   - Impact (low/medium/high)
   - Estimated savings in USD
   - Implementation effort (low/medium/high)
   - Priority (critical/high/medium/low)
5. Resource utilization insights:
   - Underutilized services
   - Overprovisioned resources
   - Idle resources

Be realistic with cost estimates based on typical AWS/GCP/Azure pricing for the described architecture.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_monthly_cost: { type: "number" },
            potential_savings: { type: "number" },
            cost_breakdown: {
              type: "object",
              properties: {
                compute: { type: "number" },
                storage: { type: "number" },
                network: { type: "number" },
                database: { type: "number" },
                other: { type: "number" }
              }
            },
            optimization_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  estimated_savings: { type: "number" },
                  effort: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            resource_utilization: {
              type: "object",
              properties: {
                underutilized_services: { type: "array", items: { type: "string" } },
                overprovisioned_resources: { type: "array", items: { type: "string" } },
                idle_resources: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      const newAnalysis = await base44.entities.CostAnalysis.create({
        project_id: project.id,
        estimated_monthly_cost: result.estimated_monthly_cost,
        potential_savings: result.potential_savings,
        cost_breakdown: result.cost_breakdown,
        optimization_recommendations: result.optimization_recommendations || [],
        resource_utilization: result.resource_utilization || {}
      });

      setLatestAnalysis(newAnalysis);
      await loadAnalyses();
    } catch (error) {
      console.error("Error running cost analysis:", error);
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

  const chartData = latestAnalysis?.cost_breakdown ? [
    { name: 'Compute', value: latestAnalysis.cost_breakdown.compute },
    { name: 'Storage', value: latestAnalysis.cost_breakdown.storage },
    { name: 'Network', value: latestAnalysis.cost_breakdown.network },
    { name: 'Database', value: latestAnalysis.cost_breakdown.database },
    { name: 'Other', value: latestAnalysis.cost_breakdown.other }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Cost & Resource Optimization
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered cost analysis and optimization recommendations
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runCostAnalysis}
            disabled={isAnalyzing || services.length === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Costs...
              </>
            ) : (
              <>
                <PieChart className="w-4 h-4 mr-2" />
                Run Cost Analysis
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
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Monthly Cost</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${latestAnalysis.estimated_monthly_cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Potential Savings</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${latestAnalysis.potential_savings.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ArrowDown className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Savings Potential</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {((latestAnalysis.potential_savings / latestAnalysis.estimated_monthly_cost) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Optimization Recommendations</h3>
            {latestAnalysis.optimization_recommendations && latestAnalysis.optimization_recommendations.length > 0 ? (
              latestAnalysis.optimization_recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-white border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <div className="flex gap-2">
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority}
                          </Badge>
                          <Badge className={effortColors[rec.effort]}>
                            {rec.effort} effort
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="font-semibold">${rec.estimated_savings}/mo savings</span>
                        </div>
                        <Badge variant="outline">{rec.impact} impact</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900">Optimal Configuration</h4>
                  <p className="text-sm text-green-700">Your architecture is already well-optimized!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {latestAnalysis.resource_utilization && (
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertCircle className="w-5 h-5" />
                  Resource Utilization Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestAnalysis.resource_utilization.underutilized_services?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-amber-900 mb-2">Underutilized Services</h5>
                    <div className="flex flex-wrap gap-2">
                      {latestAnalysis.resource_utilization.underutilized_services.map((service, i) => (
                        <Badge key={i} variant="outline" className="text-amber-800">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {latestAnalysis.resource_utilization.overprovisioned_resources?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-amber-900 mb-2">Overprovisioned Resources</h5>
                    <div className="flex flex-wrap gap-2">
                      {latestAnalysis.resource_utilization.overprovisioned_resources.map((resource, i) => (
                        <Badge key={i} variant="outline" className="text-amber-800">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}