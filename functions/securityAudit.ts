import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  validateEnum,
  sanitiseString,
  filterSensitiveForLLM,
  enforceOwnership,
  auditLog,
  executeAdvancedCoTReasoning
} from './lib/utils.js';

/**
 * AI-Driven Security Audit System
 * AXIS: Security, CoT Reasoning, Compliance
 * 
 * Features:
 * - Static code analysis (OWASP Top 10)
 * - Dynamic runtime security checks
 * - Dependency vulnerability scanning
 * - Automated compliance report generation (SOC2, ISO 27001, HIPAA, PCI-DSS)
 * - Multi-layer reasoning with validation
 */

const AUDIT_TYPES = ['full', 'static', 'dynamic', 'dependencies', 'compliance'];
const COMPLIANCE_STANDARDS = ['SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS', 'GDPR', 'NIST'];
const OWASP_TOP_10 = [
  'A01:2021-Broken Access Control',
  'A02:2021-Cryptographic Failures',
  'A03:2021-Injection',
  'A04:2021-Insecure Design',
  'A05:2021-Security Misconfiguration',
  'A06:2021-Vulnerable and Outdated Components',
  'A07:2021-Identification and Authentication Failures',
  'A08:2021-Software and Data Integrity Failures',
  'A09:2021-Security Logging and Monitoring Failures',
  'A10:2021-Server-Side Request Forgery'
];

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'securityAudit');
  const startTime = Date.now();

  try {
    logger.info('Security audit requested');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    const body = await req.json();
    const validation = validateRequired(body, ['project_id']);
    
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing: ${validation.missing.join(', ')}`, correlationId);
    }

    const { 
      project_id, 
      audit_type = 'full',
      compliance_standards = ['SOC2'],
      include_remediation = true,
      severity_threshold = 'medium'
    } = body;

    // Validate enum
    const enumValidation = validateEnum(audit_type, AUDIT_TYPES, 'audit_type');
    if (!enumValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, enumValidation.error, correlationId);
    }

    // Fetch comprehensive project data
    const [projects, services, cicd, apis, securityFindings, codeGenerations] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id }),
      base44.entities.SecurityFinding.filter({ project_id }),
      base44.entities.CodeGeneration.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // RBAC - Ownership check
    const ownershipError = enforceOwnership(user, project, correlationId, logger);
    if (ownershipError) return ownershipError;

    // Audit log
    auditLog(logger, 'SECURITY_AUDIT', user, { project_id, audit_type, compliance_standards });

    // Prepare safe context
    const auditContext = {
      project: filterSensitiveForLLM({
        name: sanitiseString(project.name, 200),
        description: sanitiseString(project.description, 2000),
        category: project.category,
        architecture_pattern: project.architecture_pattern
      }),
      services: services.map(s => filterSensitiveForLLM({
        name: sanitiseString(s.name, 100),
        category: s.category,
        technologies: s.technologies || [],
        apis: s.apis?.length || 0
      })),
      cicd: cicd.map(c => ({
        platform: c.platform,
        security_scanning_enabled: c.security_scan_config?.enabled || false,
        pipeline_stages: Object.keys(c.pipeline_stages || {})
      })),
      apis: apis.map(a => ({
        name: sanitiseString(a.name, 100),
        auth_type: a.auth_type,
        endpoints_count: a.endpoints?.length || 0
      })),
      existing_findings: securityFindings.map(f => ({
        severity: f.severity,
        category: f.category,
        status: f.status
      })),
      code_samples: codeGenerations.slice(0, 3).map(c => ({
        language: c.language,
        framework: c.framework,
        files_count: c.files?.length || 0
      })),
      audit_config: {
        audit_type,
        compliance_standards,
        include_remediation,
        severity_threshold
      }
    };

    // Execute Advanced CoT Security Audit
    const auditResult = await executeAdvancedCoTReasoning({
      task: 'comprehensive_security_audit',
      context: auditContext,
      logger,
      executor: async (ctx) => {
        const prompt = buildSecurityAuditPrompt(ctx);
        
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              overall_security_score: {
                type: "number",
                description: "Overall security score (0-100)"
              },
              risk_level: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
                description: "Overall risk level"
              },
              static_analysis: {
                type: "object",
                properties: {
                  owasp_findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        title: { type: "string" },
                        severity: { type: "string" },
                        description: { type: "string" },
                        location: { type: "string" },
                        cwe_id: { type: "string" },
                        exploit_scenario: { type: "string" },
                        remediation: { type: "string" },
                        code_example: { type: "string" }
                      }
                    }
                  },
                  code_quality_issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        issue: { type: "string" },
                        impact: { type: "string" },
                        suggestion: { type: "string" }
                      }
                    }
                  }
                }
              },
              dynamic_analysis: {
                type: "object",
                properties: {
                  runtime_checks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        check_type: { type: "string" },
                        status: { type: "string" },
                        description: { type: "string" },
                        recommendation: { type: "string" }
                      }
                    }
                  },
                  api_security: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        endpoint: { type: "string" },
                        vulnerability: { type: "string" },
                        severity: { type: "string" },
                        fix: { type: "string" }
                      }
                    }
                  }
                }
              },
              dependency_scan: {
                type: "object",
                properties: {
                  vulnerable_packages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        package_name: { type: "string" },
                        current_version: { type: "string" },
                        vulnerable_version: { type: "string" },
                        severity: { type: "string" },
                        cve_ids: { type: "array", items: { type: "string" } },
                        fixed_version: { type: "string" },
                        remediation: { type: "string" }
                      }
                    }
                  },
                  outdated_packages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        package_name: { type: "string" },
                        current_version: { type: "string" },
                        latest_version: { type: "string" },
                        update_priority: { type: "string" }
                      }
                    }
                  }
                }
              },
              compliance_reports: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    standard: { type: "string" },
                    compliance_score: { type: "number" },
                    compliant_controls: { type: "array", items: { type: "string" } },
                    non_compliant_controls: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          control_id: { type: "string" },
                          control_name: { type: "string" },
                          gap: { type: "string" },
                          remediation: { type: "string" },
                          priority: { type: "string" }
                        }
                      }
                    },
                    recommendations: { type: "array", items: { type: "string" } }
                  }
                }
              },
              remediation_plan: {
                type: "object",
                properties: {
                  immediate_actions: { type: "array", items: { type: "string" } },
                  short_term: { type: "array", items: { type: "string" } },
                  long_term: { type: "array", items: { type: "string" } },
                  estimated_effort: { type: "string" }
                }
              },
              executive_summary: { type: "string" }
            },
            required: ["overall_security_score", "risk_level", "static_analysis", "executive_summary"]
          }
        });
      },
      validator: (result) => {
        if (!result.overall_security_score || result.overall_security_score < 0 || result.overall_security_score > 100) {
          return { valid: false, issues: ['Invalid security score'] };
        }
        if (!result.static_analysis?.owasp_findings) {
          return { valid: false, issues: ['Missing OWASP findings'] };
        }
        return { valid: true };
      }
    });

    // Store critical findings in SecurityFinding entity
    const newFindings = [];
    
    // Store OWASP findings
    if (auditResult.final_answer.static_analysis?.owasp_findings) {
      for (const finding of auditResult.final_answer.static_analysis.owasp_findings) {
        if (['critical', 'high'].includes(finding.severity?.toLowerCase())) {
          newFindings.push({
            project_id,
            source: 'security_audit_static',
            title: finding.title,
            severity: finding.severity.toLowerCase(),
            category: finding.category,
            description: finding.description,
            cwe_id: finding.cwe_id,
            location: finding.location,
            exploit_scenario: finding.exploit_scenario,
            remediation: finding.remediation,
            status: 'open'
          });
        }
      }
    }

    // Store dependency vulnerabilities
    if (auditResult.final_answer.dependency_scan?.vulnerable_packages) {
      for (const pkg of auditResult.final_answer.dependency_scan.vulnerable_packages) {
        if (['critical', 'high'].includes(pkg.severity?.toLowerCase())) {
          newFindings.push({
            project_id,
            source: 'dependency_scan',
            title: `Vulnerable dependency: ${pkg.package_name}`,
            severity: pkg.severity.toLowerCase(),
            category: 'A06:2021-Vulnerable and Outdated Components',
            description: `Package ${pkg.package_name} version ${pkg.current_version} has known vulnerabilities. CVEs: ${pkg.cve_ids?.join(', ') || 'N/A'}`,
            location: pkg.package_name,
            remediation: pkg.remediation || `Update to version ${pkg.fixed_version}`,
            status: 'open'
          });
        }
      }
    }

    // Bulk create findings
    if (newFindings.length > 0) {
      await base44.entities.SecurityFinding.bulkCreate(newFindings);
    }

    logger.metric('security_audit_complete', Date.now() - startTime, {
      project_id,
      audit_type,
      security_score: auditResult.final_answer.overall_security_score,
      risk_level: auditResult.final_answer.risk_level,
      new_findings: newFindings.length,
      confidence: auditResult.confidence
    });

    return createSuccessResponse({
      audit_report: auditResult.final_answer,
      new_findings_count: newFindings.length,
      metadata: {
        audit_type,
        compliance_standards,
        generated_at: new Date().toISOString(),
        confidence: auditResult.confidence,
        validated: auditResult.validated
      },
      reasoning: {
        stages_completed: auditResult.stages_completed,
        execution_time_ms: auditResult.execution_time_ms
      }
    }, correlationId);

  } catch (error) {
    logger.error('Security audit failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Security audit failed', correlationId);
  }
});

/**
 * Build comprehensive security audit prompt
 */
function buildSecurityAuditPrompt(context) {
  const { project, services, cicd, apis, existing_findings, code_samples, audit_config } = context;
  const { audit_type, compliance_standards, include_remediation, severity_threshold } = audit_config;

  return `You are an expert security architect conducting a comprehensive security audit.

PROJECT CONTEXT:
Name: ${project.name}
Description: ${project.description}
Architecture: ${project.architecture_pattern}

SERVICES (${services.length}):
${services.map(s => `- ${s.name} (${s.category}): ${s.technologies.join(', ')}`).join('\n')}

CI/CD PIPELINES (${cicd.length}):
${cicd.map(c => `- ${c.platform}: Security scanning ${c.security_scanning_enabled ? 'ENABLED' : 'DISABLED'}`).join('\n')}

API INTEGRATIONS (${apis.length}):
${apis.map(a => `- ${a.name}: ${a.auth_type} auth, ${a.endpoints_count} endpoints`).join('\n')}

EXISTING SECURITY FINDINGS: ${existing_findings.length}
Critical: ${existing_findings.filter(f => f.severity === 'critical').length}
High: ${existing_findings.filter(f => f.severity === 'high').length}

CODE SAMPLES ANALYZED: ${code_samples.length}
${code_samples.map(c => `- ${c.language}/${c.framework}: ${c.files_count} files`).join('\n')}

AUDIT REQUIREMENTS:
Audit Type: ${audit_type}
Compliance Standards: ${compliance_standards.join(', ')}
Include Remediation: ${include_remediation}
Severity Threshold: ${severity_threshold}

PERFORM COMPREHENSIVE SECURITY AUDIT:

1. **STATIC CODE ANALYSIS (OWASP Top 10 2021)**
   Analyze for all OWASP categories:
   ${OWASP_TOP_10.map(cat => `   - ${cat}`).join('\n')}
   
   For each finding, provide:
   - Category and CWE ID
   - Severity (critical/high/medium/low)
   - Detailed description
   - Location in codebase
   - Exploit scenario
   - Specific remediation steps
   - Code example (if applicable)

2. **DYNAMIC RUNTIME SECURITY**
   Assess runtime security posture:
   - Authentication mechanisms
   - Authorization checks
   - Session management
   - Input validation and sanitization
   - Output encoding
   - Error handling and logging
   - API security (rate limiting, CORS, headers)
   - Database security (parameterized queries, connection security)

3. **DEPENDENCY VULNERABILITY SCANNING**
   Identify vulnerable dependencies:
   - Known CVEs in used packages
   - Outdated versions with security patches
   - Transitive dependency risks
   - License compliance issues
   - Recommend fixed versions

4. **COMPLIANCE REPORTS**
   Generate compliance reports for: ${compliance_standards.join(', ')}
   
   For each standard:
   - Compliance score (0-100)
   - List of compliant controls
   - Non-compliant controls with gaps
   - Specific remediation for each gap
   - Priority ranking

5. **REMEDIATION PLAN**
   Provide actionable remediation plan:
   - Immediate actions (critical issues)
   - Short-term fixes (high severity, 1-2 weeks)
   - Long-term improvements (medium severity, 1-3 months)
   - Estimated effort for implementation

6. **EXECUTIVE SUMMARY**
   Write a clear, non-technical summary covering:
   - Overall security posture
   - Top 3 critical risks
   - Recommended immediate actions
   - Business impact of findings

OUTPUT REQUIREMENTS:
- Be specific and actionable
- Include code examples where relevant
- Prioritize findings by severity and exploitability
- Provide clear, step-by-step remediation
- Consider the microservices architecture in recommendations
- Reference industry standards and best practices
- Include compliance mapping for each finding`;
}