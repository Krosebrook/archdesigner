import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2, Shield, Lock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const DeploymentSecurityAnalyzer = ({ project, services }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeDeploymentSecurity = async () => {
    setAnalyzing(true);
    try {
      const result = await invokeLLM(
        `Analyze deployment strategy and architecture for security risks.

Project: ${project.name}
Services: ${services.length}

Service Details:
${services.map(s => `
- ${s.name} (${s.category})
  Technologies: ${s.technologies?.join(', ')}
  APIs: ${s.apis?.length || 0}
`).join('\n')}

Analyze security aspects:

1. **Network Security**
   - Service-to-service communication encryption
   - API gateway configuration
   - Network segmentation
   - Firewall rules

2. **Identity & Access**
   - Authentication mechanisms
   - Authorization models
   - Service account permissions
   - API key management

3. **Data Protection**
   - Encryption at rest
   - Encryption in transit
   - Data classification
   - Backup security

4. **Deployment Configuration**
   - Container security
   - Kubernetes security policies
   - Environment isolation
   - Resource limits

5. **Observability & Response**
   - Security monitoring
   - Incident detection
   - Audit logging
   - Alerting rules

6. **Attack Surface**
   - Exposed endpoints
   - Public vs private services
   - External dependencies
   - Third-party integrations

Provide risk assessment and mitigation strategies.`,
        {
          type: "object",
          properties: {
            security_posture: { type: "string" },
            overall_risk_level: { type: "string" },
            risk_categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  risk_level: { type: "string" },
                  issues: { type: "array", items: { type: "string" } },
                  mitigations: { type: "array", items: { type: "string" } }
                }
              }
            },
            attack_vectors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vector: { type: "string" },
                  likelihood: { type: "string" },
                  impact: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            security_controls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  control: { type: "string" },
                  status: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            zero_trust_readiness: {
              type: "object",
              properties: {
                score: { type: "number" },
                gaps: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      );

      setAnalysis(result);

      // Save risk categories as findings
      if (result.risk_categories?.length > 0) {
        const findings = result.risk_categories.flatMap(cat => 
          cat.issues?.map(issue => ({
            project_id: project.id,
            source: "deployment_analysis",
            title: `${cat.category}: ${issue.substring(0, 100)}`,
            severity: cat.risk_level?.toLowerCase() || "medium",
            category: cat.category,
            description: issue,
            remediation: cat.mitigations?.join(". ") || "",
            status: "open"
          })) || []
        );

        if (findings.length > 0) {
          await base44.entities.SecurityFinding.bulkCreate(findings);
        }
      }
    } catch (error) {
      console.error("Deployment security analysis error:", error);
    }
    setAnalyzing(false);
  };

  const getRiskColor = (level) => {
    const colors = {
      critical: "bg-red-100 text-red-900 border-red-300",
      high: "bg-orange-100 text-orange-900 border-orange-300",
      medium: "bg-yellow-100 text-yellow-900 border-yellow-300",
      low: "bg-green-100 text-green-900 border-green-300"
    };
    return colors[level?.toLowerCase()] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-600" />
                Deployment Security Analyzer
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Assess deployment architecture for security risks and vulnerabilities
              </p>
            </div>
            <Button
              onClick={analyzeDeploymentSecurity}
              disabled={analyzing || services.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Analyze Security
            </Button>
          </div>
        </CardHeader>
      </Card>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Security Posture */}
          <Card className="border-l-4 border-purple-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Security Posture</h3>
                  <Badge className={getRiskColor(analysis.overall_risk_level)} size="lg">
                    {analysis.overall_risk_level} Risk
                  </Badge>
                  <p className="text-gray-700 mt-3">{analysis.security_posture}</p>
                </div>
                <Lock className={`w-20 h-20 ${analysis.overall_risk_level === 'low' ? 'text-green-600' : analysis.overall_risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          {/* Risk Categories */}
          {analysis.risk_categories?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle>Risk Assessment by Category</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {analysis.risk_categories.map((cat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{cat.category}</h4>
                        <Badge className={getRiskColor(cat.risk_level)}>
                          {cat.risk_level}
                        </Badge>
                      </div>

                      {cat.issues?.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Issues</h5>
                          <ul className="space-y-1">
                            {cat.issues.map((issue, j) => (
                              <li key={j} className="text-sm text-red-700 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cat.mitigations?.length > 0 && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                          <h5 className="text-xs font-semibold text-green-900 mb-2">Mitigations</h5>
                          <ul className="space-y-1">
                            {cat.mitigations.map((mit, j) => (
                              <li key={j} className="text-sm text-green-800">
                                • {mit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attack Vectors */}
          {analysis.attack_vectors?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Potential Attack Vectors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {analysis.attack_vectors.map((vector, i) => (
                    <div key={i} className="border-l-4 border-red-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-2">{vector.vector}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-gray-600">Likelihood: </span>
                          <Badge className={getRiskColor(vector.likelihood)} size="sm">
                            {vector.likelihood}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600">Impact: </span>
                          <Badge className={getRiskColor(vector.impact)} size="sm">
                            {vector.impact}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                        <strong>Mitigation:</strong> {vector.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Controls */}
          {analysis.security_controls?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle>Security Controls Assessment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {analysis.security_controls.map((control, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-sm">{control.control}</h5>
                        <p className="text-xs text-gray-600 mt-1">{control.recommendation}</p>
                      </div>
                      <Badge className={control.status === 'implemented' ? 'bg-green-100 text-green-800' : control.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {control.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Zero Trust Readiness */}
          {analysis.zero_trust_readiness && (
            <Card className="border-l-4 border-indigo-600">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Zero Trust Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Readiness Score</span>
                    <span className="text-3xl font-bold text-indigo-600">
                      {analysis.zero_trust_readiness.score}/100
                    </span>
                  </div>
                </div>

                {analysis.zero_trust_readiness.gaps?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Gaps</h5>
                    <ul className="space-y-1">
                      {analysis.zero_trust_readiness.gaps.map((gap, i) => (
                        <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5">⚠</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.zero_trust_readiness.recommendations?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h5>
                    <ul className="space-y-1">
                      {analysis.zero_trust_readiness.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};