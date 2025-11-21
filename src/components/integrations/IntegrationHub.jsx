import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, GitBranch, CheckSquare, Cloud, Plug } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { GitHubConnector } from "./GitHubConnector";
import { JiraConnector } from "./JiraConnector";
import { CloudProviderConnector } from "./CloudProviderConnector";

export default function IntegrationHub({ project }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, [project.id]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const conns = await base44.entities.IntegrationConnection.filter({ project_id: project.id });
      setConnections(conns);
    } catch (error) {
      console.error("Error loading connections:", error);
    }
    setLoading(false);
  };

  const handleUpdate = () => {
    loadConnections();
  };

  const getConnection = (type) => connections.find(c => c.integration_type === type);
  const getCloudConnections = () => connections.filter(c => ["aws", "azure", "gcp"].includes(c.integration_type));

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Plug}
        title="External Integrations"
        description="Connect Git repositories, issue trackers, and cloud providers for automated workflows"
        gradient="from-blue-900 via-indigo-900 to-purple-900"
      />

      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{connections.filter(c => c.status === 'connected').length}</div>
              <p className="text-sm text-gray-600">Active Connections</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{connections.filter(c => c.capabilities?.includes('security_scan')).length}</div>
              <p className="text-sm text-gray-600">Security Scanners</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{connections.filter(c => c.last_sync).length}</div>
              <p className="text-sm text-gray-600">Recently Synced</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="git">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="git">
            <Github className="w-4 h-4 mr-2" />
            Git Repos
            {getConnection('github') && <Badge className="ml-2 bg-green-100 text-green-800">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="issues">
            <CheckSquare className="w-4 h-4 mr-2" />
            Issue Tracking
            {getConnection('jira') && <Badge className="ml-2 bg-green-100 text-green-800">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="cloud">
            <Cloud className="w-4 h-4 mr-2" />
            Cloud Providers
            {getCloudConnections().length > 0 && <Badge className="ml-2 bg-green-100 text-green-800">{getCloudConnections().length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="git">
          <div className="space-y-4">
            <GitHubConnector 
              project={project} 
              connection={getConnection('github')} 
              onUpdate={handleUpdate}
            />
            
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center text-gray-500">
                <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">GitLab and Bitbucket coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-4">
            <JiraConnector 
              project={project} 
              connection={getConnection('jira')} 
              onUpdate={handleUpdate}
            />
            
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center text-gray-500">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Asana and Linear coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cloud">
          <CloudProviderConnector 
            project={project} 
            connections={getCloudConnections()} 
            onUpdate={handleUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}