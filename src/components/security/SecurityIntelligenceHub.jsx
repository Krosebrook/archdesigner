import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Code, GitBranch, Rocket } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { VulnerabilityScanner } from "./VulnerabilityScanner";
import { CICDSecurityAuditor } from "./CICDSecurityAuditor";
import { DeploymentSecurityAnalyzer } from "./DeploymentSecurityAnalyzer";
import { SecurityFindingsPanel } from "../integrations/SecurityFindingsPanel";

export default function SecurityIntelligenceHub({ project, services }) {
  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Shield}
        title="Security Intelligence Hub"
        description="AI-powered vulnerability scanning, CI/CD auditing, and deployment security analysis"
        gradient="from-red-900 via-orange-900 to-yellow-900"
      />

      <SecurityFindingsPanel project={project} />

      <Tabs defaultValue="vulnerabilities" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vulnerabilities">
            <Code className="w-4 h-4 mr-2" />
            Code Scan
          </TabsTrigger>
          <TabsTrigger value="cicd">
            <GitBranch className="w-4 h-4 mr-2" />
            CI/CD Audit
          </TabsTrigger>
          <TabsTrigger value="deployment">
            <Rocket className="w-4 h-4 mr-2" />
            Deployment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities">
          <VulnerabilityScanner project={project} />
        </TabsContent>

        <TabsContent value="cicd">
          <CICDSecurityAuditor project={project} />
        </TabsContent>

        <TabsContent value="deployment">
          <DeploymentSecurityAnalyzer project={project} services={services} />
        </TabsContent>
      </Tabs>
    </div>
  );
}