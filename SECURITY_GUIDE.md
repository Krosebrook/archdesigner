# ArchDesigner Security Guide
## Comprehensive Security Standards and Best Practices

**Last Updated**: December 30, 2024  
**Version**: 0.0.0  
**Security Level**: Enterprise-Grade

---

## Table of Contents

- [Overview](#overview)
- [Security Architecture](#security-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [API Security](#api-security)
- [LLM Security](#llm-security)
- [Frontend Security](#frontend-security)
- [Backend Security](#backend-security)
- [Infrastructure Security](#infrastructure-security)
- [Compliance](#compliance)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

---

## Overview

ArchDesigner implements defense-in-depth security principles across all layers. This document outlines security measures, best practices, and compliance requirements.

**Security Principles**:
1. **Least Privilege** - Minimum necessary permissions
2. **Defense in Depth** - Multiple security layers
3. **Fail Secure** - Fail closed, not open
4. **Zero Trust** - Verify everything
5. **Encryption Everywhere** - Data encrypted at rest and in transit

**Current Security Posture**:
- ✅ OWASP Top 10 compliance checking
- ✅ Input sanitization framework
- ✅ Authentication via Base44 Auth
- ✅ Role-based access control (RBAC)
- ✅ Audit logging
- ⚠️ Dependency vulnerabilities (in progress)
- ⚠️ Rate limiting (partial implementation)

---

## Security Architecture

```
┌─────────────────────────────────────────────┐
│              Security Layers                │
├─────────────────────────────────────────────┤
│                                             │
│  Layer 1: Network Security                 │
│  - CDN/WAF (CloudFlare)                    │
│  - DDoS Protection                         │
│  - Rate Limiting                           │
│                                             │
│  Layer 2: Application Security             │
│  - Authentication (Base44 Auth)            │
│  - Authorization (RBAC)                    │
│  - Input Validation                        │
│  - Output Encoding                         │
│                                             │
│  Layer 3: Data Security                    │
│  - Encryption at Rest (AES-256)           │
│  - Encryption in Transit (TLS 1.3)        │
│  - PII Redaction                          │
│  - Access Logging                         │
│                                             │
│  Layer 4: Infrastructure Security          │
│  - Secure Configuration                   │
│  - Vulnerability Scanning                 │
│  - Security Patching                      │
│  - Backup Encryption                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────┐      1. Login Request      ┌──────────────┐
│  User   │ ───────────────────────────>│ Base44 Auth  │
└─────────┘                             └──────────────┘
     │                                         │
     │  2. Email/Password                     │ 3. Validate
     │     or OAuth                            │    Credentials
     │                                         │
     │  4. JWT Token                          │
     │<────────────────────────────────────────┤
     │                                         │
     │  5. API Request + Token                │
     │ ───────────────────────────────────────>│
     │                                         │
     │  6. Verify Token                        │
     │     Check Permissions                   │
     │                                         │
     │  7. Response                            │
     │<────────────────────────────────────────┤
```

### Authentication Implementation

```typescript
// lib/auth.ts
import { createClientFromRequest } from 'npm:@base44/sdk';

export async function authenticate(req: Request) {
  const base44 = createClientFromRequest(req);
  
  try {
    // Verify authentication
    const auth = await base44.auth.verify();
    if (!auth.authenticated) {
      throw new Error('Not authenticated');
    }
    
    return {
      user: auth.user,
      roles: auth.roles,
      permissions: auth.permissions
    };
  } catch (error) {
    throw new Error('Authentication failed');
  }
}
```

### Authorization (RBAC)

```typescript
// lib/rbac.ts

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

export enum Permission {
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  SERVICE_CREATE = 'service:create',
  SERVICE_READ = 'service:read',
  SERVICE_UPDATE = 'service:update',
  SERVICE_DELETE = 'service:delete',
  AI_AGENT_USE = 'ai:use',
  SECURITY_AUDIT = 'security:audit'
}

const ROLE_PERMISSIONS = {
  [Role.ADMIN]: [
    // All permissions
    ...Object.values(Permission)
  ],
  [Role.USER]: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.SERVICE_CREATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.AI_AGENT_USE
  ],
  [Role.VIEWER]: [
    Permission.PROJECT_READ,
    Permission.SERVICE_READ
  ]
};

export function hasPermission(
  user: { roles: Role[] },
  permission: Permission
): boolean {
  return user.roles.some(role => 
    ROLE_PERMISSIONS[role]?.includes(permission)
  );
}

export function requirePermission(permission: Permission) {
  return async (req: Request) => {
    const { user } = await authenticate(req);
    
    if (!hasPermission(user, permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
    
    return user;
  };
}

// Usage in function
Deno.serve(async (req) => {
  const user = await requirePermission(Permission.PROJECT_CREATE)(req);
  
  // User has permission, proceed...
});
```

### Session Management

```typescript
// Secure session configuration
const sessionConfig = {
  httpOnly: true,        // Prevent XSS access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // Prevent CSRF
  maxAge: 3600000,       // 1 hour
  path: '/'
};

// Session refresh
async function refreshSession(token: string) {
  // Verify old token
  const decoded = await verifyToken(token);
  
  // Issue new token (sliding window)
  const newToken = await issueToken(decoded.userId);
  
  return newToken;
}

// Session timeout
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

// Logout on inactivity
let lastActivity = Date.now();

window.addEventListener('mousemove', () => {
  lastActivity = Date.now();
});

setInterval(() => {
  if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    logout();
  }
}, 60000); // Check every minute
```

---

## Data Protection

### Encryption at Rest

```typescript
// Sensitive data encryption
import { encrypt, decrypt } from './lib/encryption.ts';

// Encrypt before storing
const sensitiveData = {
  api_key: 'secret_key_here',
  password: 'user_password'
};

const encrypted = await encrypt(JSON.stringify(sensitiveData));

// Store encrypted data
await db.store({
  userId: user.id,
  encryptedData: encrypted
});

// Decrypt when needed
const retrieved = await db.get(userId);
const decrypted = await decrypt(retrieved.encryptedData);
const data = JSON.parse(decrypted);
```

### Encryption in Transit

```javascript
// Enforce HTTPS
if (window.location.protocol !== 'https:') {
  window.location.protocol = 'https:';
}

// TLS configuration
const tlsConfig = {
  minVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ]
};
```

### PII Handling

```typescript
// Redact PII from logs
export function redactPII(data: any): any {
  const piiFields = [
    'password',
    'ssn',
    'credit_card',
    'email',
    'phone',
    'address'
  ];
  
  if (typeof data !== 'object') return data;
  
  const redacted = { ...data };
  
  for (const field of piiFields) {
    if (field in redacted) {
      redacted[field] = '***REDACTED***';
    }
  }
  
  return redacted;
}

// Usage
logger.info('User data', redactPII(userData));
```

### Data Retention

```typescript
// Automatic data deletion policy
const RETENTION_POLICIES = {
  logs: 90,              // 90 days
  sessions: 30,          // 30 days
  archived_projects: 365, // 1 year
  deleted_users: 30      // 30 days (soft delete)
};

// Cleanup job (runs daily)
async function cleanupOldData() {
  const now = Date.now();
  
  // Delete old logs
  await db.logs.deleteWhere({
    created_at: { lt: now - RETENTION_POLICIES.logs * 24 * 60 * 60 * 1000 }
  });
  
  // Delete old sessions
  await db.sessions.deleteWhere({
    last_activity: { lt: now - RETENTION_POLICIES.sessions * 24 * 60 * 60 * 1000 }
  });
}
```

---

## Input Validation & Sanitization

### Frontend Validation

```typescript
// Form validation with Zod
import { z } from 'zod';

const ProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Invalid characters'),
  
  description: z.string()
    .max(2000, 'Description too long')
    .optional(),
  
  email: z.string()
    .email('Invalid email')
    .optional(),
  
  url: z.string()
    .url('Invalid URL')
    .optional()
});

// Usage
function CreateProjectForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ProjectSchema)
  });
  
  const onSubmit = (data: any) => {
    // Data is validated
    createProject(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

### Backend Validation

```typescript
// Backend validation (defense in depth)
import { sanitiseString, validateSchema } from './lib/utils.ts';

Deno.serve(async (req) => {
  const body = await req.json();
  
  // 1. Sanitize inputs
  const sanitized = {
    name: sanitiseString(body.name, 100),
    description: sanitiseString(body.description, 2000)
  };
  
  // 2. Validate schema
  const validation = validateSchema(sanitized, {
    name: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 2000 }
  });
  
  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: validation.errors
    }), { status: 400 });
  }
  
  // 3. Proceed with clean data
  const project = await createProject(sanitized);
  
  return new Response(JSON.stringify(project), { status: 201 });
});
```

### XSS Prevention

```typescript
// Sanitize HTML content
import DOMPurify from 'dompurify';

// Sanitize user-generated HTML
function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href']
  });
}

// Usage in React
function UserContent({ content }: { content: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHTML(content)
      }}
    />
  );
}
```

### SQL Injection Prevention

```typescript
// Use parameterized queries (Base44 handles this)
// NEVER concatenate user input into queries

// Bad (vulnerable)
const query = `SELECT * FROM projects WHERE name = '${userInput}'`;

// Good (safe)
const projects = await base44.entities.Project.list({
  filters: { name: { eq: userInput } }
});
```

---

## API Security

### Rate Limiting

```typescript
// Rate limiter implementation
interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/projects': { windowMs: 60000, max: 60 },      // 60 req/min
  '/api/ai-agent': { windowMs: 60000, max: 10 },      // 10 req/min (expensive)
  '/api/security-audit': { windowMs: 60000, max: 5 }, // 5 req/min (very expensive)
};

async function checkRateLimit(req: Request, userId: string): Promise<boolean> {
  const path = new URL(req.url).pathname;
  const config = RATE_LIMITS[path];
  
  if (!config) return true; // No limit for this endpoint
  
  const key = `ratelimit:${userId}:${path}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get recent requests
  const requests = await redis.zrangebyscore(key, windowStart, now);
  
  if (requests.length >= config.max) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  await redis.zadd(key, now, `${now}`);
  await redis.expire(key, config.windowMs / 1000);
  
  return true;
}

// Usage
Deno.serve(async (req) => {
  const { user } = await authenticate(req);
  
  const allowed = await checkRateLimit(req, user.id);
  if (!allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }
  
  // Process request...
});
```

### API Key Security

```typescript
// Rotate API keys regularly
async function rotateAPIKey(userId: string) {
  const newKey = generateSecureKey();
  const hashedKey = await hashKey(newKey);
  
  await db.apiKeys.update(userId, {
    key: hashedKey,
    rotatedAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  });
  
  // Return unhashed key only once
  return newKey;
}

// Validate API key
async function validateAPIKey(key: string): Promise<User | null> {
  const hashedKey = await hashKey(key);
  const apiKey = await db.apiKeys.findOne({ key: hashedKey });
  
  if (!apiKey) return null;
  if (apiKey.expiresAt < new Date()) return null;
  
  return apiKey.user;
}
```

### CORS Configuration

```typescript
// Strict CORS policy
const CORS_CONFIG = {
  allowedOrigins: [
    'https://archdesigner.com',
    'https://app.archdesigner.com',
    'https://staging.archdesigner.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

function handleCORS(req: Request): Response | null {
  const origin = req.headers.get('origin');
  
  // Check if origin is allowed
  if (!origin || !CORS_CONFIG.allowedOrigins.includes(origin)) {
    return new Response('CORS not allowed', { status: 403 });
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
        'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
        'Access-Control-Max-Age': String(CORS_CONFIG.maxAge)
      }
    });
  }
  
  return null;
}
```

---

## LLM Security

### Prompt Injection Prevention

```typescript
// Filter dangerous prompts
const DANGEROUS_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(all\s+)?previous\s+(prompts?|instructions?)/i,
  /forget\s+your\s+(training|instructions?)/i,
  /you\s+are\s+now\s+a/i,
  /new\s+instructions?:/i,
  /system:?\s*override/i,
  /act\s+as\s+if/i
];

export function sanitizeLLMInput(input: string): string {
  let sanitized = input;
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Replace with safe placeholder
      sanitized = sanitized.replace(pattern, '[FILTERED]');
      
      // Log attempt
      logger.warn('Prompt injection attempt detected', {
        pattern: pattern.toString(),
        input: input.substring(0, 100)
      });
    }
  }
  
  return sanitized;
}
```

### Output Validation

```typescript
// Validate LLM output structure
export function validateLLMOutput(output: any, schema: object): boolean {
  try {
    // Validate against expected schema
    const validation = validateSchema(output, schema);
    
    if (!validation.valid) {
      logger.error('LLM output validation failed', {
        errors: validation.errors,
        output: JSON.stringify(output).substring(0, 500)
      });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('LLM output validation error', { error });
    return false;
  }
}
```

### Cost Controls

```typescript
// LLM cost monitoring
const MAX_DAILY_LLM_COST = 100; // $100/day
const MAX_SINGLE_REQUEST_TOKENS = 10000;

async function checkLLMBudget(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const key = `llm-cost:${userId}:${today}`;
  
  const spent = await redis.get(key) || 0;
  
  if (spent >= MAX_DAILY_LLM_COST) {
    logger.warn('LLM budget exceeded', { userId, spent });
    return false;
  }
  
  return true;
}

async function trackLLMCost(userId: string, cost: number) {
  const today = new Date().toISOString().split('T')[0];
  const key = `llm-cost:${userId}:${today}`;
  
  await redis.incrby(key, cost);
  await redis.expire(key, 86400); // 24 hours
}
```

---

## Frontend Security

### Content Security Policy

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.base44.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  "
/>
```

### Security Headers

```typescript
// Add security headers to responses
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
```

---

## Compliance

### GDPR Compliance

```typescript
// Data subject rights
export async function handleDataRequest(userId: string, type: 'export' | 'delete') {
  if (type === 'export') {
    // Export all user data
    const data = await db.users.export(userId);
    return JSON.stringify(data, null, 2);
  }
  
  if (type === 'delete') {
    // Soft delete (mark as deleted, purge after 30 days)
    await db.users.update(userId, {
      deleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}@archdesigner.com`
    });
    
    // Schedule hard delete
    await scheduleTask('purge-user', userId, 30 * 24 * 60 * 60 * 1000);
  }
}
```

### HIPAA Compliance (If Applicable)

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Access controls (RBAC)
- Audit trails
- Data backup and recovery
- Business associate agreements

### SOC 2 Compliance

- Access control
- Change management
- Risk assessment
- Vulnerability management
- Incident response
- Monitoring and logging

---

## Incident Response

### Incident Response Plan

1. **Detection** - Identify security incident
2. **Containment** - Limit damage
3. **Investigation** - Determine scope
4. **Eradication** - Remove threat
5. **Recovery** - Restore services
6. **Post-Incident** - Learn and improve

### Security Incident Classification

- **P0 (Critical)**: Data breach, complete outage
- **P1 (High)**: Unauthorized access, partial outage
- **P2 (Medium)**: Vulnerability discovered, performance degradation
- **P3 (Low)**: Minor issue, no immediate risk

---

## Security Checklist

### Development
- [ ] All inputs validated and sanitized
- [ ] All outputs encoded properly
- [ ] Authentication required for protected resources
- [ ] Authorization checks in place
- [ ] Sensitive data encrypted
- [ ] PII redacted from logs
- [ ] Dependencies up to date
- [ ] Security tests passing

### Deployment
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] Monitoring and alerting active
- [ ] Backup encryption verified
- [ ] Incident response plan ready

### Ongoing
- [ ] Monthly security audits
- [ ] Quarterly penetration tests
- [ ] Regular dependency updates
- [ ] Security training for team
- [ ] Incident response drills

---

**Maintained by**: Krosebrook Security Team  
**Last Updated**: December 30, 2024  
**Next Review**: Q1 2025
