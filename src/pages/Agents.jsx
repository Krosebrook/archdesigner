
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Sparkles, 
  ExternalLink,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export default function AgentsPage() {
  const agents = [
    {
      name: "Architecture Assistant",
      key: "architecture_assistant",
      description: "AI expert that helps you design, validate, and optimize microservices architectures with proactive insights",
      icon: "🏗️",
      capabilities: [
        "Create projects & services",
        "Proactive anti-pattern detection",
        "Auto-generate documentation",
        "Suggest new validation rules",
        "Architecture consultation",
        "Refactoring recommendations"
      ],
      color: "from-blue-500 to-purple-600",
      proactiveFeatures: [
        {
          title: "Dependency Analysis",
          description: "Automatically detects circular dependencies, high coupling, and god services"
        },
        {
          title: "Rule Discovery",
          description: "Proposes new validation rules based on recurring patterns across projects"
        },
        {
          title: "Smart Documentation",
          description: "Generates comprehensive architecture docs from your existing data"
        }
      ]
    }
  ];

  const getWhatsAppUrl = (agentKey) => {
    return base44.agents.getWhatsAppConnectURL(agentKey);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
            AI Agents
          </h1>
          <p className="text-gray-600 text-lg">
            Intelligent assistants to help you design and manage your architectures
          </p>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Proactive AI Architecture Assistant</h3>
              <p className="text-gray-700 text-sm mb-3">
                Our AI doesn't just respond - it actively monitors your architectures, identifies anti-patterns, 
                and suggests improvements BEFORE problems occur. It learns from validation reports across all projects 
                to propose new validation rules and generates comprehensive documentation automatically.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Natural Language
                </Badge>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Proactive Analysis
                </Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Pattern Learning
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Agents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white">
                <CardHeader className={`bg-gradient-to-r ${agent.color} text-white rounded-t-xl`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-4xl">{agent.icon}</div>
                    <div>
                      <CardTitle className="text-xl text-white">{agent.name}</CardTitle>
                      <Badge className="bg-white/20 text-white border-white/30 mt-1">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {agent.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Capabilities
                    </h4>
                    <ul className="space-y-1">
                      {agent.capabilities.map((cap, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {agent.proactiveFeatures && (
                    <div className="mb-6 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <h4 className="font-semibold text-purple-900 text-xs mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Proactive Features
                      </h4>
                      {agent.proactiveFeatures.map((feature, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <p className="text-xs font-medium text-purple-800">{feature.title}</p>
                          <p className="text-xs text-purple-700">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <a
                      href={getWhatsAppUrl(agent.key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Connect WhatsApp
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </a>
                    <p className="text-xs text-gray-500 text-center">
                      Chat with this agent on WhatsApp
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                How to Use the Proactive AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Connect</h4>
                    <p className="text-sm text-gray-600">
                      Click "Connect WhatsApp" to link the agent to your WhatsApp account
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Analyze</h4>
                    <p className="text-sm text-gray-600">
                      Agent proactively analyzes your architectures and surfaces insights before you ask
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Improve</h4>
                    <p className="text-sm text-gray-600">
                      Get refactoring suggestions, new validation rules, and auto-generated docs
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Example Conversations:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• "Analyze my e-commerce project for anti-patterns"</li>
                  <li>• "Generate comprehensive documentation for Project X"</li>
                  <li>• "What circular dependencies exist in my architecture?"</li>
                  <li>• "Show me refactoring recommendations based on dependency analysis"</li>
                  <li>• "Propose new validation rules based on common failures"</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-purple-100 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 text-sm">🤖 Proactive Capabilities:</h4>
                <div className="grid md:grid-cols-3 gap-3 text-xs text-purple-800">
                  <div>
                    <strong>Dependency Analysis:</strong> Detects circular deps, high coupling, god services, orphaned services automatically
                  </div>
                  <div>
                    <strong>Rule Discovery:</strong> Tracks validation failures across projects and proposes new rules when patterns emerge 3+ times
                  </div>
                  <div>
                    <strong>Auto Documentation:</strong> Generates Markdown docs with service catalog, API listings, and dependency maps
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
