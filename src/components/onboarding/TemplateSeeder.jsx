import { base44 } from "@/api/base44Client";

export const TEMPLATE_PRESETS = [
  {
    name: "E-commerce Platform",
    description: "Complete e-commerce solution with shopping cart, payments, inventory, and order management",
    category: "platform",
    icon: "🛒",
    architecture_pattern: "microservices",
    default_services: [
      {
        name: "Product Catalog Service",
        category: "backend",
        description: "Manages products, categories, inventory, and pricing",
        technologies: ["Node.js", "Express", "PostgreSQL", "Redis", "Elasticsearch"]
      },
      {
        name: "Shopping Cart Service",
        category: "backend",
        description: "Handles cart operations, session management, and cart persistence",
        technologies: ["Node.js", "Redis", "PostgreSQL"]
      },
      {
        name: "Payment Service",
        category: "backend",
        description: "Stripe integration for payments, refunds, and subscription billing",
        technologies: ["Node.js", "Stripe API", "PostgreSQL", "RabbitMQ"]
      },
      {
        name: "Order Management Service",
        category: "backend",
        description: "Order processing, fulfillment tracking, and invoice generation",
        technologies: ["Node.js", "PostgreSQL", "RabbitMQ", "SendGrid"]
      },
      {
        name: "User & Auth Service",
        category: "auth",
        description: "JWT authentication, user profiles, OAuth integration",
        technologies: ["Node.js", "PostgreSQL", "Redis", "Auth0"]
      },
      {
        name: "Storefront Frontend",
        category: "frontend",
        description: "Next.js storefront with SSR, product listings, and checkout",
        technologies: ["Next.js 14", "React", "Tailwind CSS", "SWR"]
      },
      {
        name: "Admin Dashboard",
        category: "frontend",
        description: "Admin panel for inventory, orders, customers, and analytics",
        technologies: ["React", "TypeScript", "Recharts", "React Query"]
      },
      {
        name: "Search Service",
        category: "backend",
        description: "Full-text search with filters, facets, and recommendations",
        technologies: ["Elasticsearch", "Python", "FastAPI"]
      }
    ],
    default_tasks: [
      { title: "Configure Stripe API keys", description: "Set up Stripe account and configure webhook endpoints", priority_level: "critical" },
      { title: "Set up product database schema", description: "Create tables for products, variants, inventory", priority_level: "high" },
      { title: "Implement cart persistence", description: "Redis-based cart with PostgreSQL backup", priority_level: "high" },
      { title: "Configure email notifications", description: "SendGrid for order confirmations and shipping updates", priority_level: "medium" },
      { title: "Set up search indexing", description: "Elasticsearch sync from product catalog", priority_level: "medium" }
    ],
    recommended_integrations: ["stripe", "sendgrid", "aws_s3", "cloudinary"],
    cicd_template: "github_actions_monorepo",
    estimated_setup_time: "4-6 hours",
    complexity_level: "advanced"
  },
  {
    name: "Social Network Platform",
    description: "Full-featured social network with feeds, messaging, notifications, and media sharing",
    category: "platform",
    icon: "👥",
    architecture_pattern: "event-driven",
    default_services: [
      {
        name: "User Service",
        category: "backend",
        description: "User profiles, follows, blocking, privacy settings",
        technologies: ["Go", "PostgreSQL", "Redis", "gRPC"]
      },
      {
        name: "Feed Service",
        category: "backend",
        description: "Timeline generation, feed ranking, content caching",
        technologies: ["Go", "Redis", "Kafka", "Cassandra"]
      },
      {
        name: "Post Service",
        category: "backend",
        description: "Create, edit, delete posts with media attachments",
        technologies: ["Node.js", "MongoDB", "S3", "Kafka"]
      },
      {
        name: "Real-time Messaging",
        category: "messaging",
        description: "WebSocket-based chat with message persistence",
        technologies: ["Node.js", "Socket.io", "Redis", "PostgreSQL"]
      },
      {
        name: "Notification Service",
        category: "backend",
        description: "Push notifications, email alerts, in-app notifications",
        technologies: ["Go", "Redis", "Firebase", "PostgreSQL"]
      },
      {
        name: "Media Processing",
        category: "storage",
        description: "Image/video upload, compression, CDN integration",
        technologies: ["Python", "FFmpeg", "S3", "CloudFront", "Celery"]
      },
      {
        name: "Web App",
        category: "frontend",
        description: "React SPA with real-time updates and infinite scroll",
        technologies: ["React", "TypeScript", "Socket.io", "TanStack Query"]
      },
      {
        name: "Mobile API Gateway",
        category: "api",
        description: "GraphQL gateway for mobile apps with batching",
        technologies: ["Node.js", "Apollo Server", "Redis"]
      }
    ],
    default_tasks: [
      { title: "Set up WebSocket infrastructure", description: "Configure Socket.io with Redis adapter for scaling", priority_level: "critical" },
      { title: "Implement feed ranking algorithm", description: "Time-decay + engagement scoring", priority_level: "high" },
      { title: "Configure CDN for media", description: "CloudFront or Cloudflare for global delivery", priority_level: "high" },
      { title: "Set up Kafka message broker", description: "Event streaming for feed updates and notifications", priority_level: "high" },
      { title: "Implement rate limiting", description: "Protect APIs from abuse", priority_level: "medium" }
    ],
    recommended_integrations: ["firebase", "aws_s3", "cloudfront", "twilio"],
    cicd_template: "gitlab_ci_microservices",
    estimated_setup_time: "6-8 hours",
    complexity_level: "advanced"
  },
  {
    name: "Content Management System",
    description: "Headless CMS with flexible content types, versioning, and multi-channel publishing",
    category: "platform",
    icon: "📝",
    architecture_pattern: "layered",
    default_services: [
      {
        name: "Content API",
        category: "backend",
        description: "RESTful and GraphQL APIs for content delivery",
        technologies: ["Node.js", "NestJS", "PostgreSQL", "GraphQL"]
      },
      {
        name: "Content Management",
        category: "backend",
        description: "CRUD operations, versioning, workflow management",
        technologies: ["Node.js", "PostgreSQL", "Elasticsearch"]
      },
      {
        name: "Media Library",
        category: "storage",
        description: "Asset management with metadata and transformations",
        technologies: ["Node.js", "S3", "Sharp", "PostgreSQL"]
      },
      {
        name: "Admin Panel",
        category: "frontend",
        description: "Content editor with WYSIWYG, preview, and publishing",
        technologies: ["React", "Draft.js", "React Admin", "TypeScript"]
      },
      {
        name: "Authentication Service",
        category: "auth",
        description: "Role-based access control, API keys, JWT",
        technologies: ["Node.js", "PostgreSQL", "Redis"]
      },
      {
        name: "Search Service",
        category: "backend",
        description: "Full-text search across content types",
        technologies: ["Elasticsearch", "Node.js"]
      },
      {
        name: "Webhook Manager",
        category: "backend",
        description: "Event-driven webhooks for publish, update, delete",
        technologies: ["Node.js", "Redis", "Bull Queue"]
      }
    ],
    default_tasks: [
      { title: "Define content models", description: "Create schemas for pages, articles, products, etc.", priority_level: "critical" },
      { title: "Set up content versioning", description: "Track all changes with diff and rollback", priority_level: "high" },
      { title: "Configure CDN caching", description: "Edge caching for published content", priority_level: "high" },
      { title: "Implement RBAC", description: "Editor, author, reviewer, admin roles", priority_level: "high" },
      { title: "Set up webhook delivery", description: "Reliable webhook dispatch with retries", priority_level: "medium" }
    ],
    recommended_integrations: ["aws_s3", "cloudflare", "algolia", "sendgrid"],
    cicd_template: "github_actions",
    estimated_setup_time: "3-5 hours",
    complexity_level: "intermediate"
  }
];

export async function seedProjectTemplates() {
  try {
    const existingTemplates = await base44.entities.ProjectTemplate.list();
    const existingNames = existingTemplates.map(t => t.name);

    const newTemplates = TEMPLATE_PRESETS.filter(
      template => !existingNames.includes(template.name)
    );

    if (newTemplates.length === 0) {
      return { success: true, message: "Templates already exist" };
    }

    const promises = newTemplates.map(template =>
      base44.entities.ProjectTemplate.create(template)
    );

    await Promise.all(promises);

    return {
      success: true,
      message: `Created ${newTemplates.length} new templates`,
      templates: newTemplates.map(t => t.name)
    };
  } catch (error) {
    console.error("Template seeding failed:", error);
    return { success: false, error: error.message };
  }
}