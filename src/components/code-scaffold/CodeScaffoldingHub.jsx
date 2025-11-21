import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Lightbulb, BookTemplate, Rocket } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { SnippetGenerator } from "./SnippetGenerator";
import { PatternSuggestions } from "./PatternSuggestions";
import { TemplateLibrary } from "./TemplateLibrary";
import ServiceScaffoldGenerator from "../project-detail/ServiceScaffoldGenerator";

export default function CodeScaffoldingHub({ project, services }) {
  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Code}
        title="AI Code Scaffolding"
        description="Generate production-ready code, patterns, and full service templates with AI assistance"
        gradient="from-slate-900 via-purple-900 to-indigo-900"
      />

      <Tabs defaultValue="snippets">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="snippets">
            <Code className="w-4 h-4 mr-2" />
            Snippets
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Lightbulb className="w-4 h-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="templates">
            <BookTemplate className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="scaffold">
            <Rocket className="w-4 h-4 mr-2" />
            Full Scaffold
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snippets">
          <SnippetGenerator project={project} services={services} />
        </TabsContent>

        <TabsContent value="patterns">
          <PatternSuggestions project={project} services={services} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateLibrary project={project} />
        </TabsContent>

        <TabsContent value="scaffold">
          <ServiceScaffoldGenerator project={project} services={services} />
        </TabsContent>
      </Tabs>
    </div>
  );
}