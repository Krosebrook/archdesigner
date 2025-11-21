/**
 * AI AGENT SYSTEM DOCUMENTATION
 * 
 * This component serves as inline documentation for the AI Agent System.
 * Reference for agent capabilities, usage, and integration patterns.
 */

export const AGENT_SYSTEM_DOCS = {
  overview: `
    The ArchDesigner platform includes 9 specialized AI agents providing intelligent 
    automation across development, operations, security, and architecture domains.
    All agents support WhatsApp integration for mobile-first workflows.
  `,
  
  agents: {
    devops_agent: {
      file: 'agents/devops_agent.json',
      specialization: 'CI/CD pipeline management, deployments, infrastructure',
      capabilities: [
        'Generate pipeline configs (GitHub Actions, GitLab CI, Bitbucket)',
        'Optimize build times and resource usage',
        'Configure cloud deployments (AWS, Azure, GCP)',
        'Troubleshoot pipeline failures',
        'Implement security scanning',
        'Set up monitoring and alerting'
      ],
      entities: ['CICDConfiguration', 'IntegrationConnection', 'Project', 'Service', 'CICDAutomation'],
      examplePrompts: [
        'Generate a GitHub Actions pipeline for my Node.js microservice',
        'Optimize my CI/CD build time',
        'Set up blue-green deployment on AWS'
      ]
    },
    
    security_agent: {
      file: 'agents/security_agent.json',
      specialization: 'Vulnerability scanning, code review, security best practices',
      capabilities: [
        'Scan code for vulnerabilities (OWASP Top 10, CWE)',
        'Review CI/CD pipelines for security misconfigurations',
        'Analyze API endpoints for security risks',
        'Audit deployment configurations',
        'Recommend remediation strategies',
        'Implement security scanning tools (SAST, DAST, SCA)',
        'Link findings to issue trackers'
      ],
      entities: ['SecurityFinding', 'Project', 'Service', 'CICDConfiguration', 'IntegrationConnection']
    },
    
    api_agent: {
      file: 'agents/api_agent.json',
      specialization: 'API integration, testing, optimization, monitoring',
      capabilities: [
        'Generate API specifications and documentation',
        'Test API endpoints and analyze responses',
        'Monitor performance and detect anomalies',
        'Predict potential failures',
        'Recommend optimization strategies',
        'Debug integration issues',
        'Generate analytics reports'
      ],
      entities: ['APIIntegration', 'APILog', 'APIAnalytics', 'Service', 'Project']
    },
    
    documentation_agent: {
      file: 'agents/documentation_agent.json',
      specialization: 'Auto-generating comprehensive technical documentation',
      capabilities: [
        'Generate README files',
        'Create API documentation with examples',
        'Write service-specific docs',
        'Generate ADRs',
        'Produce changelogs',
        'Create onboarding guides',
        'Document CI/CD pipelines',
        'Maintain knowledge base'
      ],
      entities: ['Documentation', 'KnowledgeBase', 'Project', 'Service', 'CICDConfiguration']
    },
    
    architect_agent: {
      file: 'agents/architect_agent.json',
      specialization: 'Senior software architect for system design and patterns',
      capabilities: [
        'Architecture design and review',
        'Microservices decomposition',
        'Communication pattern recommendations',
        'Technology stack selection',
        'Scalability architecture',
        'Service discovery design',
        'Database architecture',
        'Architecture refactoring',
        'Cost optimization'
      ],
      entities: ['Project', 'Service', 'ServiceDiscovery', 'ArchitectureRefinement', 'ValidationReport', 'DependencyGraph', 'Task']
    },
    
    code_review_agent: {
      file: 'agents/code_review_agent.json',
      specialization: 'Code quality assurance and standards enforcement',
      capabilities: [
        'Comprehensive code reviews',
        'Identify code smells and anti-patterns',
        'Suggest refactoring opportunities',
        'Enforce coding standards',
        'Review for performance issues',
        'Check security vulnerabilities',
        'Ensure error handling',
        'Verify test coverage',
        'Recommend design patterns'
      ],
      entities: ['CodeReview', 'RefactoringRecommendation', 'Service', 'Project', 'SecurityFinding']
    },
    
    architecture_assistant: {
      file: 'agents/architecture_assistant.json',
      specialization: 'AI-powered architecture assistant for system design',
      capabilities: [
        'Design scalable architectures',
        'Recommend architectural patterns',
        'Analyze service dependencies',
        'Suggest technology stacks',
        'Identify anti-patterns',
        'Guide service decomposition',
        'Create architecture diagrams',
        'Validate architectural decisions'
      ],
      entities: ['Project', 'Service', 'ServiceDiscovery', 'ArchitectureRefinement', 'ArchitectureVisualization', 'ValidationReport', 'DependencyGraph']
    },
    
    project_manager: {
      file: 'agents/project_manager.json',
      specialization: 'Task prioritization, planning, team coordination',
      capabilities: [
        'Prioritize tasks by value and dependencies',
        'Create project plans and timelines',
        'Identify blockers and resolutions',
        'Coordinate team activities',
        'Track project progress and velocity',
        'Generate sprint plans',
        'Recommend task assignments',
        'Create status reports',
        'Identify risks and mitigations'
      ],
      entities: ['Task', 'Project', 'Service', 'KnowledgeBase', 'CollaborationSession', 'AICollaborationInsight']
    },
    
    performance_optimizer: {
      file: 'agents/performance_optimizer.json',
      specialization: 'System tuning, bottleneck detection, resource efficiency',
      capabilities: [
        'Identify performance bottlenecks',
        'Analyze response times and latency',
        'Recommend caching strategies',
        'Optimize database queries',
        'Tune API endpoints',
        'Implement load balancing',
        'Memory and CPU optimization',
        'Network optimization',
        'Cost optimization'
      ],
      entities: ['PerformanceTuning', 'PerformanceMetric', 'Service', 'APIIntegration', 'APILog', 'Project', 'APIGateway']
    }
  },
  
  whatsappIntegration: {
    accessURL: "base44.agents.getWhatsAppConnectURL('agent_name')",
    authenticationFlow: [
      '1. User clicks WhatsApp link',
      '2. If not authenticated, redirects to login',
      '3. After login, returns to WhatsApp setup',
      '4. Agent initiates conversation with greeting'
    ],
    exampleUsage: `
      <a href={base44.agents.getWhatsAppConnectURL('devops_agent')} target="_blank">
        💬 Connect DevOps Agent
      </a>
    `
  },
  
  conversationAPI: {
    createConversation: `
      const conversation = await base44.agents.createConversation({
        agent_name: "security_agent",
        metadata: { project_id: projectId }
      });
    `,
    
    addMessage: `
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: "Scan my project for vulnerabilities"
      });
    `,
    
    subscribeToUpdates: `
      base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages);
      });
    `
  },
  
  entityOperations: {
    create: 'Generate new records (findings, tasks, documentation)',
    read: 'Query existing data for analysis',
    update: 'Modify configurations, status, recommendations',
    delete: 'Remove obsolete records (requires explicit permission)'
  },
  
  bestPractices: {
    agentSelection: {
      development: ['Code Review Agent', 'Architect Agent'],
      operations: ['DevOps Agent', 'Performance Optimizer'],
      security: ['Security Agent'],
      apis: ['API Management Agent'],
      planning: ['Project Manager Agent'],
      documentation: ['Documentation Agent']
    },
    
    promptEngineering: [
      'Be specific about context (project, service, technology)',
      'Include relevant details (errors, metrics, constraints)',
      'Ask for actionable recommendations',
      'Request code examples when applicable'
    ],
    
    security: [
      'Agents respect Row-Level Security (RLS) policies',
      'User email tracked in created_by field',
      'Admin users have broader access',
      'Review agent-generated records before production'
    ]
  },
  
  troubleshooting: {
    agentNotResponding: [
      'Check network connectivity',
      'Verify LLM service status',
      'Review conversation logs'
    ],
    
    permissionDenied: [
      'Agent lacks entity access',
      'Check tool_configs in agent JSON',
      'Verify user RLS permissions'
    ],
    
    incompleteResponses: [
      'Provide more context in prompts',
      'Break complex requests into steps',
      'Check agent instructions for scope'
    ]
  }
};