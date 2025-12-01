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
  sanitiseLLMInput,
  filterSensitiveForLLM,
  enforceOwnership,
  auditLog,
  // Phase 3: Advanced CoT with dual-path
  executeAdvancedCoTReasoning,
  executeDualPathReasoning,
  validateCoTOutput,
  CoTStages
} from './lib/utils.js';

/**
 * Security Vulnerability Scanner
 * AXIS: Quality, CoT Reasoning (Phase 3)
 * 
 * Phase 3 Features:
 * - 3.1: Decomposed into focused helper functions
 * - 3.3: Explicit security analysis stages
 * - 3.4: Structured CoT output with findings
 * - 3.5: Dual-path reasoning for critical security decisions
 */

const ALLOWED_SCAN_TYPES = ['full', 'quick', 'cicd', 'api'];

// 3.1: Extracted helper - prepare context for analysis
function prepareSecurityContext(project, services, cicd, apis) {
  return {
    project: {
      name: sanitiseString(project.name, 200),
      category: project.category
    },
    services: services.map(s => ({
      name: sanitiseString(s.name, 100),
      technologies: s.technologies || [],
      has_apis: (s.apis?.length || 0) > 0
    })),
    cicd: cicd[0] ? {
      platform: cicd[0].platform,
      has_security_scanning: cicd[0].pipeline_stages?.security_scanning?.enabled || false
    } : null,
    apis: apis.map(a => ({
      name: sanitiseString(a.name, 100),
      auth_type: a.auth_type,
      endpoints_count: a.endpoints?.length || 0
    }))
  };
}

// 3.1: Extracted helper - build security analysis prompt with CoT stages
function buildSecurityPrompt(context, scanType) {
  // 3.3: Explicit reasoning stages for security analysis
  return sanitiseLLMInput(`You are a senior security engineer performing a ${scanType} security assessment.

TASK: Identify vulnerabilities and security risks in this microservices architecture.

REASONING STAGES (follow these explicitly and document your thinking):

1. INPUT GATHERING:
   - Inventory all services, APIs, and their authentication methods
   - Note the CI/CD configuration and security scanning status
   - List technologies that may have known vulnerabilities

2. CONTEXTUAL ANALYSIS:
   - Map the attack surface (exposed endpoints, data flows)
   - Identify trust boundaries between services
   - Assess authentication/authorization coverage

3. PROBLEM IDENTIFICATION (focus on OWASP Top 10):
   - A01: Broken Access Control
   - A02: Cryptographic Failures
   - A03: Injection vulnerabilities
   - A04: Insecure Design
   - A05: Security Misconfiguration
   - A06: Vulnerable Components
   - A07: Authentication Failures
   - A08: Data Integrity Failures
   - A09: Logging/Monitoring Gaps
   - A10: Server-Side Request Forgery

4. RECOMMENDATION GENERATION:
   - Prioritize findings by severity (critical, high, medium, low)
   - Provide specific remediation steps
   - Include CWE IDs where applicable

5. OUTPUT FORMATTING:
   - Calculate overall security score (0-100, lower = more risk)
   - Classify risk level (critical, high, medium, low)
   - Structure findings for actionability

CONTEXT:
${JSON.stringify(context, null, 2)}

Analyze thoroughly and provide structured findings.`);
}

// 3.4: Structured output schema
const SECURITY_SCAN_SCHEMA = {
  type: "object",
  properties: {
    overall_score: { type: "number" },
    risk_level: { type: "string", enum: ["critical", "high", "medium", "low"] },
    reasoning_steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string" },
          observations: { type: "array", items: { type: "string" } },
          confidence: { type: "number" }
        }
      }
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          category: { type: "string" },
          cwe_id: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          exploit_scenario: { type: "string" },
          remediation: { type: "string" }
        }
      }
    },
    summary: {
      type: "object",
      properties: {
        critical: { type: "number" },
        high: { type: "number" },
        medium: { type: "number" },
        low: { type: "number" }
      }
    },
    recommendations: {
      type: "array",
      items: { type: "string" }
    }
  }
};

// 3.5: Validation schema
const VALIDATION_SCHEMA = {
  requiredFields: ['overall_score', 'risk_level', 'findings'],
  fieldTypes: {
    overall_score: 'number',
    findings: 'array',
    recommendations: 'array'
  }
};

// 3.1: Extracted helper - validate scan results
function validateScanResult(result) {
  const cotValidation = validateCoTOutput(result, VALIDATION_SCHEMA);
  
  if (!cotValidation.valid) {
    return { valid: false, issues: cotValidation.issues };
  }

  // Validate score range
  if (result.overall_score < 0 || result.overall_score > 100) {
    return { valid: false, issues: ['overall_score must be between 0 and 100'] };
  }

  // Validate findings have required fields
  for (const finding of result.findings || []) {
    if (!finding.title || !finding.severity) {
      return { valid: false, issues: ['Each finding must have title and severity'] };
    }
  }

  return { valid: true, score: cotValidation.score };
}

// 3.1: Extracted helper - prepare findings for database
function prepareFindingsForStorage(findings, projectId) {
  return (findings || []).map(f => ({
    project_id: projectId,
    source: 'code_scan',
    title: sanitiseString(f.title, 200),
    severity: f.severity,
    category: f.category || 'general',
    cwe_id: f.cwe_id,
    description: sanitiseString(f.description, 2000),
    location: sanitiseString(f.location, 500),
    exploit_scenario: sanitiseString(f.exploit_scenario, 1000),
    remediation: sanitiseString(f.remediation, 1000),
    status: 'open'
  }));
}

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'securityScan');
  const startTime = Date.now();

  try {
    logger.info('Security scan initiated');
    
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

    const { project_id, scan_type = 'full' } = body;

    // Validate scan type
    const typeValidation = validateEnum(scan_type, ALLOWED_SCAN_TYPES, 'scan_type');
    if (!typeValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, typeValidation.error, correlationId);
    }

    logger.info('Starting scan', { project_id, scan_type });

    // Parallel data fetching
    const [projects, services, cicd, apis] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, 'Project not found', correlationId);
    }

    // RBAC check
    const ownershipError = enforceOwnership(user, project, correlationId, logger);
    if (ownershipError) return ownershipError;

    // Audit log for security scan
    auditLog(logger, 'SECURITY_SCAN', user, { project_id, scan_type });

    // Prepare context
    const securityContext = prepareSecurityContext(project, services, cicd, apis);

    // 3.5: Use dual-path reasoning for full security scans
    const useDualPath = scan_type === 'full';
    
    let scanResult;
    
    if (useDualPath) {
      // Dual-path: Run two analyses with different perspectives
      const dualResult = await executeDualPathReasoning({
        task: 'security_scan',
        context: securityContext,
        logger,
        executorA: async (ctx) => {
          const prompt = buildSecurityPrompt(ctx, scan_type);
          return await base44.integrations.Core.InvokeLLM({
            prompt: prompt + '\n\nPerspective: Focus on EXTERNAL attack vectors and exposed surfaces.',
            response_json_schema: SECURITY_SCAN_SCHEMA
          });
        },
        executorB: async (ctx) => {
          const prompt = buildSecurityPrompt(ctx, scan_type);
          return await base44.integrations.Core.InvokeLLM({
            prompt: prompt + '\n\nPerspective: Focus on INTERNAL threats, misconfigurations, and insider risks.',
            response_json_schema: SECURITY_SCAN_SCHEMA
          });
        }
      });

      scanResult = dualResult.final_answer;
      
      logger.info('Dual-path analysis complete', {
        agreement_score: dualResult.reasoning_quality.agreement_score,
        resolution_method: dualResult.reasoning_quality.resolution_method
      });
    } else {
      // Single-path for quick scans
      const cotResult = await executeAdvancedCoTReasoning({
        task: 'security_scan',
        context: securityContext,
        logger,
        outputSchema: VALIDATION_SCHEMA,
        executor: async (ctx) => {
          const prompt = buildSecurityPrompt(ctx, scan_type);
          return await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: SECURITY_SCAN_SCHEMA
          });
        },
        validator: validateScanResult
      });

      scanResult = cotResult.final_answer;
    }

    // Prepare and save findings
    const findingsToSave = prepareFindingsForStorage(scanResult.findings, project_id);

    if (findingsToSave.length > 0) {
      await base44.entities.SecurityFinding.bulkCreate(findingsToSave);
    }

    logger.metric('security_scan_complete', Date.now() - startTime, {
      project_id,
      scan_type,
      findings_count: findingsToSave.length,
      critical_count: scanResult.summary?.critical || 0,
      risk_level: scanResult.risk_level,
      dual_path_used: useDualPath
    });

    return createSuccessResponse({
      scan_result: scanResult,
      scan_metadata: {
        scan_type,
        scanned_at: new Date().toISOString(),
        findings_saved: findingsToSave.length,
        dual_path_analysis: useDualPath
      }
    }, correlationId);

  } catch (error) {
    logger.error('Security scan failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Security scan failed', correlationId);
  }
});