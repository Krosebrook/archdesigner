import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  Zap,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const categoryIcons = {
  security: Shield,
  performance: Zap,
  resilience: TrendingUp,
  architecture: Sparkles
};

const categoryColors = {
  security: "bg-red-100 text-red-800 border-red-200",
  performance: "bg-blue-100 text-blue-800 border-blue-200",
  resilience: "bg-green-100 text-green-800 border-green-200",
  architecture: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function RuleManagement({ project }) {
  const [discoveredRules, setDiscoveredRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [processingRuleId, setProcessingRuleId] = useState(null);

  useEffect(() => {
    loadDiscoveredRules();
  }, [project?.id]);

  const loadDiscoveredRules = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const rules = await base44.entities.RuleDiscovery.filter(
        { project_id: project.id },
        '-created_date',
        20
      );
      setDiscoveredRules(rules);
    } catch (error) {
      console.error("Error loading discovered rules:", error);
    }
    setIsLoading(false);
  };

  const discoverNewRules = async () => {
    setIsDiscovering(true);
    try {
      // Get all validation reports for this project
      const reports = await base44.entities.ValidationReport.filter(
        { project_id: project.id },
        '-created_date',
        10
      );

      if (reports.length < 3) {
        alert("Need at least 3 validation reports to discover patterns. Run more validations first.");
        setIsDiscovering(false);
        return;
      }

      // Get existing rules to avoid duplicates
      const existingRules = await base44.entities.RuleDiscovery.filter(
        { project_id: project.id }
      );

      // Aggregate findings
      const allFindings = reports.flatMap(r => r.findings || []);
      const findingsSummary = allFindings.map(f => 
        `${f.category} - ${f.severity}: ${f.title} (${f.description.substring(0, 100)}...)`
      ).join('\n');

      const existingRulesText = existingRules.map(r => r.suggested_rule).join('\n');

      const prompt = `You are an architecture governance expert analyzing validation report patterns.

HISTORICAL FINDINGS FROM ${reports.length} VALIDATION REPORTS:
${findingsSummary}

EXISTING DISCOVERED RULES (DO NOT DUPLICATE):
${existingRulesText}

Analyze these findings and identify 3-5 NEW validation rules that:
1. Would catch recurring issues across multiple reports
2. Are specific and actionable
3. Are NOT duplicates of existing rules
4. Have clear detection criteria

For each new rule, provide:
- suggested_rule: A concise, clear rule statement
- rationale: Why this rule matters and what pattern it addresses
- category: One of (security, performance, resilience, architecture)
- confidence: Score 0.0-1.0 based on how often this pattern appears

Return as JSON array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            rules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  suggested_rule: { type: "string" },
                  rationale: { type: "string" },
                  category: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["suggested_rule", "rationale", "category"]
              }
            }
          }
        }
      });

      // Create new rule discovery entries
      const latestReport = reports[0];
      const createPromises = (result.rules || []).map(rule =>
        base44.entities.RuleDiscovery.create({
          source_report_id: latestReport.id,
          project_id: project.id,
          suggested_rule: rule.suggested_rule,
          rationale: rule.rationale,
          category: rule.category,
          confidence: Math.max(0, Math.min(1, rule.confidence || 0.7)),
          accepted: false
        })
      );

      await Promise.all(createPromises);
      await loadDiscoveredRules();
    } catch (error) {
      console.error("Error discovering rules:", error);
    }
    setIsDiscovering(false);
  };

  const acceptRule = async (ruleId) => {
    setProcessingRuleId(ruleId);
    try {
      await base44.entities.RuleDiscovery.update(ruleId, {
        accepted: true,
        ruleset_version: "1.0.0"
      });
      await loadDiscoveredRules();
    } catch (error) {
      console.error("Error accepting rule:", error);
    }
    setProcessingRuleId(null);
  };

  const rejectRule = async (ruleId) => {
    setProcessingRuleId(ruleId);
    try {
      await base44.entities.RuleDiscovery.delete(ruleId);
      await loadDiscoveredRules();
    } catch (error) {
      console.error("Error rejecting rule:", error);
    }
    setProcessingRuleId(null);
  };

  const pendingRules = discoveredRules.filter(r => !r.accepted);
  const acceptedRules = discoveredRules.filter(r => r.accepted);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Proactive Rule Discovery
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                AI identifies patterns in validation reports and suggests new rules
              </p>
            </div>
            <Button
              onClick={discoverNewRules}
              disabled={isDiscovering}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Discover New Rules
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{pendingRules.length}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">{acceptedRules.length}</div>
              <div className="text-sm text-gray-600">Accepted Rules</div>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{discoveredRules.length}</div>
              <div className="text-sm text-gray-600">Total Discovered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingRules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Rules for Review</h3>
          {pendingRules.map((rule, index) => {
            const Icon = categoryIcons[rule.category] || AlertTriangle;
            
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Icon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {rule.suggested_rule}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge className={categoryColors[rule.category]}>
                                {rule.category}
                              </Badge>
                              <Badge variant="outline">
                                {Math.round(rule.confidence * 100)}% confidence
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Discovered {format(new Date(rule.created_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-4">{rule.rationale}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptRule(rule.id)}
                          disabled={processingRuleId === rule.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => rejectRule(rule.id)}
                          disabled={processingRuleId === rule.id}
                          size="sm"
                          variant="outline"
                          className="border-red-200 hover:bg-red-50 text-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {acceptedRules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Accepted Rules (Active in Validation)</h3>
          {acceptedRules.map((rule, index) => {
            const Icon = categoryIcons[rule.category] || AlertTriangle;
            
            return (
              <Card key={rule.id} className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{rule.suggested_rule}</h4>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600">{rule.rationale}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={categoryColors[rule.category]} variant="outline">
                          {rule.category}
                        </Badge>
                        {rule.ruleset_version && (
                          <Badge variant="outline">v{rule.ruleset_version}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {discoveredRules.length === 0 && (
        <Card className="bg-white">
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Rules Discovered Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Run multiple validation reports to allow AI to identify patterns and suggest new rules
            </p>
            <Button
              onClick={discoverNewRules}
              disabled={isDiscovering}
              variant="outline"
            >
              Start Discovering Rules
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}