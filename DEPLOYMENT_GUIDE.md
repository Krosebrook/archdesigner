# ArchDesigner Deployment Guide
## Production Deployment and Operations Manual

**Last Updated**: December 30, 2024  
**Version**: 0.0.0

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Base44 Deployment](#base44-deployment)
- [Alternative Deployment Options](#alternative-deployment-options)
- [Database Setup](#database-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Observability](#monitoring-and-observability)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling Strategy](#scaling-strategy)
- [Rollback Procedures](#rollback-procedures)
- [Security Checklist](#security-checklist)

---

## Overview

This guide provides comprehensive instructions for deploying ArchDesigner to production environments. The primary deployment target is the Base44 platform, with alternative options for self-hosted deployments.

**Deployment Architecture**:
```
┌─────────────────────────────────────────────┐
│           CDN / CloudFlare                  │
│         (Static Assets, Caching)            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Base44 Platform                     │
│  ┌──────────────┬──────────────┬─────────┐ │
│  │   Frontend   │   Backend    │  Entity │ │
│  │   (Static)   │  (Serverless)│  Storage│ │
│  └──────────────┴──────────────┴─────────┘ │
└─────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Accounts and Services

1. **Base44 Account**
   - Sign up at [base44.com](https://base44.com)
   - Verify email and complete onboarding
   - Set up billing (if using paid tier)

2. **GitHub Account**
   - For CI/CD integration
   - Access to repository

3. **Domain Name** (Optional)
   - Custom domain for production
   - SSL certificate (usually automatic)

### Development Environment

```bash
# Required tools
- Node.js v18+
- npm v9+
- Deno v1.40+ (for backend functions)
- Git
- Base44 CLI (install via npm)

# Install Base44 CLI
npm install -g @base44/cli

# Verify installation
base44 --version
```

---

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```env
# Base44 Configuration
VITE_BASE44_APP_ID=prod_app_id_here
VITE_BASE44_API_KEY=prod_api_key_here
VITE_BASE44_REGION=us-east-1
VITE_BASE44_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_AI_AGENTS=true
VITE_ENABLE_CODE_GENERATION=true
VITE_ENABLE_SECURITY_AUDIT=true

# API Configuration
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# LLM Provider (Optional)
VITE_LLM_PROVIDER=claude  # or 'gemini'
```

### Staging Environment Variables

Create a `.env.staging` file:

```env
# Base44 Configuration
VITE_BASE44_APP_ID=staging_app_id_here
VITE_BASE44_API_KEY=staging_api_key_here
VITE_BASE44_REGION=us-east-1
VITE_BASE44_ENVIRONMENT=staging

# Feature Flags (enable experimental features)
VITE_ENABLE_AI_AGENTS=true
VITE_ENABLE_CODE_GENERATION=true
VITE_ENABLE_SECURITY_AUDIT=true
VITE_ENABLE_BETA_FEATURES=true

# Debug mode
VITE_DEBUG_MODE=true
```

### Environment Variable Security

```bash
# NEVER commit .env files to git
# Add to .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore

# Use GitHub Secrets for CI/CD
# Settings → Secrets and variables → Actions → New repository secret
```

---

## Base44 Deployment

### Step 1: Login to Base44

```bash
# Login via CLI
base44 login

# Or use API key
export BASE44_API_KEY=your_api_key
```

### Step 2: Initialize Project

```bash
# Initialize Base44 project (if not already done)
base44 init

# Follow prompts:
# - App name: archdesigner
# - Region: us-east-1 (or closest to your users)
# - Environment: production
```

### Step 3: Build for Production

```bash
# Install dependencies
npm ci --production=false

# Run tests
npm run test

# Run linter
npm run lint

# Type check
npm run typecheck

# Build frontend
npm run build

# Output will be in dist/ directory
```

### Step 4: Deploy Frontend

```bash
# Deploy frontend to Base44
base44 deploy frontend --dir=dist

# With custom domain
base44 deploy frontend --dir=dist --domain=archdesigner.com

# Expected output:
# ✓ Building frontend...
# ✓ Uploading assets...
# ✓ Configuring CDN...
# ✓ Deployment complete!
# 
# URL: https://archdesigner.base44.app
# Custom Domain: https://archdesigner.com (if configured)
```

### Step 5: Deploy Backend Functions

```bash
# Deploy all functions
base44 deploy functions --dir=functions

# Deploy specific function
base44 deploy function analyzeArchitecture.ts

# Expected output:
# ✓ Deploying functions...
# ✓ analyzeArchitecture.ts deployed
# ✓ securityAudit.ts deployed
# ✓ generateCode.ts deployed
# ... (10 functions total)
# 
# All functions deployed successfully!
```

### Step 6: Configure Entity Storage

```bash
# Set up entities (usually done during init)
base44 entities:sync

# Verify entities
base44 entities:list

# Expected entities:
# - projects
# - services
# - users
# - architectures
# - security_audits
```

### Step 7: Verify Deployment

```bash
# Check deployment status
base44 status

# Test endpoints
curl https://archdesigner.base44.app/api/health

# View logs
base44 logs --follow

# Monitor functions
base44 functions:logs analyzeArchitecture --tail=100
```

---

## Alternative Deployment Options

### Option 1: Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod

# Environment variables
vercel env add VITE_BASE44_APP_ID
vercel env add VITE_BASE44_API_KEY

# Automatic deployments on git push
# Connect GitHub repo in Vercel dashboard
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify (Frontend Only)

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Continuous deployment
# Connect GitHub in Netlify dashboard
```

### Option 3: Docker (Self-Hosted)

**Dockerfile**:
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_vary on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Add monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped
    
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    restart: unless-stopped
```

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale frontend=3

# Update
docker-compose pull
docker-compose up -d
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Test
        run: npm run test
      
      - name: Security audit
        run: npm audit --audit-level=moderate
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_BASE44_APP_ID: ${{ secrets.VITE_BASE44_APP_ID }}
          VITE_BASE44_API_KEY: ${{ secrets.VITE_BASE44_API_KEY }}
          VITE_BASE44_REGION: us-east-1
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Base44
        run: |
          npm install -g @base44/cli
          base44 login --token ${{ secrets.BASE44_TOKEN }}
          base44 deploy frontend --dir=dist
          base44 deploy functions --dir=functions
        env:
          BASE44_API_KEY: ${{ secrets.BASE44_API_KEY }}
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: 'Deployment to production: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Checklist

**Pre-Deployment**:
- [ ] All tests passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Backup recent data

**Deployment**:
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify health endpoints
- [ ] Check error rates
- [ ] Monitor logs for 30 minutes

**Post-Deployment**:
- [ ] Verify critical features work
- [ ] Check analytics for anomalies
- [ ] Update status page
- [ ] Notify team
- [ ] Tag release in Git
- [ ] Document any issues

---

## Monitoring and Observability

### Health Checks

```typescript
// Add health check endpoint
// functions/healthCheck.ts
Deno.serve(async (req) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.0.0',
    uptime: Deno.memoryUsage(),
    checks: {
      database: await checkDatabase(),
      llm: await checkLLM(),
      storage: await checkStorage()
    }
  };
  
  const allHealthy = Object.values(health.checks).every(c => c === 'ok');
  const status = allHealthy ? 200 : 503;
  
  return new Response(JSON.stringify(health), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Logging

```typescript
// Structured logging
import { logger } from './lib/logger.ts';

logger.info('Request received', {
  method: req.method,
  url: req.url,
  userId: user.id,
  correlationId: generateId()
});

logger.error('Request failed', {
  error: error.message,
  stack: error.stack,
  context: { projectId, serviceId }
});
```

### Metrics

**Key Metrics to Track**:
- Request rate (requests/second)
- Error rate (errors/requests)
- Response time (p50, p95, p99)
- Function execution time
- LLM API calls and costs
- Database query time
- Cache hit rate

### Alerting

**Alert Conditions**:
```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: Slow Response Time
    condition: p95_response_time > 1000ms
    duration: 10m
    severity: warning
    
  - name: High LLM Costs
    condition: daily_llm_cost > $100
    duration: 1h
    severity: warning
    
  - name: Function Failures
    condition: function_error_rate > 10%
    duration: 5m
    severity: critical
```

---

## Backup and Recovery

### Data Backup Strategy

```bash
# Automated daily backups
base44 backup:create --schedule="0 2 * * *"

# Manual backup
base44 backup:create --name="pre-deployment-$(date +%Y%m%d)"

# List backups
base44 backup:list

# Restore from backup
base44 backup:restore --id=backup-123456

# Download backup
base44 backup:download --id=backup-123456 --output=./backup.tar.gz
```

### Disaster Recovery Plan

**RTO** (Recovery Time Objective): 1 hour  
**RPO** (Recovery Point Objective): 1 hour (hourly backups)

**Recovery Steps**:
1. Identify issue and declare incident
2. Notify team via Slack/PagerDuty
3. Switch to maintenance mode
4. Investigate root cause
5. If data corruption: Restore from backup
6. If code issue: Rollback to previous version
7. Verify system health
8. Exit maintenance mode
9. Post-mortem analysis

---

## Scaling Strategy

### Horizontal Scaling

Base44 automatically scales based on load:
- Frontend: CDN automatically scales
- Backend: Serverless functions scale to zero/infinity
- Database: Automatic sharding and replication

### Performance Optimization

1. **CDN Configuration**
   ```javascript
   // Cache static assets
   cacheControl: {
     '*.js': 'public, max-age=31536000, immutable',
     '*.css': 'public, max-age=31536000, immutable',
     '*.png': 'public, max-age=31536000, immutable',
     'index.html': 'public, max-age=0, must-revalidate'
   }
   ```

2. **Database Optimization**
   - Index frequently queried fields
   - Use caching for read-heavy operations
   - Implement pagination for large lists

3. **Function Optimization**
   - Cold start optimization (keep functions warm)
   - Connection pooling
   - Memoization of expensive operations

---

## Rollback Procedures

### Quick Rollback

```bash
# List deployments
base44 deployments:list

# Rollback to previous version
base44 rollback --version=previous

# Rollback to specific version
base44 rollback --version=v1.2.3

# Rollback specific function
base44 rollback:function analyzeArchitecture --version=previous
```

### Manual Rollback

```bash
# 1. Checkout previous version
git log --oneline
git checkout <commit-hash>

# 2. Build and deploy
npm ci
npm run build
base44 deploy frontend --dir=dist --force

# 3. Verify
curl https://archdesigner.base44.app/health

# 4. Return to main branch
git checkout main
```

---

## Security Checklist

**Before Deployment**:
- [ ] All dependencies up to date
- [ ] No security vulnerabilities (npm audit)
- [ ] Secrets not in code
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF tokens implemented
- [ ] Security headers configured
- [ ] Authentication required
- [ ] Authorization checks in place

**Post-Deployment**:
- [ ] Security scan passed
- [ ] Penetration test completed (quarterly)
- [ ] SSL certificate valid
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Audit logs working
- [ ] Backup encryption verified

---

## Troubleshooting

### Common Issues

**Issue**: Deployment fails with "Build error"
```bash
# Solution:
npm ci --production=false
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Functions timing out
```bash
# Solution: Increase timeout
base44 function:config analyzeArchitecture --timeout=60

# Or optimize function code
```

**Issue**: High error rate
```bash
# Check logs
base44 logs --level=error --tail=100

# Check specific function
base44 function:logs analyzeArchitecture --errors-only
```

---

## Support

**Emergency Contact**:
- On-call engineer: @oncall in Slack
- Email: devops@archdesigner.com
- Phone: +1-XXX-XXX-XXXX (emergencies only)

**Base44 Support**:
- Email: support@base44.com
- Documentation: base44.com/docs
- Status page: status.base44.com

---

**Maintained by**: Krosebrook Team  
**Last Updated**: December 30, 2024
