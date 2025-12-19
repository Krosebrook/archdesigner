import { 
  Network, List, Sparkles, FileText, Code2, FileCode2, 
  DollarSign, GitBranch, Cpu, Code, Users, Settings, Compass, 
  Brain, BarChart3, Eye, Rocket, Wand2, CheckSquare, Zap, Activity, Bot, Flag, BookOpen, RefreshCw, Shield
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
import ServiceMap from "./ServiceMap";
import AICollaborationAssistant from "./AICollaborationAssistant";
import TemplateInsights from "./TemplateInsights";
import AIArchitectureVisualizer from "./AIArchitectureVisualizer";
import CICDAutomationEngine from "./CICDAutomationEngine";
import AdvancedTemplateIntelligence from "./AdvancedTemplateIntelligence";
import TaskPrioritization from "./TaskPrioritization";
import PerformanceTuning from "./PerformanceTuning";
import ServiceRegistrationGenerator from "./ServiceRegistrationGenerator";
import APIGatewayManager from "./APIGatewayManager";
import ProjectHealthDashboard from "./ProjectHealthDashboard";
import AIProjectAssistant from "./AIProjectAssistant";
import FeatureFlagManager from "./FeatureFlagManager";
import ServiceScaffoldGenerator from "./ServiceScaffoldGenerator";
import KnowledgeBaseHub from "../knowledge-base/KnowledgeBaseHub";
import CodeScaffoldingHub from "../code-scaffold/CodeScaffoldingHub";
import CodeRefactoringHub from "../code-refactor/CodeRefactoringHub";
import CICDIntelligenceHub from "../cicd/CICDIntelligenceHub";
import DocumentationIntelligenceHub from "../documentation/DocumentationIntelligenceHub";
import EnhancedDocGenerator from "../documentation/EnhancedDocGenerator";
import SecurityIntelligenceHub from "../security/SecurityIntelligenceHub";
import IntegrationHub from "../integrations/IntegrationHub";
import APIIntegrationHub from "../api/APIIntegrationHub";
import AdvancedAnalyticsDashboard from "../analytics/AdvancedAnalyticsDashboard";
import AIDeploymentAutomation from "../deployment/AIDeploymentAutomation";
import AIContextManager from "../ai-context/AIContextManager";
import ProjectKnowledgeGraph from "../ai-context/ProjectKnowledgeGraph";

export const tabConfig = [
  { id: "assistant", label: "AI Assistant", icon: Bot, component: AIProjectAssistant, props: ["project", "services"] },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, component: KnowledgeBaseHub, props: ["project", "services"] },
  { id: "health", label: "Health", icon: Activity, component: ProjectHealthDashboard, props: ["project", "services"] },
  { id: "visual", label: "Visual", icon: Network, component: VisualEditor, props: ["services", "onUpdateService", "onDeleteService"] },
  { id: "list", label: "Services", icon: List, component: ServicesList, props: ["services", "onUpdateService", "onDeleteService"] },
  { id: "tasks", label: "Tasks", icon: CheckSquare, component: TaskPrioritization, props: ["project", "services"] },
  { id: "discover", label: "Discover", icon: Compass, component: ServiceDiscovery, props: ["project", "services"] },
  { id: "map", label: "Map", icon: Network, component: ServiceMap, props: ["project", "services"] },
  { id: "gateway", label: "API Gateway", icon: Network, component: APIGatewayManager, props: ["project", "services"] },
  { id: "registration", label: "Registration", icon: Code2, component: ServiceRegistrationGenerator, props: ["project", "services"] },
  { id: "performance", label: "Performance", icon: Zap, component: PerformanceTuning, props: ["project", "services"] },
  { id: "validate", label: "Validate", icon: Sparkles, component: AIValidator, props: ["project", "services"] },
  { id: "dependencies", label: "Graph", icon: Network, component: DependencyVisualizer, props: ["project", "services"] },
  { id: "refactor", label: "Refactor", icon: RefreshCw, component: CodeRefactoringHub, props: ["project", "services"] },
  { id: "documentation", label: "Docs", icon: FileText, component: AIDocGenerator, props: ["project", "services"] },
  { id: "docs-enhanced", label: "Smart Docs", icon: BookOpen, component: EnhancedDocGenerator, props: ["project", "services"] },
  { id: "docs-intelligence", label: "Docs AI", icon: BookOpen, component: DocumentationIntelligenceHub, props: ["project", "services"] },
  { id: "code-review", label: "Review", icon: Code2, component: AICodeReview, props: ["project", "services"] },
  { id: "api-gen", label: "API", icon: FileCode2, component: APIGenerator, props: ["project", "services"] },
  { id: "cost", label: "Cost", icon: DollarSign, component: CostOptimizer, props: ["project", "services"] },
  { id: "cicd", label: "CI/CD", icon: GitBranch, component: CICDGenerator, props: ["project", "services"] },
  { id: "cicd-intelligence", label: "CI/CD AI", icon: Activity, component: CICDIntelligenceHub, props: ["project", "services"] },
  { id: "security", label: "Security", icon: Shield, component: SecurityIntelligenceHub, props: ["project", "services"] },
  { id: "integrations", label: "Integrations", icon: Zap, component: IntegrationHub, props: ["project"] },
  { id: "api", label: "APIs", icon: Code, component: APIIntegrationHub, props: ["project", "services"] },
  { id: "analytics", label: "Analytics", icon: BarChart3, component: AdvancedAnalyticsDashboard, props: ["project", "services"] },
  { id: "flags", label: "Flags", icon: Flag, component: FeatureFlagManager, props: ["project", "services"] },
  { id: "arch-refine", label: "Refine", icon: Cpu, component: ArchitectureRefiner, props: ["project", "services"] },
  { id: "code-gen", label: "Generate", icon: Code, component: CodeGenerator, props: ["project", "services"] },
  { id: "scaffold", label: "Code Lab", icon: Code, component: CodeScaffoldingHub, props: ["project", "services"] },
  { id: "collab", label: "Collab", icon: Users, component: CollaborationHub, props: ["project"] },
  { id: "template-mgmt", label: "Manage", icon: Settings, component: TemplateManager, props: [] },
  { id: "ai-assist", label: "AI Assist", icon: Brain, component: AICollaborationAssistant, props: ["project", "services"] },
  { id: "insights", label: "Insights", icon: BarChart3, component: TemplateInsights, props: [] },
  { id: "ai-viz", label: "Visualize", icon: Eye, component: AIArchitectureVisualizer, props: ["project", "services"] },
  { id: "auto-deploy", label: "Deploy", icon: Rocket, component: CICDAutomationEngine, props: ["project", "services"] },
  { id: "deployment-automation", label: "Deployment AI", icon: Rocket, component: AIDeploymentAutomation, props: ["project", "services"] },
  { id: "template-ai", label: "Template AI", icon: Wand2, component: AdvancedTemplateIntelligence, props: ["project"] }
];