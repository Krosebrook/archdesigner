import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, TestTube, Rocket, Activity, Cloud, Code } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { PipelineAnalyzer } from "./PipelineAnalyzer";
import { FlakyTestDetector } from "./FlakyTestDetector";
import { DeploymentAdvisor } from "./DeploymentAdvisor";
import { SmartPipelineGenerator } from "./SmartPipelineGenerator";
import { CloudDeploymentEngine } from "./CloudDeploymentEngine";

export default function CICDIntelligenceHub({ project, services }) {
  const [cicdConfig, setCicdConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCICDConfig();
  }, [project.id]);

  const loadCICDConfig = async () => {
    setIsLoading(true);
    try {
      const configs = await base44.entities.CICDConfiguration.filter({ 
        project_id: project.id 
      });
      if (configs.length > 0) {
        setCicdConfig(configs[0]);
      }
    } catch (error) {
      console.error("Error loading CI/CD config:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Activity}
        title="CI/CD Intelligence Hub"
        description="AI-powered pipeline generation, cloud deployment, and automated security scanning"
        gradient="from-blue-900 via-indigo-900 to-purple-900"
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generate">
            <Code className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="deploy">
            <Cloud className="w-4 h-4 mr-2" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <Zap className="w-4 h-4 mr-2" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="tests">
            <TestTube className="w-4 h-4 mr-2" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="deployment">
            <Rocket className="w-4 h-4 mr-2" />
            Advisor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <SmartPipelineGenerator project={project} services={services} />
        </TabsContent>

        <TabsContent value="deploy">
          <CloudDeploymentEngine project={project} services={services} />
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineAnalyzer project={project} cicdConfig={cicdConfig} />
        </TabsContent>

        <TabsContent value="tests">
          <FlakyTestDetector project={project} />
        </TabsContent>

        <TabsContent value="deployment">
          <DeploymentAdvisor project={project} services={services} />
        </TabsContent>
      </Tabs>
    </div>
  );
}