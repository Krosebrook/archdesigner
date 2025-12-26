import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

import ProjectInfoStep from "./steps/ProjectInfoStep";
import ArchitectureStep from "./steps/ArchitectureStep";
import ServicesStep from "./steps/ServicesStep";
import CICDStep from "./steps/CICDStep";
import DocumentationStep from "./steps/DocumentationStep";
import ReviewStep from "./steps/ReviewStep";

const STEPS = [
  { id: "info", label: "Project Info", component: ProjectInfoStep },
  { id: "architecture", label: "Architecture", component: ArchitectureStep },
  { id: "services", label: "Services", component: ServicesStep },
  { id: "cicd", label: "CI/CD Setup", component: CICDStep },
  { id: "docs", label: "Documentation", component: DocumentationStep },
  { id: "review", label: "Review & Launch", component: ReviewStep }
];

export default function AIOnboardingWizard({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wizardData, setWizardData] = useState({
    projectInfo: {},
    architecture: {},
    services: [],
    cicdConfig: {},
    documentation: []
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep].component;

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData) => {
    const stepId = STEPS[currentStep].id;
    setWizardData(prev => ({
      ...prev,
      [stepId === "info" ? "projectInfo" : 
        stepId === "architecture" ? "architecture" :
        stepId === "services" ? "services" :
        stepId === "cicd" ? "cicdConfig" : "documentation"]: stepData
    }));
  };

  const handleComplete = async () => {
    setIsGenerating(true);
    try {
      // Create project
      const project = await base44.entities.Project.create({
        name: wizardData.projectInfo.name,
        description: wizardData.projectInfo.description,
        category: wizardData.projectInfo.category,
        status: "planning",
        icon: wizardData.projectInfo.icon,
        architecture_pattern: wizardData.architecture.pattern,
        tech_stack: wizardData.architecture.technologies
      });

      // Create services with boilerplate code
      const servicePromises = wizardData.services.map((service, index) =>
        base44.entities.Service.create({
          project_id: project.id,
          name: service.name,
          description: service.description,
          category: service.category,
          technologies: service.technologies || [],
          boilerplate_code: service.boilerplate_code,
          dockerfile: service.dockerfile,
          database_schema: service.database_schema,
          apis: service.endpoints || [],
          position: { x: 150 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 250 }
        })
      );
      await Promise.all(servicePromises);

      // Create CI/CD configuration
      if (wizardData.cicdConfig.enabled) {
        await base44.entities.CICDConfiguration.create({
          project_id: project.id,
          platform: wizardData.cicdConfig.platform,
          pipeline_config: wizardData.cicdConfig.config,
          pipeline_stages: wizardData.cicdConfig.stages,
          dockerfile: wizardData.cicdConfig.dockerfile,
          docker_compose: wizardData.cicdConfig.dockerCompose
        });
      }

      // Populate knowledge base
      const docPromises = wizardData.documentation.map(doc =>
        base44.entities.KnowledgeBase.create({
          project_id: project.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          tags: doc.tags || [],
          auto_generated: true,
          is_pinned: doc.pinned || false
        })
      );
      await Promise.all(docPromises);

      // Save AI onboarding interaction to context memory
      await base44.entities.AIContextMemory.create({
        project_id: project.id,
        interaction_type: "architecture_decision",
        user_prompt: `Onboarding wizard: ${wizardData.projectInfo.name}`,
        ai_response: JSON.stringify({
          architecture: wizardData.architecture,
          services: wizardData.services.map(s => ({ name: s.name, category: s.category })),
          cicd: wizardData.cicdConfig.platform
        }),
        metadata: {
          service_ids: [],
          technologies: wizardData.architecture.technologies || [],
          tags: ["onboarding", "initial-setup"],
          confidence_score: 0.9,
          user_feedback: "accepted"
        }
      });

      toast.success("Project created successfully!");
      onComplete(project);
      onClose();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast.error("Failed to create project");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkipToReview = () => {
    setCurrentStep(STEPS.length - 1);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI-Powered Project Setup
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  index < currentStep ? "bg-green-600 text-white" :
                  index === currentStep ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <span className="text-xs text-gray-600 hidden md:block">{step.label}</span>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                data={wizardData}
                onComplete={handleStepComplete}
                onSkipToReview={handleSkipToReview}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 pt-4 border-t border-gray-100 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isGenerating}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : currentStep === STEPS.length - 1 ? (
              <>Launch Project</>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

AIOnboardingWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired
};