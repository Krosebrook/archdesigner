import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, AlertTriangle, Code2 } from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import { CodeSmellDetector } from "./CodeSmellDetector";
import { RefactoringEngine } from "./RefactoringEngine";

export default function CodeRefactoringHub({ project, services }) {
  const [selectedSmell, setSelectedSmell] = useState(null);
  const [originalCode, setOriginalCode] = useState("");

  const handleRefactorRequest = (smell) => {
    setSelectedSmell(smell);
    setOriginalCode(smell.code_snippet || "");
  };

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={RefreshCw}
        title="AI Code Refactoring"
        description="Detect code smells, get intelligent refactoring suggestions, and generate production-ready improvements"
        gradient="from-slate-900 via-red-900 to-purple-900"
      />

      <Tabs defaultValue="detect">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detect">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Detect Smells
          </TabsTrigger>
          <TabsTrigger value="refactor" disabled={!selectedSmell && !originalCode}>
            <Code2 className="w-4 h-4 mr-2" />
            Refactor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detect">
          <CodeSmellDetector 
            project={project} 
            onRefactorRequest={handleRefactorRequest}
          />
        </TabsContent>

        <TabsContent value="refactor">
          {(selectedSmell || originalCode) && (
            <RefactoringEngine
              smell={selectedSmell}
              originalCode={originalCode}
              project={project}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}