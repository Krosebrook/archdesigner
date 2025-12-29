import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Star, 
  Sparkles,
  Code2,
  Database,
  Shield,
  Zap,
  GitBranch,
  TestTube,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";

import AgentCard from "../components/agent-marketplace/AgentCard";
import WorkflowBuilder from "../components/agent-marketplace/WorkflowBuilder";
import AgentBuilder from "../components/agent-marketplace/AgentBuilder";

const CATEGORIES = [
  { id: "all", label: "All Agents", icon: Sparkles },
  { id: "frontend", label: "Frontend", icon: Code2 },
  { id: "backend", label: "Backend", icon: Code2 },
  { id: "database", label: "Database", icon: Database },
  { id: "security", label: "Security", icon: Shield },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "devops", label: "DevOps", icon: GitBranch },
  { id: "testing", label: "Testing", icon: TestTube },
  { id: "documentation", label: "Documentation", icon: BookOpen },
  { id: "specialty", label: "Specialty", icon: Star }
];

const OFFICIAL_AGENTS = [
  // Frontend Agents (5)
  {
    name: "React Performance Optimizer",
    slug: "react-performance",
    description: "Optimizes React components, reduces re-renders, and improves rendering performance with memoization strategies",
    category: "frontend",
    icon: "⚛️",
    color: "#61dafb",
    specialization: "React Performance & Optimization",
    capabilities: ["Component profiling", "Memoization analysis", "Bundle optimization", "Virtual DOM efficiency"],
    system_prompt: "You are a React performance expert specializing in optimizing component rendering and bundle size...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2341,
    tags: ["react", "performance", "optimization", "memoization"]
  },
  {
    name: "UI/UX Accessibility Agent",
    slug: "accessibility-audit",
    description: "Audits frontend code for WCAG compliance, suggests accessibility improvements, and generates ARIA labels",
    category: "frontend",
    icon: "♿",
    color: "#3b82f6",
    specialization: "WCAG & A11y Standards",
    capabilities: ["WCAG audit", "ARIA recommendations", "Keyboard navigation", "Screen reader optimization"],
    system_prompt: "You are an accessibility expert ensuring all interfaces meet WCAG 2.1 AA standards...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 1876,
    tags: ["accessibility", "wcag", "aria", "a11y"]
  },
  {
    name: "Component Library Generator",
    slug: "component-library",
    description: "Generates design system components with Storybook documentation and TypeScript definitions",
    category: "frontend",
    icon: "🎨",
    color: "#ec4899",
    specialization: "Design Systems & Component Architecture",
    capabilities: ["Component scaffolding", "Storybook setup", "TypeScript types", "Theme system"],
    system_prompt: "You are a design system architect creating reusable, accessible component libraries...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 1654,
    tags: ["components", "storybook", "design-system", "typescript"]
  },
  {
    name: "State Management Architect",
    slug: "state-management",
    description: "Analyzes state complexity, suggests optimal state management patterns (Redux, Zustand, Context)",
    category: "frontend",
    icon: "🔄",
    color: "#8b5cf6",
    specialization: "State Architecture & Data Flow",
    capabilities: ["State pattern selection", "Redux optimization", "Context API design", "State normalization"],
    system_prompt: "You are a state management expert helping developers choose and implement optimal state solutions...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2123,
    tags: ["state", "redux", "zustand", "context"]
  },
  {
    name: "Frontend Bundle Analyzer",
    slug: "bundle-analyzer",
    description: "Analyzes webpack/vite bundles, identifies large dependencies, and suggests code-splitting strategies",
    category: "frontend",
    icon: "📦",
    color: "#f59e0b",
    specialization: "Bundle Optimization & Tree Shaking",
    capabilities: ["Bundle analysis", "Tree shaking", "Code splitting", "Lazy loading"],
    system_prompt: "You are a bundle optimization expert specializing in reducing frontend bundle sizes...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 1987,
    tags: ["webpack", "vite", "bundling", "optimization"]
  },

  // Backend Agents (5)
  {
    name: "API Architecture Designer",
    slug: "api-architecture",
    description: "Designs RESTful and GraphQL APIs with best practices, versioning, and scalability patterns",
    category: "backend",
    icon: "🌐",
    color: "#10b981",
    specialization: "API Design & Architecture",
    capabilities: ["REST design", "GraphQL schemas", "API versioning", "Rate limiting"],
    system_prompt: "You are an API architect designing scalable, maintainable backend services...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2567,
    tags: ["api", "rest", "graphql", "design"]
  },
  {
    name: "Microservices Orchestrator",
    slug: "microservices-orchestrator",
    description: "Designs service boundaries, implements service mesh patterns, and handles inter-service communication",
    category: "backend",
    icon: "🔗",
    color: "#06b6d4",
    specialization: "Microservices Architecture",
    capabilities: ["Service decomposition", "Message queues", "Service discovery", "Circuit breakers"],
    system_prompt: "You are a microservices expert designing distributed system architectures...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2234,
    tags: ["microservices", "kafka", "rabbitmq", "distributed"]
  },
  {
    name: "Backend Performance Tuner",
    slug: "backend-performance",
    description: "Optimizes backend response times, implements caching strategies, and analyzes bottlenecks",
    category: "backend",
    icon: "⚡",
    color: "#eab308",
    specialization: "Backend Optimization & Caching",
    capabilities: ["Performance profiling", "Redis caching", "Load balancing", "Query optimization"],
    system_prompt: "You are a backend performance expert optimizing server response times and throughput...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2456,
    tags: ["performance", "caching", "redis", "optimization"]
  },
  {
    name: "Authentication & Authorization Expert",
    slug: "auth-expert",
    description: "Implements secure authentication flows, OAuth2, JWT, and role-based access control systems",
    category: "backend",
    icon: "🔐",
    color: "#ef4444",
    specialization: "Security & Identity Management",
    capabilities: ["OAuth2 setup", "JWT implementation", "RBAC design", "Session management"],
    system_prompt: "You are an authentication expert implementing secure identity management systems...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2789,
    tags: ["auth", "oauth", "jwt", "security"]
  },
  {
    name: "Serverless Function Architect",
    slug: "serverless-architect",
    description: "Designs serverless architectures with AWS Lambda, Azure Functions, and optimizes cold starts",
    category: "backend",
    icon: "☁️",
    color: "#3b82f6",
    specialization: "Serverless & Cloud Functions",
    capabilities: ["Lambda optimization", "Event-driven design", "Cold start reduction", "Cost optimization"],
    system_prompt: "You are a serverless expert designing event-driven cloud architectures...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 1876,
    tags: ["serverless", "lambda", "cloud", "aws"]
  },

  // Database Agents (5)
  {
    name: "Database Schema Optimizer",
    slug: "schema-optimizer",
    description: "Analyzes database schemas, normalizes tables, and suggests optimal data structures",
    category: "database",
    icon: "🗄️",
    color: "#10b981",
    specialization: "Schema Design & Normalization",
    capabilities: ["Schema analysis", "Normalization", "Index optimization", "Foreign key design"],
    system_prompt: "You are a database architect designing efficient, scalable database schemas...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2123,
    tags: ["database", "schema", "sql", "normalization"]
  },
  {
    name: "Query Performance Analyzer",
    slug: "query-analyzer",
    description: "Identifies slow queries, suggests indexes, and rewrites queries for optimal performance",
    category: "database",
    icon: "⚡",
    color: "#eab308",
    specialization: "Query Optimization & Indexing",
    capabilities: ["Query analysis", "Index suggestions", "Execution plans", "Performance tuning"],
    system_prompt: "You are a database performance expert optimizing SQL queries and indexes...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 1987,
    tags: ["sql", "performance", "queries", "indexes"]
  },
  {
    name: "NoSQL Data Modeler",
    slug: "nosql-modeler",
    description: "Designs MongoDB, Cassandra, and DynamoDB schemas with optimal data access patterns",
    category: "database",
    icon: "📊",
    color: "#06b6d4",
    specialization: "NoSQL Database Design",
    capabilities: ["Document modeling", "Denormalization strategies", "Partition key design", "Query patterns"],
    system_prompt: "You are a NoSQL expert designing document and key-value database structures...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 1654,
    tags: ["nosql", "mongodb", "cassandra", "dynamodb"]
  },
  {
    name: "Database Migration Specialist",
    slug: "migration-specialist",
    description: "Plans and executes database migrations with zero downtime and rollback strategies",
    category: "database",
    icon: "🔄",
    color: "#8b5cf6",
    specialization: "Schema Migrations & Data Transfer",
    capabilities: ["Migration planning", "Zero-downtime deployments", "Rollback strategies", "Data validation"],
    system_prompt: "You are a database migration expert ensuring safe, reliable schema changes...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 1765,
    tags: ["migrations", "deployment", "database", "rollback"]
  },
  {
    name: "Database Backup & Recovery Agent",
    slug: "backup-recovery",
    description: "Designs backup strategies, implements point-in-time recovery, and tests disaster recovery plans",
    category: "database",
    icon: "💾",
    color: "#f59e0b",
    specialization: "Backup & Disaster Recovery",
    capabilities: ["Backup automation", "Recovery testing", "PITR setup", "Replication strategies"],
    system_prompt: "You are a database reliability expert ensuring data safety and recoverability...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 1543,
    tags: ["backup", "recovery", "disaster-recovery", "reliability"]
  },

  // Security Agents (5)
  {
    name: "OWASP Security Auditor",
    slug: "owasp-auditor",
    description: "Scans for OWASP Top 10 vulnerabilities, suggests fixes, and generates security reports",
    category: "security",
    icon: "🔒",
    color: "#ef4444",
    specialization: "OWASP & Vulnerability Detection",
    capabilities: ["SQL injection detection", "XSS prevention", "CSRF protection", "Security headers"],
    system_prompt: "You are a security expert specializing in OWASP Top 10 vulnerability detection...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 3124,
    tags: ["security", "owasp", "vulnerabilities", "audit"]
  },
  {
    name: "Dependency Vulnerability Scanner",
    slug: "dependency-scanner",
    description: "Scans npm/pip/maven dependencies for known CVEs and suggests secure alternatives",
    category: "security",
    icon: "🔍",
    color: "#f59e0b",
    specialization: "Supply Chain Security",
    capabilities: ["CVE detection", "Dependency updates", "License compliance", "Security advisories"],
    system_prompt: "You are a security expert analyzing dependency vulnerabilities and supply chain risks...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2876,
    tags: ["dependencies", "cve", "npm", "security"]
  },
  {
    name: "Secrets & Credentials Manager",
    slug: "secrets-manager",
    description: "Detects hardcoded secrets, implements secure credential storage, and rotates keys",
    category: "security",
    icon: "🔑",
    color: "#8b5cf6",
    specialization: "Secret Management & Key Rotation",
    capabilities: ["Secret detection", "Vault integration", "Key rotation", "Environment variables"],
    system_prompt: "You are a security expert specializing in secret management and credential security...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2543,
    tags: ["secrets", "credentials", "vault", "security"]
  },
  {
    name: "Compliance Automation Agent",
    slug: "compliance-automation",
    description: "Automates GDPR, HIPAA, PCI-DSS compliance checks and generates audit reports",
    category: "security",
    icon: "📋",
    color: "#10b981",
    specialization: "Regulatory Compliance",
    capabilities: ["GDPR compliance", "HIPAA checks", "PCI-DSS validation", "Audit reports"],
    system_prompt: "You are a compliance expert ensuring systems meet regulatory requirements...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2234,
    tags: ["compliance", "gdpr", "hipaa", "pci-dss"]
  },
  {
    name: "Penetration Testing Assistant",
    slug: "pentest-assistant",
    description: "Simulates attacks, identifies security weaknesses, and provides remediation guidance",
    category: "security",
    icon: "🎯",
    color: "#ef4444",
    specialization: "Ethical Hacking & Pentesting",
    capabilities: ["Vulnerability scanning", "Attack simulation", "Security testing", "Remediation plans"],
    system_prompt: "You are an ethical hacker performing security assessments and penetration tests...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2987,
    tags: ["pentest", "security", "hacking", "vulnerabilities"]
  },

  // Performance Agents (5)
  {
    name: "Application Profiler",
    slug: "app-profiler",
    description: "Profiles application performance, identifies bottlenecks, and suggests optimizations",
    category: "performance",
    icon: "📊",
    color: "#06b6d4",
    specialization: "Performance Profiling & Analysis",
    capabilities: ["CPU profiling", "Memory analysis", "Bottleneck detection", "Performance metrics"],
    system_prompt: "You are a performance engineer analyzing application bottlenecks and optimizations...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2456,
    tags: ["performance", "profiling", "optimization", "metrics"]
  },
  {
    name: "Load Testing Strategist",
    slug: "load-testing",
    description: "Designs load tests, stress tests, and generates realistic traffic patterns with k6/JMeter",
    category: "performance",
    icon: "🏋️",
    color: "#8b5cf6",
    specialization: "Load & Stress Testing",
    capabilities: ["Load test design", "Traffic simulation", "Stress testing", "Performance benchmarks"],
    system_prompt: "You are a performance testing expert designing comprehensive load testing strategies...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2123,
    tags: ["load-testing", "k6", "jmeter", "stress-testing"]
  },
  {
    name: "Caching Strategy Optimizer",
    slug: "caching-optimizer",
    description: "Implements multi-tier caching with Redis, CDN, and browser caching strategies",
    category: "performance",
    icon: "⚡",
    color: "#eab308",
    specialization: "Caching & Content Delivery",
    capabilities: ["Cache invalidation", "CDN setup", "Redis optimization", "Browser caching"],
    system_prompt: "You are a caching expert implementing optimal content delivery strategies...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2654,
    tags: ["caching", "redis", "cdn", "performance"]
  },
  {
    name: "Database Query Optimizer",
    slug: "db-query-optimizer",
    description: "Optimizes database queries, implements connection pooling, and reduces query latency",
    category: "performance",
    icon: "🗄️",
    color: "#10b981",
    specialization: "Database Performance",
    capabilities: ["Query optimization", "Connection pooling", "Index tuning", "Query caching"],
    system_prompt: "You are a database performance expert optimizing query execution and throughput...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2345,
    tags: ["database", "queries", "performance", "optimization"]
  },
  {
    name: "Infrastructure Scaling Agent",
    slug: "scaling-agent",
    description: "Implements auto-scaling, horizontal scaling strategies, and resource optimization",
    category: "performance",
    icon: "📈",
    color: "#3b82f6",
    specialization: "Scalability & Auto-scaling",
    capabilities: ["Auto-scaling setup", "Horizontal scaling", "Resource optimization", "Capacity planning"],
    system_prompt: "You are a scalability expert designing systems that handle growing traffic...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2567,
    tags: ["scaling", "kubernetes", "auto-scaling", "infrastructure"]
  },

  // DevOps Agents (5)
  {
    name: "CI/CD Pipeline Generator",
    slug: "cicd-generator",
    description: "Generates GitHub Actions, GitLab CI, and Jenkins pipelines with best practices",
    category: "devops",
    icon: "🚀",
    color: "#8b5cf6",
    specialization: "CI/CD Automation",
    capabilities: ["Pipeline generation", "GitHub Actions", "GitLab CI", "Jenkins setup"],
    system_prompt: "You are a DevOps expert creating automated CI/CD pipelines...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 3234,
    tags: ["cicd", "github-actions", "jenkins", "automation"]
  },
  {
    name: "Kubernetes Orchestrator",
    slug: "k8s-orchestrator",
    description: "Generates Kubernetes manifests, implements Helm charts, and manages deployments",
    category: "devops",
    icon: "☸️",
    color: "#326ce5",
    specialization: "Container Orchestration",
    capabilities: ["K8s manifests", "Helm charts", "Service mesh", "Pod management"],
    system_prompt: "You are a Kubernetes expert managing containerized applications...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2987,
    tags: ["kubernetes", "k8s", "helm", "containers"]
  },
  {
    name: "Infrastructure as Code Agent",
    slug: "iac-agent",
    description: "Generates Terraform, CloudFormation, and Pulumi code for cloud infrastructure",
    category: "devops",
    icon: "🏗️",
    color: "#7b42bc",
    specialization: "IaC & Cloud Provisioning",
    capabilities: ["Terraform generation", "CloudFormation", "Pulumi", "Infrastructure automation"],
    system_prompt: "You are an IaC expert provisioning cloud infrastructure as code...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2765,
    tags: ["terraform", "iac", "cloudformation", "infrastructure"]
  },
  {
    name: "Container Optimization Agent",
    slug: "container-optimizer",
    description: "Optimizes Docker images, reduces container sizes, and implements multi-stage builds",
    category: "devops",
    icon: "🐳",
    color: "#2496ed",
    specialization: "Docker & Container Optimization",
    capabilities: ["Image optimization", "Multi-stage builds", "Layer caching", "Security scanning"],
    system_prompt: "You are a container expert optimizing Docker images and deployments...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2543,
    tags: ["docker", "containers", "optimization", "images"]
  },
  {
    name: "Monitoring & Observability Agent",
    slug: "observability-agent",
    description: "Sets up Prometheus, Grafana, and distributed tracing with OpenTelemetry",
    category: "devops",
    icon: "📊",
    color: "#f59e0b",
    specialization: "Monitoring & Observability",
    capabilities: ["Prometheus setup", "Grafana dashboards", "Distributed tracing", "Alert configuration"],
    system_prompt: "You are an observability expert implementing comprehensive monitoring solutions...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2876,
    tags: ["monitoring", "prometheus", "grafana", "observability"]
  },

  // Testing Agents (5)
  {
    name: "Unit Test Generator",
    slug: "unit-test-generator",
    description: "Generates comprehensive unit tests for Jest, Mocha, and PyTest with high coverage",
    category: "testing",
    icon: "🧪",
    color: "#06b6d4",
    specialization: "Unit Testing & Code Coverage",
    capabilities: ["Test generation", "Coverage analysis", "Mock creation", "Assertion strategies"],
    system_prompt: "You are a testing expert generating comprehensive unit tests...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2654,
    tags: ["testing", "jest", "unit-tests", "coverage"]
  },
  {
    name: "E2E Test Architect",
    slug: "e2e-architect",
    description: "Creates end-to-end tests with Playwright, Cypress, and Selenium with best practices",
    category: "testing",
    icon: "🎭",
    color: "#10b981",
    specialization: "End-to-End Testing",
    capabilities: ["E2E test creation", "Playwright automation", "Visual regression", "Test maintenance"],
    system_prompt: "You are an E2E testing expert creating reliable browser automation tests...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2456,
    tags: ["e2e", "playwright", "cypress", "automation"]
  },
  {
    name: "API Test Automation Agent",
    slug: "api-test-automation",
    description: "Generates API tests, validates contracts, and implements integration testing",
    category: "testing",
    icon: "🔌",
    color: "#8b5cf6",
    specialization: "API & Integration Testing",
    capabilities: ["API test generation", "Contract testing", "Integration tests", "Response validation"],
    system_prompt: "You are an API testing expert validating service contracts and integrations...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2345,
    tags: ["api-testing", "integration", "postman", "rest"]
  },
  {
    name: "Performance Test Designer",
    slug: "performance-test-designer",
    description: "Designs performance tests, load scenarios, and benchmarking strategies",
    category: "testing",
    icon: "⚡",
    color: "#eab308",
    specialization: "Performance & Load Testing",
    capabilities: ["Load test design", "Benchmark creation", "Performance baselines", "Stress scenarios"],
    system_prompt: "You are a performance testing expert designing comprehensive load test strategies...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2123,
    tags: ["performance", "load-testing", "benchmarking", "k6"]
  },
  {
    name: "Test Data Generator",
    slug: "test-data-generator",
    description: "Generates realistic test data, fixtures, and mock APIs for comprehensive testing",
    category: "testing",
    icon: "🎲",
    color: "#f59e0b",
    specialization: "Test Data & Fixtures",
    capabilities: ["Data generation", "Fixture creation", "Mock APIs", "Factory patterns"],
    system_prompt: "You are a test data expert generating realistic datasets for testing...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 1987,
    tags: ["test-data", "fixtures", "mocks", "faker"]
  },

  // Documentation Agents (5)
  {
    name: "API Documentation Generator",
    slug: "api-docs-generator",
    description: "Generates OpenAPI/Swagger documentation with interactive examples and code samples",
    category: "documentation",
    icon: "📚",
    color: "#f59e0b",
    specialization: "API Documentation",
    capabilities: ["OpenAPI generation", "Code examples", "Interactive docs", "Versioning"],
    system_prompt: "You are a technical writer specializing in API documentation...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2765,
    tags: ["documentation", "api", "openapi", "swagger"]
  },
  {
    name: "Code Documentation Agent",
    slug: "code-docs-agent",
    description: "Generates JSDoc, TypeDoc, and inline documentation with best practices",
    category: "documentation",
    icon: "📝",
    color: "#3b82f6",
    specialization: "Code Documentation",
    capabilities: ["JSDoc generation", "TypeDoc", "Inline comments", "Documentation standards"],
    system_prompt: "You are a documentation expert creating clear, comprehensive code documentation...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2345,
    tags: ["jsdoc", "typedoc", "comments", "documentation"]
  },
  {
    name: "Architecture Documentation Agent",
    slug: "architecture-docs",
    description: "Creates architecture diagrams, C4 models, and system design documentation",
    category: "documentation",
    icon: "🏛️",
    color: "#8b5cf6",
    specialization: "Architecture & System Design",
    capabilities: ["C4 diagrams", "Architecture docs", "System design", "Diagram generation"],
    system_prompt: "You are an architecture documentation expert creating comprehensive system designs...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2543,
    tags: ["architecture", "diagrams", "c4-model", "design"]
  },
  {
    name: "Runbook & Playbook Generator",
    slug: "runbook-generator",
    description: "Creates operational runbooks, incident playbooks, and troubleshooting guides",
    category: "documentation",
    icon: "📖",
    color: "#10b981",
    specialization: "Operations Documentation",
    capabilities: ["Runbook creation", "Incident playbooks", "Troubleshooting guides", "SOP documentation"],
    system_prompt: "You are an operations documentation expert creating comprehensive runbooks...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2123,
    tags: ["runbook", "operations", "incidents", "troubleshooting"]
  },
  {
    name: "User Guide Generator",
    slug: "user-guide-generator",
    description: "Creates end-user documentation, tutorials, and getting-started guides",
    category: "documentation",
    icon: "👤",
    color: "#ec4899",
    specialization: "User Documentation",
    capabilities: ["User guides", "Tutorials", "Getting started", "FAQ generation"],
    system_prompt: "You are a user documentation expert creating clear, beginner-friendly guides...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 1987,
    tags: ["user-guide", "tutorials", "documentation", "getting-started"]
  },

  // Specialty Agents (10)
  {
    name: "AI/ML Model Optimizer",
    slug: "ml-optimizer",
    description: "Optimizes machine learning models, reduces inference time, and implements model compression",
    category: "specialty",
    icon: "🤖",
    color: "#8b5cf6",
    specialization: "ML Optimization & Deployment",
    capabilities: ["Model compression", "Inference optimization", "Quantization", "TensorFlow/PyTorch tuning"],
    system_prompt: "You are an ML engineering expert optimizing models for production deployment...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2876,
    tags: ["ai", "ml", "optimization", "tensorflow"]
  },
  {
    name: "Blockchain Smart Contract Auditor",
    slug: "smart-contract-auditor",
    description: "Audits Solidity smart contracts, detects vulnerabilities, and ensures gas optimization",
    category: "specialty",
    icon: "⛓️",
    color: "#f59e0b",
    specialization: "Smart Contract Security",
    capabilities: ["Contract auditing", "Gas optimization", "Vulnerability detection", "Best practices"],
    system_prompt: "You are a blockchain security expert auditing smart contracts...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 1765,
    tags: ["blockchain", "solidity", "smart-contracts", "security"]
  },
  {
    name: "Mobile App Architect",
    slug: "mobile-architect",
    description: "Designs React Native and Flutter architectures with offline-first patterns",
    category: "specialty",
    icon: "📱",
    color: "#06b6d4",
    specialization: "Mobile Application Architecture",
    capabilities: ["React Native", "Flutter", "Offline-first", "Native bridges"],
    system_prompt: "You are a mobile architecture expert designing cross-platform applications...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2234,
    tags: ["mobile", "react-native", "flutter", "architecture"]
  },
  {
    name: "GraphQL Schema Designer",
    slug: "graphql-designer",
    description: "Designs GraphQL schemas, implements resolvers, and optimizes N+1 queries",
    category: "specialty",
    icon: "⚡",
    color: "#e535ab",
    specialization: "GraphQL Architecture",
    capabilities: ["Schema design", "Resolver optimization", "N+1 prevention", "Federation"],
    system_prompt: "You are a GraphQL expert designing efficient, scalable API schemas...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2456,
    tags: ["graphql", "api", "schema", "resolvers"]
  },
  {
    name: "Real-time System Architect",
    slug: "realtime-architect",
    description: "Implements WebSocket, Server-Sent Events, and real-time communication patterns",
    category: "specialty",
    icon: "⚡",
    color: "#10b981",
    specialization: "Real-time Communications",
    capabilities: ["WebSocket setup", "SSE implementation", "Socket.io", "Real-time sync"],
    system_prompt: "You are a real-time systems expert implementing live data streaming...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2123,
    tags: ["websocket", "realtime", "sse", "socket-io"]
  },
  {
    name: "Accessibility Compliance Expert",
    slug: "a11y-expert",
    description: "Ensures WCAG 2.1 AA/AAA compliance, generates accessibility reports, and implements fixes",
    category: "specialty",
    icon: "♿",
    color: "#3b82f6",
    specialization: "Digital Accessibility",
    capabilities: ["WCAG compliance", "Screen reader testing", "Keyboard navigation", "ARIA implementation"],
    system_prompt: "You are an accessibility expert ensuring digital products are usable by everyone...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2345,
    tags: ["accessibility", "wcag", "a11y", "compliance"]
  },
  {
    name: "Internationalization Agent",
    slug: "i18n-agent",
    description: "Implements i18n/l10n, manages translations, and handles locale-specific formatting",
    category: "specialty",
    icon: "🌍",
    color: "#8b5cf6",
    specialization: "Internationalization & Localization",
    capabilities: ["i18n setup", "Translation management", "Locale formatting", "RTL support"],
    system_prompt: "You are an internationalization expert making applications globally accessible...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.7,
    installs_count: 1876,
    tags: ["i18n", "localization", "translations", "global"]
  },
  {
    name: "Cost Optimization Advisor",
    slug: "cost-advisor",
    description: "Analyzes cloud costs, suggests optimization strategies, and implements cost-saving measures",
    category: "specialty",
    icon: "💰",
    color: "#f59e0b",
    specialization: "Cloud Cost Optimization",
    capabilities: ["Cost analysis", "Resource optimization", "Reserved instances", "Spot instances"],
    system_prompt: "You are a cloud cost expert optimizing infrastructure spending...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2543,
    tags: ["cost", "cloud", "optimization", "finops"]
  },
  {
    name: "Data Pipeline Architect",
    slug: "data-pipeline",
    description: "Designs ETL pipelines with Airflow, implements data warehousing, and ensures data quality",
    category: "specialty",
    icon: "🔄",
    color: "#06b6d4",
    specialization: "Data Engineering & ETL",
    capabilities: ["ETL design", "Airflow DAGs", "Data quality", "Pipeline orchestration"],
    system_prompt: "You are a data engineering expert designing scalable data pipelines...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.9,
    installs_count: 2234,
    tags: ["data", "etl", "airflow", "pipelines"]
  },
  {
    name: "SEO & Performance Optimizer",
    slug: "seo-optimizer",
    description: "Optimizes for SEO, implements meta tags, structured data, and Core Web Vitals improvements",
    category: "specialty",
    icon: "🔍",
    color: "#10b981",
    specialization: "SEO & Web Performance",
    capabilities: ["SEO optimization", "Meta tags", "Structured data", "Core Web Vitals"],
    system_prompt: "You are an SEO expert optimizing websites for search engines and performance...",
    configuration_schema: {},
    default_config: {},
    is_public: true,
    is_official: true,
    rating: 4.8,
    installs_count: 2456,
    tags: ["seo", "performance", "web-vitals", "optimization"]
  }
];

export default function AgentMarketplacePage() {
  const [agents, setAgents] = useState([]);
  const [installedAgents, setInstalledAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadMarketplace();
  }, []);

  const loadMarketplace = async () => {
    setIsLoading(true);
    try {
      const existingAgents = await base44.entities.AgentDefinition.filter({ is_public: true });
      
      if (existingAgents.length < 50) {
        const user = await base44.auth.me();
        await Promise.all(
          OFFICIAL_AGENTS.map(agent =>
            base44.entities.AgentDefinition.create({ ...agent, author: user.email })
          )
        );
      }

      const publicAgents = await base44.entities.AgentDefinition.filter({ is_public: true });
      setAgents(publicAgents);

      const user = await base44.auth.me();
      const userAgents = await base44.entities.AgentDefinition.filter({ created_by: user.email });
      setInstalledAgents(userAgents);

      const projectList = await base44.entities.Project.list('-created_date');
      setProjects(projectList);
      if (projectList.length > 0) setSelectedProject(projectList[0]);
    } catch (error) {
      console.error("Load marketplace error:", error);
      toast.error("Failed to load marketplace");
    }
    setIsLoading(false);
  };

  const handleInstall = async (agent) => {
    try {
      const user = await base44.auth.me();
      
      await base44.entities.AgentDefinition.create({
        ...agent,
        is_public: false,
        author: user.email,
        created_by: user.email
      });

      await base44.entities.AgentDefinition.update(agent.id, {
        installs_count: (agent.installs_count || 0) + 1
      });

      toast.success(`${agent.name} installed successfully!`);
      loadMarketplace();
    } catch (error) {
      console.error("Install error:", error);
      toast.error("Failed to install agent");
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || 
                           agent.category === categoryFilter ||
                           (categoryFilter === "specialty" && !["frontend", "backend", "database", "security", "performance", "devops", "testing", "documentation"].includes(agent.category));
    return matchesSearch && matchesCategory;
  });

  const isInstalled = (agent) => {
    return installedAgents.some(a => a.slug === agent.slug);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              AI Agent Marketplace
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Discover 50+ specialized AI co-pilots for every aspect of development. 
              Chain agents together to create powerful automated workflows.
            </p>
            <div className="flex gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                <TrendingUp className="w-3 h-3 mr-1" />
                {agents.length} Agents Available
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
                <Star className="w-3 h-3 mr-1 fill-white" />
                Official Collection
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="browse">Browse Agents</TabsTrigger>
          <TabsTrigger value="workflows">Build Workflow</TabsTrigger>
          <TabsTrigger value="builder">
            <Sparkles className="w-4 h-4 mr-2" />
            Agent Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search agents, tags, capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={categoryFilter === cat.id ? "default" : "outline"}
                    onClick={() => setCategoryFilter(cat.id)}
                    className="shrink-0"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AgentCard
                    agent={agent}
                    onInstall={handleInstall}
                    isInstalled={isInstalled(agent)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows">
          {selectedProject ? (
            <WorkflowBuilder
              project={selectedProject}
              installedAgents={installedAgents}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">Please create a project first to build workflows</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder">
          <AgentBuilder onAgentCreated={loadMarketplace} />
        </TabsContent>
      </Tabs>
    </div>
  );
}