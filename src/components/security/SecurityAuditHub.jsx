import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  FileCode, 
  Activity, 
  Package, 
  FileCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download
} from "lucide-react";
import { AnimatedHero } from "../shared/AnimatedHero";
import ComplianceReportGenerator from "./ComplianceReportGenerator";
import DependencyScanResults from "./DependencyScanResults";

/**
 * SecurityAuditHub Component
 * 
 * Comprehensive security auditing interface with:
 * - Static analysis (OWASP Top 10)
 * - Dynamic runtime checks
 * - Dependency scanning
 * - Compliance reporting
 */
export default function SecurityAuditHub({ project, services }) {
  const [auditType, setAuditType] = useState('full');
  const [complianceStandards, setComplianceStandards] = useState(['SOC2']);
  const [includeRemediation, setIncludeRemediation] = useState(true);
  const [severityThreshold, setSeverityThreshold] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);

  const auditTypes = [
    { value: 'full', label: 'Full Audit', description: 'Complete security assessment' },
    { value: 'static', label: 'Static Analysis', description: 'Code-based security scan' },
    { value: 'dynamic', label: 'Dynamic Analysis', description: 'Runtime security checks' },
    { value: 'dependencies', label: 'Dependencies', description: 'Vulnerability scanning' },
    { value: 'compliance', label: 'Compliance', description: 'Standards compliance check' }
  ];

  const complianceOptions = ['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'GDPR', 'NIST'];

  const runSecurityAudit = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('securityAudit', {
        project_id: project.id,
        audit_type: auditType,
        compliance_standards: complianceStandards,
        include_remediation: includeRemediation,
        severity_threshold: severityThreshold
      });

      setAuditReport(data.audit_report);
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!auditReport) return;
    
    const reportContent = `# Security Audit Report - ${project.name}
Generated: ${new Date().toISOString()}

## Executive Summary
${auditReport.executive_summary}

## Overall Security Score: ${auditReport.overall_security_score}/100
Risk Level: ${auditReport.risk_level.toUpperCase()}

## Static Analysis Findings
${auditReport.static_analysis?.owasp_findings?.map(f => `
### ${f.title}
- **Severity**: ${f.severity}
- **Category**: ${f.category}
- **CWE**: ${f.cwe_id}
- **Description**: ${f.description}
- **Location**: ${f.location}
- **Exploit Scenario**: ${f.exploit_scenario}
- **Remediation**: ${f.remediation}
${f.code_example ? `\`\`\`\n${f.code_example}\n\`\`\`` : ''}
`).join('\n')}

## Dynamic Analysis
${auditReport.dynamic_analysis?.runtime_checks?.map(c => `- ${c.check_type}: ${c.status} - ${c.description}`).join('\n')}

## Dependency Scan
${auditReport.dependency_scan?.vulnerable_packages?.map(p => `- ${p.package_name} (${p.current_version}): ${p.severity} - CVEs: ${p.cve_ids?.join(', ')}`).join('\n')}

## Compliance Reports
${auditReport.compliance_reports?.map(r => `
### ${r.standard} - Score: ${r.compliance_score}/100
**Compliant Controls**: ${r.compliant_controls?.length}
**Non-Compliant Controls**: ${r.non_compliant_controls?.length}
`).join('\n')}

## Remediation Plan
### Immediate Actions
${auditReport.remediation_plan?.immediate_actions?.map(a => `- ${a}`).join('\n')}

### Short Term
${auditReport.remediation_plan?.short_term?.map(a => `- ${a}`).join('\n')}

### Long Term
${auditReport.remediation_plan?.long_term?.map(a => `- ${a}`).join('\n')}

Estimated Effort: ${auditReport.remediation_plan?.estimated_effort}
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${project.name}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (level) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') return <XCircle className="w-5 h-5 text-red-500" />;
    if (severity === 'medium') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <AnimatedHero
        icon={Shield}
        title="AI-Driven Security Audit"
        description="Comprehensive security analysis with OWASP Top 10, runtime checks, dependency scanning, and compliance reporting"
        gradient="from-red-900 via-orange-900 to-yellow-900"
      />

      {/* Audit Configuration */}
      <Card className="border-2 border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit Configuration
          </CardTitle>
          <CardDescription>Configure your security audit parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Audit Type</Label>
              <Select value={auditType} onValueChange={setAuditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {auditTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity Threshold</Label>
              <Select value={severityThreshold} onValueChange={setSeverityThreshold}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low and above</SelectItem>
                  <SelectItem value="medium">Medium and above</SelectItem>
                  <SelectItem value="high">High and above</SelectItem>
                  <SelectItem value="critical">Critical only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Compliance Standards</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {complianceOptions.map(standard => (
                <div key={standard} className="flex items-center space-x-2">
                  <Switch
                    checked={complianceStandards.includes(standard)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setComplianceStandards([...complianceStandards, standard]);
                      } else {
                        setComplianceStandards(complianceStandards.filter(s => s !== standard));
                      }
                    }}
                  />
                  <Label className="text-sm">{standard}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={includeRemediation}
              onCheckedChange={setIncludeRemediation}
            />
            <Label>Include detailed remediation steps</Label>
          </div>

          <Button 
            onClick={runSecurityAudit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Security Audit...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Security Audit
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audit Results */}
      {auditReport && (
        <div className="space-y-6">
          {/* Overview Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Security Score</div>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {auditReport.overall_security_score}
                </div>
                <Progress value={auditReport.overall_security_score} className="mt-2" />
              </CardContent>
            </Card>

            <Card className={`border-2 ${auditReport.risk_level === 'critical' ? 'border-red-500' : auditReport.risk_level === 'high' ? 'border-orange-500' : 'border-yellow-500'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Risk Level</div>
                  <AlertTriangle className={`w-4 h-4 ${auditReport.risk_level === 'critical' ? 'text-red-600' : 'text-orange-600'}`} />
                </div>
                <Badge className={`${getRiskColor(auditReport.risk_level)} text-white text-lg px-3 py-1`}>
                  {auditReport.risk_level.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">OWASP Findings</div>
                  <FileCode className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {auditReport.static_analysis?.owasp_findings?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">Vulnerable Deps</div>
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {auditReport.dependency_scan?.vulnerable_packages?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Executive Summary
                </span>
                <Button onClick={downloadReport} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{auditReport.executive_summary}</p>
            </CardContent>
          </Card>

          {/* Detailed Results Tabs */}
          <Tabs defaultValue="static" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="static">
                <FileCode className="w-4 h-4 mr-2" />
                Static Analysis
              </TabsTrigger>
              <TabsTrigger value="dynamic">
                <Activity className="w-4 h-4 mr-2" />
                Dynamic Checks
              </TabsTrigger>
              <TabsTrigger value="dependencies">
                <Package className="w-4 h-4 mr-2" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <FileCheck className="w-4 h-4 mr-2" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="remediation">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Remediation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="static" className="space-y-4">
              {auditReport.static_analysis?.owasp_findings?.map((finding, idx) => (
                <Card key={idx} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(finding.severity)}
                          <CardTitle className="text-lg">{finding.title}</CardTitle>
                          <Badge variant="outline">{finding.severity}</Badge>
                          <Badge variant="secondary">{finding.cwe_id}</Badge>
                        </div>
                        <CardDescription>{finding.category}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Description</h4>
                      <p className="text-sm text-gray-600">{finding.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Location</h4>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{finding.location}</code>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Exploit Scenario</h4>
                      <p className="text-sm text-gray-600">{finding.exploit_scenario}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Remediation</h4>
                      <p className="text-sm text-green-700 bg-green-50 p-3 rounded">{finding.remediation}</p>
                    </div>
                    {finding.code_example && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Code Example</h4>
                        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          {finding.code_example}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="dynamic">
              <div className="space-y-4">
                {auditReport.dynamic_analysis?.runtime_checks?.map((check, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {check.check_type}
                        <Badge variant={check.status === 'passed' ? 'default' : 'destructive'}>
                          {check.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600">{check.description}</p>
                      {check.recommendation && (
                        <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                          💡 {check.recommendation}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {auditReport.dynamic_analysis?.api_security?.map((api, idx) => (
                  <Card key={idx} className="border-l-4 border-l-orange-500">
                    <CardHeader>
                      <CardTitle className="text-base">{api.endpoint}</CardTitle>
                      <CardDescription>{api.vulnerability}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge className={getRiskColor(api.severity)}>{api.severity}</Badge>
                      <p className="text-sm text-green-700 bg-green-50 p-2 rounded mt-2">{api.fix}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="dependencies">
              <DependencyScanResults scanData={auditReport.dependency_scan} />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceReportGenerator 
                reports={auditReport.compliance_reports}
                project={project}
              />
            </TabsContent>

            <TabsContent value="remediation">
              <div className="space-y-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Immediate Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {auditReport.remediation_plan?.immediate_actions?.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full mt-2" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      Short Term (1-2 weeks)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {auditReport.remediation_plan?.short_term?.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      Long Term (1-3 months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {auditReport.remediation_plan?.long_term?.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600">
                      <strong>Estimated Effort:</strong> {auditReport.remediation_plan?.estimated_effort}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}