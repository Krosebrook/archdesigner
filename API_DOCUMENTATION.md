# ArchDesigner API Documentation
## Complete API Reference for Frontend and Backend

**Last Updated**: December 30, 2024  
**API Version**: 0.0.0  
**Base URL**: `https://api.archdesigner.base44.app` (production)

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base44 SDK Usage](#base44-sdk-usage)
- [Entity APIs](#entity-apis)
- [Serverless Function APIs](#serverless-function-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Examples](#api-examples)

---

## Overview

ArchDesigner's API is built on the Base44 platform, providing serverless functions for backend logic and entity-based data storage. The frontend interacts with the API through the Base44 SDK.

### API Architecture

```
Frontend (React)
     ↓
Base44 SDK
     ↓
Base44 API Gateway
     ↓
┌────────────┬─────────────┐
│   Entities │  Functions  │
│  (CRUD)    │  (Business  │
│            │   Logic)    │
└────────────┴─────────────┘
```

### Base URL

- **Production**: `https://api.archdesigner.base44.app`
- **Staging**: `https://staging.archdesigner.base44.app`
- **Development**: `http://localhost:5173` (local proxy)

---

## Authentication

### Authentication Flow

All API requests must include authentication via Base44 Auth.

```typescript
// Frontend authentication
import { createClient } from '@base44/sdk';

const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
  apiKey: import.meta.env.VITE_BASE44_API_KEY,
  region: import.meta.env.VITE_BASE44_REGION
});

// Login
const { user, token } = await base44.auth.login({
  email: 'user@example.com',
  password: 'password'
});

// Verify authentication
const isAuthenticated = await base44.auth.verify();

// Logout
await base44.auth.logout();
```

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
X-Base44-App-Id: <app_id>
Content-Type: application/json
```

---

## Base44 SDK Usage

### Initialize SDK

```typescript
// src/lib/base44Client.js
import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID,
  apiKey: import.meta.env.VITE_BASE44_API_KEY,
  region: import.meta.env.VITE_BASE44_REGION || 'us-east-1'
});

// For serverless functions
import { createClientFromRequest } from 'npm:@base44/sdk';

export function getBase44Client(req: Request) {
  return createClientFromRequest(req);
}
```

---

## Entity APIs

### Projects

#### List Projects

```typescript
// GET /entities/projects

const projects = await base44.entities.Project.list({
  filters: {
    status: { eq: 'active' },
    category: { in: ['web', 'mobile'] }
  },
  sort: { created_at: 'desc' },
  limit: 20,
  offset: 0
});

// Response
{
  items: [
    {
      id: "proj_abc123",
      name: "My Project",
      description: "Project description",
      status: "active",
      category: "web",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    }
  ],
  total: 100,
  hasMore: true
}
```

#### Get Project

```typescript
// GET /entities/projects/:id

const project = await base44.entities.Project.get('proj_abc123');

// Response
{
  id: "proj_abc123",
  name: "My Project",
  description: "Project description",
  status: "active",
  category: "web",
  architecture_pattern: "microservices",
  services: ["srv_123", "srv_456"],
  owner_id: "user_789",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

#### Create Project

```typescript
// POST /entities/projects

const project = await base44.entities.Project.create({
  name: "New Project",
  description: "Project description",
  category: "web",
  architecture_pattern: "microservices",
  status: "planning"
});

// Response
{
  id: "proj_new123",
  name: "New Project",
  ...
}
```

#### Update Project

```typescript
// PATCH /entities/projects/:id

const updated = await base44.entities.Project.update('proj_abc123', {
  name: "Updated Project Name",
  status: "development"
});

// Response
{
  id: "proj_abc123",
  name: "Updated Project Name",
  status: "development",
  ...
}
```

#### Delete Project

```typescript
// DELETE /entities/projects/:id

await base44.entities.Project.delete('proj_abc123');

// Response
{
  success: true,
  deleted_id: "proj_abc123"
}
```

### Services

#### List Services

```typescript
// GET /entities/services

const services = await base44.entities.Service.list({
  filters: {
    project_id: { eq: 'proj_abc123' },
    type: { in: ['api-gateway', 'microservice'] }
  }
});

// Response
{
  items: [
    {
      id: "srv_123",
      name: "API Gateway",
      type: "api-gateway",
      project_id: "proj_abc123",
      technologies: ["Node.js", "Express"],
      apis: [...],
      dependencies: ["srv_456"]
    }
  ]
}
```

#### Create Service

```typescript
// POST /entities/services

const service = await base44.entities.Service.create({
  name: "User Service",
  type: "microservice",
  project_id: "proj_abc123",
  technologies: ["Python", "FastAPI"],
  port: 8000,
  apis: [
    {
      method: "GET",
      path: "/users",
      description: "List users"
    }
  ]
});
```

---

## Serverless Function APIs

### Architecture Analysis

```typescript
// POST /functions/analyzeArchitecture

const analysis = await base44.integrations.ArchDesigner.analyzeArchitecture({
  project_id: "proj_abc123"
});

// Request body
{
  project_id: string;
}

// Response
{
  health_score: number;           // 0-100
  bottlenecks: Array<{
    service: string;
    issue: string;
    severity: "critical" | "high" | "medium" | "low";
    recommendation: string;
  }>;
  security_concerns: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  scalability: string[];
  performance: string[];
  missing_services: Array<{
    name: string;
    purpose: string;
    priority: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
}
```

### Security Audit

```typescript
// POST /functions/securityAudit

const audit = await base44.integrations.ArchDesigner.securityAudit({
  project_id: "proj_abc123",
  service_id: "srv_123" // optional
});

// Request body
{
  project_id: string;
  service_id?: string;
  standards?: Array<"SOC2" | "ISO27001" | "HIPAA" | "PCI-DSS" | "GDPR" | "NIST">;
}

// Response
{
  overall_score: number;          // 0-100
  owasp_compliance: {
    [key: string]: {
      status: "pass" | "fail" | "warning";
      details: string;
    }
  };
  findings: Array<{
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    affected_services: string[];
    cwe_id?: string;
    recommendation: string;
    code_example?: string;
  }>;
  compliance: {
    [standard: string]: {
      compliant: boolean;
      score: number;
      gaps: string[];
    }
  };
}
```

### Code Generation

```typescript
// POST /functions/generateCode

const code = await base44.integrations.ArchDesigner.generateCode({
  service_id: "srv_123",
  language: "typescript",
  framework: "express"
});

// Request body
{
  service_id: string;
  language: "typescript" | "python" | "go" | "java";
  framework: "express" | "fastapi" | "gin" | "spring-boot";
  include_tests?: boolean;
  include_docker?: boolean;
}

// Response
{
  files: Array<{
    path: string;
    content: string;
    description: string;
  }>;
  structure: {
    directories: string[];
    files: string[];
  };
  instructions: string;
  next_steps: string[];
}
```

### CI/CD Generation

```typescript
// POST /functions/generateCICD

const cicd = await base44.integrations.ArchDesigner.generateCICD({
  project_id: "proj_abc123",
  platform: "github-actions"
});

// Request body
{
  project_id: string;
  platform: "github-actions" | "gitlab-ci" | "jenkins";
  stages?: Array<"lint" | "test" | "build" | "deploy">;
  deployment_target?: "kubernetes" | "docker-swarm" | "cloud";
}

// Response
{
  config_file: string;
  content: string;
  setup_instructions: string[];
  secrets_required: Array<{
    name: string;
    description: string;
  }>;
}
```

### Documentation Generation

```typescript
// POST /functions/generateDocumentation

const docs = await base44.integrations.ArchDesigner.generateDocumentation({
  project_id: "proj_abc123",
  type: "api"
});

// Request body
{
  project_id: string;
  type: "api" | "architecture" | "deployment" | "user-guide";
  format?: "markdown" | "html" | "pdf";
}

// Response
{
  content: string;
  format: string;
  sections: string[];
  download_url?: string;
}
```

### Project Health Check

```typescript
// POST /functions/projectHealthCheck

const health = await base44.integrations.ArchDesigner.projectHealthCheck({
  project_id: "proj_abc123"
});

// Request body
{
  project_id: string;
}

// Response
{
  overall_health: number;         // 0-100
  categories: {
    architecture: number;
    security: number;
    performance: number;
    reliability: number;
    maintainability: number;
  };
  issues: Array<{
    category: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  trends: {
    last_7_days: number;
    last_30_days: number;
  };
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  error: {
    code: string;              // Error code (e.g., "VALIDATION_ERROR")
    message: string;           // Human-readable message
    details?: any;             // Additional error details
    correlation_id: string;    // For debugging
  },
  status: number               // HTTP status code
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication |
| `PERMISSION_DENIED` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Error Handling Example

```typescript
try {
  const project = await base44.entities.Project.get('proj_123');
} catch (error) {
  if (error.status === 404) {
    console.error('Project not found');
  } else if (error.status === 403) {
    console.error('Permission denied');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

---

## Rate Limiting

### Rate Limits

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Entity CRUD | 60 req/min | Per user |
| AI Agents | 10 req/min | Per user |
| Code Generation | 5 req/min | Per user |
| Security Audit | 5 req/min | Per user |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retry_after": 30
  },
  "status": 429
}
```

---

## API Examples

### Complete Project Creation Flow

```typescript
// 1. Create project
const project = await base44.entities.Project.create({
  name: "E-Commerce Platform",
  description: "Microservices-based e-commerce",
  category: "web",
  architecture_pattern: "microservices"
});

// 2. Add services
const apiGateway = await base44.entities.Service.create({
  name: "API Gateway",
  type: "api-gateway",
  project_id: project.id,
  technologies: ["Node.js", "Express"]
});

const userService = await base44.entities.Service.create({
  name: "User Service",
  type: "microservice",
  project_id: project.id,
  technologies: ["Python", "FastAPI"],
  dependencies: [apiGateway.id]
});

// 3. Analyze architecture
const analysis = await base44.integrations.ArchDesigner.analyzeArchitecture({
  project_id: project.id
});

console.log('Health Score:', analysis.health_score);

// 4. Run security audit
const audit = await base44.integrations.ArchDesigner.securityAudit({
  project_id: project.id,
  standards: ["OWASP", "SOC2"]
});

console.log('Security Score:', audit.overall_score);

// 5. Generate code
const code = await base44.integrations.ArchDesigner.generateCode({
  service_id: userService.id,
  language: "python",
  framework: "fastapi",
  include_tests: true,
  include_docker: true
});

console.log('Generated files:', code.files.length);
```

### React Component Example

```typescript
// Using React Query for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/base44Client';

function ProjectList() {
  const queryClient = useQueryClient();
  
  // Fetch projects
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });
  
  // Create project mutation
  const createProject = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
  
  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Projects</h1>
      {projects.items.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <button onClick={() => deleteProject.mutate(project.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={() => createProject.mutate({ name: 'New Project' })}>
        Create Project
      </button>
    </div>
  );
}
```

---

## Additional Resources

- [Base44 SDK Documentation](https://base44.com/docs/sdk)
- [Authentication Guide](https://base44.com/docs/auth)
- [Entity Schema Reference](https://base44.com/docs/entities)

---

**Note**: This is a living document. As the API evolves, this documentation will be updated. For the most up-to-date information, refer to the Base44 platform documentation.

---

**Maintained by**: Krosebrook Team  
**Last Updated**: December 30, 2024  
**Next Review**: Q1 2025
