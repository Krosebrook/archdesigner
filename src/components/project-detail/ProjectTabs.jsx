import { 
  Network, List, Sparkles, FileText, Code2, FileCode2, 
  DollarSign, GitBranch, Cpu, Code, Users, Settings, Compass, 
  Brain, BarChart3, Eye, Rocket, Wand2
} from "lucide-react";

import VisualEditor from "./VisualEditor";
import ServicesList from "./ServicesList";
import AIValidator from "./AIValidator";
import DependencyVisualizer from "./DependencyVisualizer";
import AIRefactor from "./AIRefactor";
import AIDocGenerator from "./AIDocGenerator";
import AICodeReview from "./AICodeReview";
import APIGenerator from "./APIGenerator";
import CostOptimizer from "./CostOptimizer";
import CICDGenerator from "./CICDGenerator";
import ArchitectureRefiner from "./ArchitectureRefiner";
import CICDIntelligence from "./CICDIntelligence";
import CodeGenerator from "./CodeGenerator";
import CollaborationHub from "./CollaborationHub";
import TemplateManager from "./TemplateManager";
import ServiceDiscovery from "./ServiceDiscovery";
import AICollaborationAssistant from "./AICollaborationAssistant";
import TemplateInsights from "./TemplateInsights";
import AIArchitectureVisualizer from "./AIArchitectureVisualizer";
import CICDAutomationEngine from "./CICDAutomationEngine";
import AdvancedTemplateIntelligence from "./AdvancedTemplateIntelligence";

export const tabConfig = [
  { id: "visual", label: "Visual", icon: Network, component: VisualEditor, props: ["services", "onUpdateService", "onDeleteService"] },
  { id: "list", label: "Services", icon: List, component: ServicesList, props: ["services", "onUpdateService", "onDeleteService"] },
  { id: "validate", label: "Validate", icon: Sparkles, component: AIValidator, props: ["project", "services"] },
  { id: "dependencies", label: "Graph", icon: Network, component: DependencyVisualizer, props: ["project", "services"] },
  { id: "refactor", label: "Refactor", icon: Sparkles, component: AIRefactor, props: ["project", "services"] },
  { id: "documentation", label: "Docs", icon: FileText, component: AIDocGenerator, props: ["project", "services"] },
  { id: "code-review", label: "Review", icon: Code2, component: AICodeReview, props: ["project", "services"] },
  { id: "api-gen", label: "API", icon: FileCode2, component: APIGenerator, props: ["project", "services"] },
  { id: "cost", label: "Cost", icon: DollarSign, component: CostOptimizer, props: ["project", "services"] },
  { id: "cicd", label: "CI/CD", icon: GitBranch, component: CICDGenerator, props: ["project", "services"] },
  { id: "arch-refine", label: "Refine", icon: Cpu, component: ArchitectureRefiner, props: ["project", "services"] },
  { id: "code-gen", label: "Generate", icon: Code, component: CodeGenerator, props: ["project", "services"] },
  { id: "collab", label: "Collab", icon: Users, component: CollaborationHub, props: ["project"] },
  { id: "template-mgmt", label: "Manage", icon: Settings, component: TemplateManager, props: [] },
  { id: "discover", label: "Discover", icon: Compass, component: ServiceDiscovery, props: ["project", "services"] },
  { id: "ai-assist", label: "AI Assist", icon: Brain, component: AICollaborationAssistant, props: ["project", "services"] },
  { id: "insights", label: "Insights", icon: BarChart3, component: TemplateInsights, props: [] },
  { id: "ai-viz", label: "Visualize", icon: Eye, component: AIArchitectureVisualizer, props: ["project", "services"] },
  { id: "auto-deploy", label: "Deploy", icon: Rocket, component: CICDAutomationEngine, props: ["project", "services"] },
  { id: "template-ai", label: "Template AI", icon: Wand2, component: AdvancedTemplateIntelligence, props: ["project"] }
];