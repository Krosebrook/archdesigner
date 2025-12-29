import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Zap, 
  Code, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Workflow,
  FileCode,
  Copy,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const BEST_PRACTICES = {
  microservices: {
    title: "Microservices Architecture",
    icon: Workflow,
    color: "from-blue-600 to-cyan-600",
    practices: [
      {
        title: "Service Boundaries",
        level: "critical",
        do: [
          "Define clear service boundaries based on business capabilities",
          "Keep services loosely coupled and highly cohesive",
          "Use domain-driven design (DDD) principles",
          "Implement circuit breakers for resilience"
        ],
        dont: [
          "Create services that share databases",
          "Make synchronous calls to more than 3 services",
          "Build monolithic services with multiple responsibilities"
        ],
        example: `// Good: Clear service boundary
class PaymentService {
  async processPayment(orderId, amount) {
    // Single responsibility: process payments
    const payment = await this.stripe.charge(amount);
    await this.publishEvent('payment.completed', { orderId, payment });
    return payment;
  }
}

// Bad: Multiple responsibilities
class OrderPaymentService {
  async createOrder() { /* ... */ }
  async processPayment() { /* ... */ }
  async sendInvoice() { /* ... */ }
  async updateInventory() { /* ... */ }
}`
      },
      {
        title: "API Design",
        level: "high",
        do: [
          "Version your APIs (e.g., /api/v1/users)",
          "Use RESTful conventions or GraphQL",
          "Implement rate limiting per client",
          "Return consistent error responses",
          "Use HATEOAS for discoverability"
        ],
        dont: [
          "Break backward compatibility without versioning",
          "Return stack traces to clients",
          "Use verbs in REST endpoint names"
        ],
        example: `// Good: RESTful API design
GET    /api/v1/orders          // List orders
GET    /api/v1/orders/:id      // Get order
POST   /api/v1/orders          // Create order
PATCH  /api/v1/orders/:id      // Update order
DELETE /api/v1/orders/:id      // Delete order

// Response with HATEOAS
{
  "id": "ord_123",
  "status": "pending",
  "_links": {
    "self": "/api/v1/orders/ord_123",
    "cancel": "/api/v1/orders/ord_123/cancel",
    "items": "/api/v1/orders/ord_123/items"
  }
}`
      },
      {
        title: "Data Management",
        level: "critical",
        do: [
          "Use database per service pattern",
          "Implement event sourcing for audit trails",
          "Use saga pattern for distributed transactions",
          "Cache frequently accessed data"
        ],
        dont: [
          "Share databases between services",
          "Use distributed transactions (2PC)",
          "Store sensitive data unencrypted"
        ]
      }
    ]
  },
  security: {
    title: "Security & Compliance",
    icon: Shield,
    color: "from-red-600 to-pink-600",
    practices: [
      {
        title: "Authentication & Authorization",
        level: "critical",
        do: [
          "Use OAuth 2.0 / OpenID Connect",
          "Implement multi-factor authentication (MFA)",
          "Store passwords with bcrypt (cost factor >= 12)",
          "Use JWT with short expiration times",
          "Implement role-based access control (RBAC)"
        ],
        dont: [
          "Store passwords in plain text",
          "Use long-lived tokens without refresh mechanism",
          "Implement custom crypto algorithms"
        ],
        example: `// Good: JWT with refresh token
const accessToken = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const refreshToken = jwt.sign(
  { userId, type: 'refresh' },
  process.env.REFRESH_SECRET,
  { expiresIn: '7d' }
);

// Bad: Long-lived token
const token = jwt.sign(
  { userId, role },
  'hardcoded-secret',
  { expiresIn: '365d' }
);`
      },
      {
        title: "Data Protection",
        level: "critical",
        do: [
          "Encrypt sensitive data at rest (AES-256)",
          "Use TLS 1.3 for data in transit",
          "Implement field-level encryption for PII",
          "Sanitize all user inputs",
          "Use parameterized queries to prevent SQL injection"
        ],
        dont: [
          "Log sensitive information (passwords, tokens, PII)",
          "Use MD5 or SHA-1 for password hashing",
          "Trust client-side validation alone"
        ],
        example: `// Good: Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Bad: String concatenation (SQL injection risk)
const user = await db.query(
  \`SELECT * FROM users WHERE email = '\${email}'\`
);`
      },
      {
        title: "Compliance (GDPR/HIPAA/PCI-DSS)",
        level: "critical",
        do: [
          "Implement right to access (data export)",
          "Implement right to be forgotten (data deletion)",
          "Maintain audit logs for all data access",
          "Encrypt cardholder data (PCI-DSS)",
          "Get user consent before processing data (GDPR)"
        ],
        dont: [
          "Store credit card numbers without PCI compliance",
          "Process PHI without HIPAA compliance",
          "Transfer data outside EU without proper mechanisms"
        ]
      }
    ]
  },
  performance: {
    title: "Performance Optimization",
    icon: Zap,
    color: "from-yellow-600 to-orange-600",
    practices: [
      {
        title: "Caching Strategy",
        level: "high",
        do: [
          "Implement multi-tier caching (Redis, CDN, Browser)",
          "Cache immutable data aggressively",
          "Use cache invalidation strategies",
          "Set appropriate TTL values",
          "Use stale-while-revalidate pattern"
        ],
        dont: [
          "Cache sensitive user data",
          "Set infinite cache TTL",
          "Cache without invalidation strategy"
        ],
        example: `// Good: Multi-tier caching
// 1. Browser cache (HTTP headers)
res.set('Cache-Control', 'public, max-age=31536000');

// 2. CDN cache
// CloudFront/Cloudflare configuration

// 3. Application cache (Redis)
const cached = await redis.get(\`product:\${id}\`);
if (cached) return JSON.parse(cached);

const product = await db.getProduct(id);
await redis.setex(\`product:\${id}\`, 3600, JSON.stringify(product));
return product;`
      },
      {
        title: "Database Optimization",
        level: "high",
        do: [
          "Create indexes on frequently queried columns",
          "Use connection pooling",
          "Implement pagination for large result sets",
          "Use read replicas for read-heavy workloads",
          "Analyze slow queries regularly"
        ],
        dont: [
          "Use SELECT * queries",
          "Fetch all records without pagination",
          "Create unnecessary indexes (degrades write performance)"
        ],
        example: `// Good: Efficient query with pagination
SELECT id, name, email 
FROM users 
WHERE created_at > $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0

// Add index
CREATE INDEX idx_users_created_at ON users(created_at DESC);

// Bad: No pagination, SELECT *
SELECT * FROM users`
      },
      {
        title: "Frontend Performance",
        level: "medium",
        do: [
          "Use code splitting and lazy loading",
          "Optimize images (WebP, responsive sizes)",
          "Minimize JavaScript bundle size",
          "Use React.memo() for expensive components",
          "Implement virtual scrolling for long lists"
        ],
        dont: [
          "Load entire application on initial page load",
          "Use inline styles (prevents caching)",
          "Re-render entire component trees unnecessarily"
        ]
      }
    ]
  },
  aiAgents: {
    title: "AI Agent Workflows",
    icon: Code,
    color: "from-purple-600 to-pink-600",
    practices: [
      {
        title: "Workflow Design",
        level: "high",
        do: [
          "Keep workflows focused (3-7 agents per workflow)",
          "Use dependencies for proper execution order",
          "Implement error handling strategies",
          "Test workflows incrementally",
          "Monitor execution costs"
        ],
        dont: [
          "Create workflows with circular dependencies",
          "Skip error handling configuration",
          "Chain too many agents sequentially"
        ],
        example: `// Good: Focused workflow with dependencies
{
  name: "Code Quality Check",
  agents: [
    {
      agent_id: "code-reviewer",
      order: 0,
      on_error: "stop"
    },
    {
      agent_id: "security-scanner",
      order: 1,
      depends_on: ["code-reviewer"],
      on_error: "continue"
    },
    {
      agent_id: "test-generator",
      order: 2,
      depends_on: ["code-reviewer"],
      condition: "output.coverage < 80",
      on_error: "stop"
    }
  ]
}`
      },
      {
        title: "Agent Configuration",
        level: "medium",
        do: [
          "Set realistic retry limits (1-3 retries)",
          "Use timeouts to prevent infinite execution",
          "Enable context for knowledge-heavy tasks",
          "Version control agent configurations",
          "Cache LLM responses when possible"
        ],
        dont: [
          "Set unlimited retries",
          "Use expensive models for simple tasks",
          "Ignore cost monitoring"
        ]
      },
      {
        title: "Proactive Insights",
        level: "high",
        do: [
          "Act on failure predictions promptly",
          "Review cost optimization suggestions weekly",
          "Monitor performance trends",
          "Apply recommended fixes when safe",
          "Track insight accuracy over time"
        ],
        dont: [
          "Ignore critical severity insights",
          "Dismiss all suggestions without review",
          "Auto-apply fixes without testing"
        ]
      }
    ]
  }
};

const LevelBadge = ({ level }) => {
  const config = {
    critical: { label: "Critical", color: "bg-red-100 text-red-800", icon: AlertTriangle },
    high: { label: "High Priority", color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
    medium: { label: "Medium Priority", color: "bg-yellow-100 text-yellow-800", icon: CheckCircle2 }
  };

  const { label, color, icon: Icon } = config[level] || config.medium;

  return (
    <Badge className={`${color} border-0`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
};

const PracticeSection = ({ practice }) => {
  const [showExample, setShowExample] = useState(false);

  const copyCode = () => {
    if (practice.example) {
      navigator.clipboard.writeText(practice.example);
      toast.success("Code copied to clipboard");
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {practice.title}
            <LevelBadge level={practice.level} />
          </CardTitle>
          {practice.example && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExample(!showExample)}
            >
              {showExample ? "Hide" : "Show"} Example
              <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${showExample ? 'rotate-90' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Do's */}
        <div>
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Best Practices
          </h4>
          <ul className="space-y-2">
            {practice.do.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Don'ts */}
        {practice.dont && practice.dont.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Avoid These
            </h4>
            <ul className="space-y-2">
              {practice.dont.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Code Example */}
        <AnimatePresence>
          {showExample && practice.example && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                  {practice.example}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                  onClick={copyCode}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default function BestPracticesGuide() {
  const [activeCategory, setActiveCategory] = useState("microservices");

  const category = BEST_PRACTICES[activeCategory];
  const Icon = category.icon;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Best Practices Guide
        </h1>
        <p className="text-lg text-gray-600">
          Industry-standard practices for microservices, security, performance, and AI agents
        </p>
      </motion.div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          {Object.entries(BEST_PRACTICES).map(([key, value]) => {
            const TabIcon = value.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{value.title.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(BEST_PRACTICES).map(([key, value]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            {/* Category Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden border-2">
                <div className={`h-2 bg-gradient-to-r ${value.color}`} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${value.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {value.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Practices */}
            {value.practices.map((practice, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <PracticeSection practice={practice} />
              </motion.div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}