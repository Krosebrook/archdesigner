import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Loader2, Shield, Building2, ShoppingCart, GraduationCap, Truck, Film, Cpu, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import PropTypes from "prop-types";

const INDUSTRIES = [
  {
    id: "fintech",
    label: "Financial Technology",
    icon: "💰",
    IconComponent: Shield,
    color: "from-green-600 to-emerald-600",
    compliance: ["PCI-DSS", "SOC 2", "GDPR"],
    description: "Banking, payments, lending, crypto platforms"
  },
  {
    id: "healthcare",
    label: "Healthcare & Medical",
    icon: "🏥",
    IconComponent: Building2,
    color: "from-blue-600 to-cyan-600",
    compliance: ["HIPAA", "HITECH", "GDPR", "FDA 21 CFR Part 11"],
    description: "Telehealth, EHR, patient management systems"
  },
  {
    id: "ecommerce",
    label: "E-commerce & Retail",
    icon: "🛒",
    IconComponent: ShoppingCart,
    color: "from-purple-600 to-pink-600",
    compliance: ["PCI-DSS", "GDPR", "CCPA"],
    description: "Online stores, marketplaces, inventory management"
  },
  {
    id: "saas",
    label: "SaaS Platform",
    icon: "☁️",
    IconComponent: Building2,
    color: "from-indigo-600 to-purple-600",
    compliance: ["SOC 2", "GDPR", "ISO 27001"],
    description: "B2B/B2C software services, multi-tenancy"
  },
  {
    id: "edtech",
    label: "Education Technology",
    icon: "🎓",
    IconComponent: GraduationCap,
    color: "from-orange-600 to-red-600",
    compliance: ["FERPA", "COPPA", "GDPR"],
    description: "Learning platforms, course management, assessments"
  },
  {
    id: "logistics",
    label: "Logistics & Supply Chain",
    icon: "🚚",
    IconComponent: Truck,
    color: "from-yellow-600 to-orange-600",
    compliance: ["ISO 28000", "GDPR"],
    description: "Fleet management, warehouse systems, delivery tracking"
  },
  {
    id: "media",
    label: "Media & Entertainment",
    icon: "🎬",
    IconComponent: Film,
    color: "from-pink-600 to-rose-600",
    compliance: ["DMCA", "GDPR", "COPPA"],
    description: "Streaming, content management, social platforms"
  },
  {
    id: "iot",
    label: "IoT & Smart Devices",
    icon: "📡",
    IconComponent: Cpu,
    color: "from-teal-600 to-cyan-600",
    compliance: ["ISO 27001", "GDPR"],
    description: "Device management, telemetry, automation"
  },
  {
    id: "gaming",
    label: "Gaming & Esports",
    icon: "🎮",
    IconComponent: Gamepad2,
    color: "from-violet-600 to-purple-600",
    compliance: ["COPPA", "GDPR", "ESRB Guidelines"],
    description: "Multiplayer, matchmaking, leaderboards, in-game economy"
  }
];

export default function IndustryTemplateGenerator({ projectData, onComplete }) {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState(null);

  const generateIndustryTemplate = async (industry) => {
    setIsGenerating(true);
    setSelectedIndustry(industry);

    try {
      const prompt = `You are an expert software architect specializing in ${industry.label} systems. Generate a comprehensive microservices architecture for a ${projectData.name} project.

PROJECT CONTEXT:
- Name: ${projectData.name}
- Description: ${projectData.description}
- Category: ${projectData.category}
- Industry: ${industry.label}

COMPLIANCE REQUIREMENTS: ${industry.compliance.join(", ")}

Generate the following with industry-specific best practices:

1. MICROSERVICES (5-8 services):
   - Service name, purpose, technology stack
   - Database schema with tables, fields, types
   - API endpoints with methods, paths, request/response schemas
   - Security requirements and authentication
   - Compliance considerations

2. DATABASE ARCHITECTURE:
   - Recommended database types per service (SQL, NoSQL, Graph, etc.)
   - Data encryption requirements
   - Audit logging requirements
   - Backup and retention policies

3. CI/CD PIPELINE:
   - Testing stages (unit, integration, security scanning)
   - Compliance checks (automated PCI/HIPAA scans)
   - Deployment strategy (blue-green, canary)
   - Environment configurations

4. SECURITY & COMPLIANCE:
   - Authentication strategy (OAuth, SSO, MFA)
   - Data encryption (at rest, in transit)
   - Audit logging requirements
   - Compliance certifications needed

5. DOCUMENTATION REQUIREMENTS:
   - API documentation standards
   - Security documentation
   - Compliance documentation
   - Runbooks and incident response

Return detailed JSON structure with all specifications.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  purpose: { type: "string" },
                  category: { type: "string" },
                  technology: { type: "string" },
                  database_type: { type: "string" },
                  database_schema: {
                    type: "object",
                    properties: {
                      tables: { type: "array" }
                    }
                  },
                  api_endpoints: { type: "array" },
                  security_requirements: { type: "array" },
                  compliance_notes: { type: "string" }
                }
              }
            },
            database_architecture: {
              type: "object",
              properties: {
                encryption: { type: "string" },
                audit_logging: { type: "string" },
                backup_policy: { type: "string" }
              }
            },
            cicd_pipeline: {
              type: "object",
              properties: {
                testing_stages: { type: "array" },
                security_scans: { type: "array" },
                deployment_strategy: { type: "string" }
              }
            },
            security_compliance: {
              type: "object",
              properties: {
                authentication: { type: "string" },
                encryption: { type: "string" },
                audit_requirements: { type: "array" },
                certifications: { type: "array" }
              }
            },
            documentation: {
              type: "object",
              properties: {
                api_docs: { type: "string" },
                security_docs: { type: "string" },
                compliance_docs: { type: "string" }
              }
            }
          }
        }
      });

      setGeneratedTemplate(result);
      toast.success(`${industry.label} template generated!`);
    } catch (error) {
      console.error("Template generation error:", error);
      toast.error("Failed to generate template");
    }
    setIsGenerating(false);
  };

  const applyTemplate = () => {
    onComplete({
      industry: selectedIndustry,
      template: generatedTemplate
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Industry Vertical</h3>
        <p className="text-sm text-gray-600 mb-4">
          AI will generate industry-specific architecture with compliance requirements
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRIES.map((industry) => {
          const Icon = industry.IconComponent;
          return (
            <motion.div
              key={industry.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedIndustry?.id === industry.id
                    ? `border-2 bg-gradient-to-br ${industry.color} text-white shadow-xl`
                    : "hover:border-gray-300 hover:shadow-lg"
                }`}
                onClick={() => !isGenerating && generateIndustryTemplate(industry)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${selectedIndustry?.id === industry.id ? '' : 'opacity-80'}`}>
                      {industry.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className={`text-base ${selectedIndustry?.id === industry.id ? 'text-white' : 'text-gray-900'}`}>
                        {industry.label}
                      </CardTitle>
                    </div>
                    {selectedIndustry?.id === industry.id && isGenerating && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className={`text-xs ${selectedIndustry?.id === industry.id ? 'text-white/90' : 'text-gray-600'}`}>
                    {industry.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {industry.compliance.map(comp => (
                      <Badge
                        key={comp}
                        variant={selectedIndustry?.id === industry.id ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {generatedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  ✅ Industry Template Generated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Services</h4>
                    <div className="space-y-1">
                      {generatedTemplate.services?.map((service, i) => (
                        <div key={i} className="text-xs text-gray-700 p-2 bg-white rounded border">
                          <span className="font-medium">{service.name}</span> - {service.technology}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Compliance</h4>
                    <div className="space-y-1">
                      {generatedTemplate.security_compliance?.certifications?.map((cert, i) => (
                        <div key={i} className="text-xs text-gray-700 p-2 bg-white rounded border flex items-center gap-2">
                          <Shield className="w-3 h-3 text-green-600" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={applyTemplate}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                >
                  Apply Industry Template
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

IndustryTemplateGenerator.propTypes = {
  projectData: PropTypes.object.isRequired,
  onComplete: PropTypes.func.isRequired
};