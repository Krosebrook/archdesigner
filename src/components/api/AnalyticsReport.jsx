import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { invokeLLM } from "../shared/AILLMProvider";
import { format } from "date-fns";

export const AnalyticsReport = ({ integration, logs }) => {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const analytics = await base44.entities.APIAnalytics.filter({
        integration_id: integration.id
      });

      const stats = {
        total_requests: logs.length,
        success_rate: (logs.filter(l => l.success).length / logs.length * 100).toFixed(1),
        avg_response: (logs.reduce((sum, l) => sum + l.response_time, 0) / logs.length).toFixed(0),
        p95_response: logs.map(l => l.response_time).sort((a, b) => b - a)[Math.floor(logs.length * 0.05)],
        error_count: logs.filter(l => !l.success).length
      };

      const result = await invokeLLM(
        `Generate comprehensive API performance report.

API: ${integration.name}
Report Period: Last ${logs.length} requests

Performance Metrics:
- Total Requests: ${stats.total_requests}
- Success Rate: ${stats.success_rate}%
- Avg Response: ${stats.avg_response}ms
- P95 Response: ${stats.p95_response}ms
- Error Count: ${stats.error_count}

Previous Analytics:
${analytics.length} analysis runs completed

Generate executive summary covering:
1. Performance overview and trends
2. Key findings and insights
3. Risk assessment
4. Recommendations summary
5. Action items with priorities
6. Compliance and SLA status`,
        {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            performance_grade: { type: "string" },
            key_findings: { type: "array", items: { type: "string" } },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            action_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { type: "string" },
                  timeline: { type: "string" }
                }
              }
            },
            sla_status: { type: "string" }
          }
        }
      );

      setReport({ ...result, stats });

      await base44.entities.APIAnalytics.create({
        integration_id: integration.id,
        analysis_type: "report",
        health_score: result.performance_grade === "A" ? 95 : result.performance_grade === "B" ? 80 : 65
      });
    } catch (error) {
      console.error("Report generation error:", error);
    }
    setGenerating(false);
  };

  const downloadReport = () => {
    if (!report) return;
    
    const markdown = `# API Performance Report
## ${integration.name}

**Generated:** ${format(new Date(), 'PPpp')}

---

## Executive Summary

${report.executive_summary}

**Performance Grade:** ${report.performance_grade}

---

## Key Metrics

- **Total Requests:** ${report.stats.total_requests}
- **Success Rate:** ${report.stats.success_rate}%
- **Average Response:** ${report.stats.avg_response}ms
- **P95 Response:** ${report.stats.p95_response}ms
- **Error Count:** ${report.stats.error_count}

---

## Key Findings

${report.key_findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

---

## Risk Assessment

${report.risks.map(r => `
### ${r.risk} (${r.severity})
**Mitigation:** ${r.mitigation}
`).join('\n')}

---

## Action Items

${report.action_items.map(a => `
- **${a.action}**
  - Priority: ${a.priority}
  - Timeline: ${a.timeline}
`).join('\n')}

---

## SLA Status

${report.sla_status}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${integration.name}-report-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Analytics Report
            </CardTitle>
            <Button onClick={generateReport} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Generate Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-l-4 border-blue-600">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Executive Summary</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="text-lg px-3 py-1 bg-blue-600 text-white">
                    Grade: {report.performance_grade}
                  </Badge>
                  <Button size="sm" onClick={downloadReport}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">{report.executive_summary}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(report.stats).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">{key.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {report.key_findings?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg">Key Findings</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {report.key_findings.map((finding, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-purple-600 font-bold">{i + 1}.</span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {report.risks?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {report.risks.map((risk, i) => (
                    <div key={i} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{risk.risk}</h4>
                        <Badge className={
                          risk.severity === "high" ? "bg-red-100 text-red-900" :
                          risk.severity === "medium" ? "bg-yellow-100 text-yellow-900" :
                          "bg-blue-100 text-blue-900"
                        }>
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Mitigation:</strong> {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {report.action_items?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg">Action Items</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {report.action_items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{item.action}</p>
                        <p className="text-sm text-gray-600">Timeline: {item.timeline}</p>
                      </div>
                      <Badge className={
                        item.priority === "high" ? "bg-red-100 text-red-900" :
                        item.priority === "medium" ? "bg-yellow-100 text-yellow-900" :
                        "bg-blue-100 text-blue-900"
                      }>
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};