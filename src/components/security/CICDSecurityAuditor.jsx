import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Loader2, Shield, CheckCircle2, XCircle, Key } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";

export const CICDSecurityAuditor = ({ project }) => {
  const [auditing, setAuditing] = useState(false);
  const [cicdConfig, setCicdConfig] = useState(null);
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    loadCICDConfig();
  }, [project.id]);

  const loadCICDConfig = async () => {
    try {
      const configs = await base44.entities.CICDConfiguration.filter({ project_id: project.id });
      if (configs.length > 0) {
        setCicdConfig(configs[0]);
      }
    } catch (error) {
      console.error("Error loading CI/CD config:", error);
    }
  };

  const auditCICD = async () => {
    if (!cicdConfig) return;

    setAuditing(true);
    try {
      const result = await invokeLLM(
        `Perform comprehensive security audit on this CI/CD pipeline configuration.

Project: ${project.name}
Platform: ${cicdConfig.platform}

Pipeline Configuration:
${JSON.stringify(cicdConfig, null, 2)}

Analyze for security best practices:

1. **Secret Management**
   - Are secrets stored securely (vault, env vars)?
   - Are secrets exposed in logs or artifacts?
   - Rotation policies?

2. **Dependency Scanning**
   - Vulnerability scanning enabled?
   - SBOM generation?
   - License compliance checks?

3. **Code Scanning**
   - SAST (Static Analysis) configured?
   - DAST (Dynamic Analysis) for running apps?
   - Container image scanning?

4. **Access Control**
   - Least privilege for service accounts?
   - MFA enforced?
   - Audit logs enabled?

5. **Pipeline Integrity**
   - Signed commits required?
   - Protected branches?
   - Review requirements?
   - Artifact signing?

6. **Supply Chain Security**
   - Dependency pinning?
   - Trusted registries only?
   - SLSA framework compliance?

7. **Runtime Security**
   - Network policies?
   - Pod security policies?
   - Resource limits?

Provide detailed findings with severity and remediation.`,
        {
          type: "object",
          properties: {
            security_score: { type: "number" },
            summary: { type: "string" },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  title: { type: "string" },
                  severity: { type: "string" },
                  current_state: { type: "string" },
                  risk: { type: "string" },
                  recommendation: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            secret_management: {
              type: "object",
              properties: {
                status: { type: "string" },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            scanning_coverage: {
              type: "object",
              properties: {
                sast: { type: "boolean" },
                dast: { type: "boolean" },
                dependency_scan: { type: "boolean" },
                container_scan: { type: "boolean" },
                recommendations: { type: "string" }
              }
            },
            compliance_frameworks: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      );

      setAudit(result);

      // Save findings to database
      if (result.findings?.length > 0) {
        const findings = result.findings.map(finding => ({
          project_id: project.id,
          source: "cicd_audit",
          title: finding.title,
          severity: finding.severity?.toLowerCase() || "medium",
          category: finding.category,
          description: `${finding.current_state} - Risk: ${finding.risk}`,
          remediation: finding.recommendation,
          status: "open"
        }));

        await base44.entities.SecurityFinding.bulkCreate(findings);
      }
    } catch (error) {
      console.error("CI/CD audit error:", error);
    }
    setAuditing(false);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-900 border-red-300",
      high: "bg-orange-100 text-orange-900 border-orange-300",
      medium: "bg-yellow-100 text-yellow-900 border-yellow-300",
      low: "bg-blue-100 text-blue-900 border-blue-300"
    };
    return colors[severity?.toLowerCase()] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                CI/CD Security Auditor
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analyze pipeline for security best practices and vulnerabilities
              </p>
            </div>
            <Button
              onClick={auditCICD}
              disabled={auditing || !cicdConfig}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {auditing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Audit Pipeline
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!cicdConfig && (
        <Card>
          <CardContent className="p-12 text-center">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No CI/CD configuration found. Configure CI/CD to audit security.</p>
          </CardContent>
        </Card>
      )}

      {audit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Security Score */}
          <Card className="border-l-4 border-indigo-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Security Score</h3>
                  <div className={`text-5xl font-bold ${audit.security_score >= 80 ? 'text-green-600' : audit.security_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {audit.security_score}/100
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{audit.summary}</p>
                </div>
                <Shield className={`w-24 h-24 ${audit.security_score >= 80 ? 'text-green-600' : audit.security_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          {/* Findings */}
          {audit.findings?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle>Security Findings ({audit.findings.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {audit.findings.map((finding, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{finding.category}</Badge>
                            <Badge className={getSeverityColor(finding.severity)}>
                              {finding.severity}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{finding.title}</h4>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Current State: </span>
                          <span className="text-gray-600">{finding.current_state}</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-3 rounded">
                          <span className="font-semibold text-red-900">Risk: </span>
                          <span className="text-red-800">{finding.risk}</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                          <span className="font-semibold text-green-900">Recommendation: </span>
                          <span className="text-green-800">{finding.recommendation}</span>
                        </div>
                        {finding.implementation && (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="font-semibold text-blue-900 mb-1">Implementation:</p>
                            <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono">
                              {finding.implementation}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Secret Management */}
          {audit.secret_management && (
            <Card className="border-l-4 border-purple-600">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-600" />
                  Secret Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Status:</span>
                  <Badge className={audit.secret_management.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {audit.secret_management.status}
                  </Badge>
                </div>

                {audit.secret_management.issues?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Issues Found</h5>
                    <ul className="space-y-1">
                      {audit.secret_management.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {audit.secret_management.recommendations?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h5>
                    <ul className="space-y-1">
                      {audit.secret_management.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scanning Coverage */}
          {audit.scanning_coverage && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle>Security Scanning Coverage</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="mb-2">
                      {audit.scanning_coverage.sast ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                      )}
                    </div>
                    <p className="text-sm font-semibold">SAST</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="mb-2">
                      {audit.scanning_coverage.dast ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                      )}
                    </div>
                    <p className="text-sm font-semibold">DAST</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="mb-2">
                      {audit.scanning_coverage.dependency_scan ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                      )}
                    </div>
                    <p className="text-sm font-semibold">Dependencies</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="mb-2">
                      {audit.scanning_coverage.container_scan ? (
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                      )}
                    </div>
                    <p className="text-sm font-semibold">Containers</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{audit.scanning_coverage.recommendations}</p>
              </CardContent>
            </Card>
          )}

          {/* Compliance */}
          {audit.compliance_frameworks?.length > 0 && (
            <Card className="border-l-4 border-green-600">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg">Compliance Frameworks</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {audit.compliance_frameworks.map((framework, i) => (
                    <Badge key={i} className="bg-green-100 text-green-800">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};