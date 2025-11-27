import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Security Vulnerability Scanner
 * Scans project architecture for security vulnerabilities
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, scan_type = 'full' } = await req.json();

    if (!project_id) {
      return Response.json({ error: 'project_id is required' }, { status: 400 });
    }

    const [projects, services, cicd, apis] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const scanResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Perform a comprehensive security analysis of this microservices architecture.

Project: ${project.name}
Services: ${JSON.stringify(services.map(s => ({
  name: s.name,
  technologies: s.technologies,
  apis: s.apis
})), null, 2)}

CI/CD Config: ${JSON.stringify(cicd[0] || {}, null, 2)}

APIs: ${JSON.stringify(apis.map(a => ({
  name: a.name,
  auth_type: a.auth_type,
  endpoints: a.endpoints
})), null, 2)}

Analyze for:
1. OWASP Top 10 vulnerabilities
2. Authentication/Authorization weaknesses
3. Data exposure risks
4. CI/CD security gaps
5. Dependency vulnerabilities
6. Network security issues
7. Secrets management
8. Container security (if applicable)`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          risk_level: { type: "string" },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                severity: { type: "string" },
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
      }
    });

    // Save findings to database
    const findingsToSave = scanResult.findings.map(f => ({
      project_id,
      source: 'code_scan',
      title: f.title,
      severity: f.severity,
      category: f.category,
      cwe_id: f.cwe_id,
      description: f.description,
      location: f.location,
      exploit_scenario: f.exploit_scenario,
      remediation: f.remediation,
      status: 'open'
    }));

    if (findingsToSave.length > 0) {
      await base44.entities.SecurityFinding.bulkCreate(findingsToSave);
    }

    return Response.json({
      success: true,
      scan_result: scanResult
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});