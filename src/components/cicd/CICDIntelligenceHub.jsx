import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, TestTube, Rocket, Activity } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { PipelineAnalyzer } from "./PipelineAnalyzer";
import { FlakyTestDetector } from "./FlakyTestDetector";
import { DeploymentAdvisor } from "./DeploymentAdvisor";

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
        description="AI-powered analysis for pipeline optimization, test reliability, and deployment excellence"
        gradient="from-blue-900 via-indigo-900 to-purple-900"
      />

      <Tabs defaultValue="pipeline">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline">
            <Zap className="w-4 h-4 mr-2" />
            Pipeline Analysis
          </TabsTrigger>
          <TabsTrigger value="tests">
            <TestTube className="w-4 h-4 mr-2" />
            Test Health
          </TabsTrigger>
          <TabsTrigger value="deployment">
            <Rocket className="w-4 h-4 mr-2" />
            Deployment Strategy
          </TabsTrigger>
        </TabsList>

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