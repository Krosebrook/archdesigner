import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode2, FileText, GitBranch, BookOpen } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { APIDocGenerator } from "./APIDocGenerator";
import { ServiceDocumenter } from "./ServiceDocumenter";
import { ChangelogGenerator } from "./ChangelogGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentationIntelligenceHub({ project, services }) {
  const [selectedService, setSelectedService] = useState(services[0] || null);

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={BookOpen}
        title="Documentation Intelligence"
        description="AI-powered automatic documentation generation and maintenance for APIs, services, and changes"
        gradient="from-indigo-900 via-purple-900 to-pink-900"
      />

      <Tabs defaultValue="api">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">
            <FileCode2 className="w-4 h-4 mr-2" />
            API Docs
          </TabsTrigger>
          <TabsTrigger value="services">
            <FileText className="w-4 h-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="changelog">
            <GitBranch className="w-4 h-4 mr-2" />
            Changelog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          {services.length > 0 ? (
            <>
              <Card className="mb-6">
                <CardContent className="p-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Select Service
                  </label>
                  <Select 
                    value={selectedService?.id} 
                    onValueChange={(id) => setSelectedService(services.find(s => s.id === id))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              {selectedService && (
                <APIDocGenerator service={selectedService} project={project} />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileCode2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Add services to generate API documentation</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services">
          <ServiceDocumenter project={project} services={services} />
        </TabsContent>

        <TabsContent value="changelog">
          <ChangelogGenerator project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}