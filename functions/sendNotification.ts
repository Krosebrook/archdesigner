import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { 
  generateCorrelationId, 
  createLogger, 
  ErrorCodes, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequired,
  validateEnum,
  validateEmail,
  sanitiseString,
  Permissions,
  hasPermission,
  auditLog,
  redactPII
} from './lib/utils.js';

/**
 * Notification Service
 * AXIS: Security (Email validation, RBAC for bulk send, audit logging)
 * 
 * Security Features:
 * - Email format validation
 * - Notification type enum validation
 * - RBAC for sending to others (NOTIFY_ALL permission)
 * - Input sanitisation
 * - Audit logging
 * - PII redaction in logs
 */

const ALLOWED_NOTIFICATION_TYPES = ['security_alert', 'deployment_complete', 'task_assigned', 'weekly_report', 'custom'];
const MAX_RECIPIENTS = 50;

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  const logger = createLogger(correlationId, 'sendNotification');
  const startTime = Date.now();

  try {
    logger.info('Notification request received');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', correlationId);
    }

    const body = await req.json();
    
    // PHASE 2.1: Input Validation
    const validation = validateRequired(body, ['type', 'subject']);
    if (!validation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Missing: ${validation.missing.join(', ')}`, correlationId);
    }

    const { 
      type, 
      project_id, 
      subject, 
      message, 
      recipients = [],
      data = {} 
    } = body;

    // Validate notification type
    const typeValidation = validateEnum(type, ALLOWED_NOTIFICATION_TYPES, 'type');
    if (!typeValidation.valid) {
      return createErrorResponse(ErrorCodes.VALIDATION, typeValidation.error, correlationId);
    }

    // PHASE 2.1: Validate and limit recipients
    if (recipients.length > MAX_RECIPIENTS) {
      return createErrorResponse(ErrorCodes.VALIDATION, `Maximum ${MAX_RECIPIENTS} recipients allowed`, correlationId);
    }

    // Validate email formats
    for (const email of recipients) {
      if (!validateEmail(email)) {
        return createErrorResponse(ErrorCodes.VALIDATION, `Invalid email format: ${redactPII(email)}`, correlationId);
      }
    }

    // PHASE 2.2: RBAC - Check permission for bulk notifications
    const sendingToOthers = recipients.length > 0 && !recipients.every(r => r === user.email);
    if (sendingToOthers && !hasPermission(user, Permissions.NOTIFY_ALL)) {
      logger.warn('Bulk notification permission denied', { user: user.email });
      return createErrorResponse(ErrorCodes.FORBIDDEN, 'Permission denied: cannot send notifications to other users', correlationId);
    }

    // PHASE 2.3: Audit log
    auditLog(logger, 'SEND_NOTIFICATION', user, { 
      type, 
      recipients_count: recipients.length,
      project_id 
    });

    // PHASE 2.1: Sanitise inputs
    const sanitisedSubject = sanitiseString(subject, 200);
    const sanitisedMessage = sanitiseString(message, 5000);
    const sanitisedData = {
      title: data.title ? sanitiseString(data.title, 200) : undefined,
      severity: data.severity,
      category: data.category,
      description: data.description ? sanitiseString(data.description, 2000) : undefined,
      remediation: data.remediation ? sanitiseString(data.remediation, 2000) : undefined,
      project_name: data.project_name ? sanitiseString(data.project_name, 200) : undefined,
      environment: data.environment,
      version: data.version,
      task_title: data.task_title ? sanitiseString(data.task_title, 200) : undefined,
      priority: data.priority,
      due_date: data.due_date,
      period: data.period,
      tasks_completed: data.tasks_completed,
      security_score: data.security_score,
      api_health: data.api_health
    };

    const notificationTemplates = {
      security_alert: {
        subject: `🚨 Security Alert: ${sanitisedData.title || 'New Finding'}`,
        body: `
A security issue has been detected in your project.

**Severity:** ${sanitisedData.severity || 'Unknown'}
**Category:** ${sanitisedData.category || 'General'}

**Description:**
${sanitisedData.description || sanitisedMessage}

**Recommended Action:**
${sanitisedData.remediation || 'Please review and address this issue.'}

---
ArchDesigner Security Scanner
        `
      },
      deployment_complete: {
        subject: `✅ Deployment Complete: ${sanitisedData.environment || 'Production'}`,
        body: `
Your deployment has completed successfully.

**Project:** ${sanitisedData.project_name || 'Unknown'}
**Environment:** ${sanitisedData.environment || 'Production'}
**Version:** ${sanitisedData.version || 'Latest'}
**Deployed by:** ${user.full_name}

---
ArchDesigner CI/CD
        `
      },
      task_assigned: {
        subject: `📋 Task Assigned: ${sanitisedData.task_title || 'New Task'}`,
        body: `
You have been assigned a new task.

**Task:** ${sanitisedData.task_title}
**Priority:** ${sanitisedData.priority || 'Medium'}
**Due Date:** ${sanitisedData.due_date || 'Not set'}

**Description:**
${sanitisedData.description || 'No description provided.'}

---
ArchDesigner Task Manager
        `
      },
      weekly_report: {
        subject: `📊 Weekly Project Report`,
        body: `
Here's your weekly project summary.

**Project:** ${sanitisedData.project_name}
**Period:** ${sanitisedData.period}

**Highlights:**
- Tasks Completed: ${sanitisedData.tasks_completed || 0}
- Security Score: ${sanitisedData.security_score || 'N/A'}
- API Health: ${sanitisedData.api_health || 'N/A'}

---
ArchDesigner Analytics
        `
      },
      custom: {
        subject: sanitisedSubject,
        body: sanitisedMessage
      }
    };

    const template = notificationTemplates[type];
    const emailRecipients = recipients.length > 0 ? recipients : [user.email];

    const results = await Promise.all(
      emailRecipients.map(email =>
        base44.integrations.Core.SendEmail({
          to: email,
          subject: template.subject,
          body: template.body,
          from_name: 'ArchDesigner'
        })
      )
    );

    logger.metric('notifications_sent', Date.now() - startTime, { 
      type, 
      recipients_count: emailRecipients.length 
    });

    return createSuccessResponse({
      sent_to: emailRecipients.length,
      type
    }, correlationId);

  } catch (error) {
    logger.error('Notification failed', error);
    return createErrorResponse(ErrorCodes.INTERNAL, 'Failed to send notification', correlationId);
  }
});