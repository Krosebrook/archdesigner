import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Shield, Code, Activity, Download } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import ErrorBoundary from "../shared/ErrorBoundary";
import { MetricsOverview } from "./MetricsOverview";
import { TrendForecasting } from "./TrendForecasting";
import { SecurityPosture } from "./SecurityPosture";
import { APIPerformance } from "./APIPerformance";
import { CustomReports } from "./CustomReports";

/**
 * AdvancedAnalyticsDashboard Component
 * 
 * Unified analytics dashboard integrating metrics from Security, API, CI/CD, and Task systems.
 * Provides comprehensive insights through:
 * - Real-time metrics overview
 * - AI-powered trend forecasting
 * - Security posture analysis
 * - API performance monitoring
 * - Custom report generation
 * 
 * @param {Object} props
 * @param {Object} props.project - The current project object
 * @param {Array} props.services - Array of services in the project
 */
export default function AdvancedAnalyticsDashboard({ project, services }) {
  const [analytics, setAnalytics] = useState({
    security: [],
    api: [],
    cicd: [],
    tasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAnalytics();
  }, [project.id]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [security, apiIntegrations, apiAnalytics, cicd, tasks] = await Promise.all([
        base44.entities.SecurityFinding.filter({ project_id: project.id }),
        base44.entities.APIIntegration.filter({ project_id: project.id }),
        base44.entities.APIAnalytics.list(),
        base44.entities.CICDConfiguration.filter({ project_id: project.id }),
        base44.entities.Task.filter({ project_id: project.id })
      ]);

      setAnalytics({
        security,
        api: { integrations: apiIntegrations, analytics: apiAnalytics.filter(a => 
          apiIntegrations.some(i => i.id === a.integration_id)
        )},
        cicd,
        tasks
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      setAnalytics({
        security: [],
        api: { integrations: [], analytics: [] },
        cicd: [],
        tasks: []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <AnimatedHero
          icon={BarChart3}
          title="Advanced Analytics Dashboard"
          description="Unified metrics, trend analysis, and forecasting across security, APIs, and CI/CD"
          gradient="from-slate-900 via-purple-900 to-indigo-900"
        />

        <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-100 to-blue-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Code className="w-4 h-4 mr-2" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Download className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MetricsOverview project={project} analytics={analytics} loading={loading} />
        </TabsContent>

        <TabsContent value="trends">
          <TrendForecasting project={project} analytics={analytics} services={services} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityPosture project={project} findings={analytics.security} />
        </TabsContent>

        <TabsContent value="api">
          <APIPerformance project={project} apiData={analytics.api} />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReports project={project} analytics={analytics} services={services} />
        </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}