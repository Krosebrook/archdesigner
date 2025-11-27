import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Notification Service
 * Sends email notifications for project events
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      type, 
      project_id, 
      subject, 
      message, 
      recipients = [],
      data = {} 
    } = await req.json();

    if (!type || !subject) {
      return Response.json({ error: 'type and subject are required' }, { status: 400 });
    }

    const notificationTemplates = {
      security_alert: {
        subject: `🚨 Security Alert: ${data.title || 'New Finding'}`,
        body: `
A security issue has been detected in your project.

**Severity:** ${data.severity || 'Unknown'}
**Category:** ${data.category || 'General'}

**Description:**
${data.description || message}

**Recommended Action:**
${data.remediation || 'Please review and address this issue.'}

---
ArchDesigner Security Scanner
        `
      },
      deployment_complete: {
        subject: `✅ Deployment Complete: ${data.environment || 'Production'}`,
        body: `
Your deployment has completed successfully.

**Project:** ${data.project_name || 'Unknown'}
**Environment:** ${data.environment || 'Production'}
**Version:** ${data.version || 'Latest'}
**Deployed by:** ${user.full_name}

---
ArchDesigner CI/CD
        `
      },
      task_assigned: {
        subject: `📋 Task Assigned: ${data.task_title || 'New Task'}`,
        body: `
You have been assigned a new task.

**Task:** ${data.task_title}
**Priority:** ${data.priority || 'Medium'}
**Due Date:** ${data.due_date || 'Not set'}

**Description:**
${data.description || 'No description provided.'}

---
ArchDesigner Task Manager
        `
      },
      weekly_report: {
        subject: `📊 Weekly Project Report`,
        body: `
Here's your weekly project summary.

**Project:** ${data.project_name}
**Period:** ${data.period}

**Highlights:**
- Tasks Completed: ${data.tasks_completed || 0}
- Security Score: ${data.security_score || 'N/A'}
- API Health: ${data.api_health || 'N/A'}

---
ArchDesigner Analytics
        `
      },
      custom: {
        subject: subject,
        body: message
      }
    };

    const template = notificationTemplates[type] || notificationTemplates.custom;
    const emailRecipients = recipients.length > 0 ? recipients : [user.email];

    // Send emails
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

    return Response.json({
      success: true,
      sent_to: emailRecipients,
      type
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});