import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  getCached,
  setCache
} from './lib/utils.js';

/**
 * Project Health Check
 * AXIS: Performance (caching), Architecture, Observability
 * 
 * Features:
 * - Response caching (60s TTL)
 * - Parallel data fetching
 * - Structured metrics
 * - Health score calculation with weighted factors
 */
Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'projectHealthCheck');
  const startTime = Date.now();

  try {
    logger.info('Health check initiated');
    
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

    const { project_id } = body;

    // PERFORMANCE: Check cache first
    const cacheKey = `health_${project_id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      logger.info('Cache hit', { project_id });
      return createSuccessResponse(cached, correlationId, { cached: true });
    }

    logger.info('Cache miss, computing health', { project_id });

    // PERFORMANCE: Parallel data fetching (6 concurrent queries)
    const [
      projects,
      services,
      tasks,
      securityFindings,
      apis,
      cicd
    ] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.Service.filter({ project_id }),
      base44.entities.Task.filter({ project_id }),
      base44.entities.SecurityFinding.filter({ project_id }),
      base44.entities.APIIntegration.filter({ project_id }),
      base44.entities.CICDConfiguration.filter({ project_id })
    ]);

    const project = projects[0];
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate metrics
    const openSecurityIssues = securityFindings.filter(f => f.status === 'open');
    const criticalSecurity = openSecurityIssues.filter(f => f.severity === 'critical').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

    // Calculate health scores
    const securityScore = Math.max(0, 100 - (criticalSecurity * 20) - (openSecurityIssues.length * 5));
    const taskScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100;
    const apiScore = apis.reduce((acc, api) => acc + (api.metrics?.success_rate || 100), 0) / Math.max(apis.length, 1);
    const cicdScore = cicd.length > 0 ? 85 : 40;

    const overallScore = Math.round(
      (securityScore * 0.3) +
      (taskScore * 0.25) +
      (apiScore * 0.25) +
      (cicdScore * 0.2)
    );

    const healthReport = {
      overall_score: overallScore,
      status: overallScore >= 80 ? 'healthy' : overallScore >= 60 ? 'warning' : 'critical',
      metrics: {
        security: {
          score: Math.round(securityScore),
          open_issues: openSecurityIssues.length,
          critical: criticalSecurity,
          high: openSecurityIssues.filter(f => f.severity === 'high').length
        },
        tasks: {
          score: Math.round(taskScore),
          total: tasks.length,
          completed: completedTasks,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          blocked: blockedTasks
        },
        apis: {
          score: Math.round(apiScore),
          total: apis.length,
          active: apis.filter(a => a.status === 'active').length,
          avg_response_time: Math.round(
            apis.reduce((acc, a) => acc + (a.metrics?.avg_response_time || 0), 0) / Math.max(apis.length, 1)
          )
        },
        cicd: {
          score: cicdScore,
          configured: cicd.length > 0,
          platform: cicd[0]?.platform || 'none'
        },
        services: {
          total: services.length,
          categories: [...new Set(services.map(s => s.category))].length
        }
      },
      recommendations: []
    };

    // Generate recommendations
    if (criticalSecurity > 0) {
      healthReport.recommendations.push({
        priority: 'critical',
        area: 'security',
        message: `Address ${criticalSecurity} critical security vulnerabilities immediately`
      });
    }
    if (blockedTasks > 2) {
      healthReport.recommendations.push({
        priority: 'high',
        area: 'tasks',
        message: `${blockedTasks} tasks are blocked - review dependencies`
      });
    }
    if (cicd.length === 0) {
      healthReport.recommendations.push({
        priority: 'medium',
        area: 'cicd',
        message: 'Set up CI/CD pipeline for automated deployments'
      });
    }
    if (services.length > 0 && apis.length === 0) {
      healthReport.recommendations.push({
        priority: 'medium',
        area: 'api',
        message: 'Define API specifications for your services'
      });
    }

    // PERFORMANCE: Cache the result
    setCache(cacheKey, healthReport, 60000);

    logger.metric('health_check_complete', Date.now() - startTime, {
      project_id,
      overall_score: healthReport.overall_score,
      status: healthReport.status
    });

    return createSuccessResponse(healthReport, correlationId);

  } catch (error) {
    logger.error('Health check failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, error.message, correlationId);
  }
});