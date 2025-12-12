import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, FileCheck, AlertTriangle } from "lucide-react";

/**
 * ComplianceReportGenerator Component
 * 
 * Displays compliance reports for multiple standards
 */
export default function ComplianceReportGenerator({ reports, project }) {
  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No compliance reports available</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {reports.map((report, idx) => (
        <Card key={idx} className={`border-2 ${getScoreBg(report.compliance_score)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  {report.standard} Compliance Report
                </CardTitle>
                <CardDescription>
                  {project.name} compliance assessment
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(report.compliance_score)}`}>
                  {report.compliance_score}%
                </div>
                <Progress value={report.compliance_score} className="w-32 mt-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Compliant Controls</div>
                      <div className="text-2xl font-bold text-green-700">
                        {report.compliant_controls?.length || 0}
                      </div>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Non-Compliant Controls</div>
                      <div className="text-2xl font-bold text-red-700">
                        {report.non_compliant_controls?.length || 0}
                      </div>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliant Controls */}
            {report.compliant_controls && report.compliant_controls.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Compliant Controls
                </h4>
                <div className="flex flex-wrap gap-2">
                  {report.compliant_controls.map((control, i) => (
                    <Badge key={i} className="bg-green-100 text-green-800 border-green-300">
                      {control}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Compliant Controls */}
            {report.non_compliant_controls && report.non_compliant_controls.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Non-Compliant Controls & Remediation
                </h4>
                <div className="space-y-3">
                  {report.non_compliant_controls.map((control, i) => (
                    <Card key={i} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{control.control_id}</span>
                              <Badge variant="outline" className="text-xs">
                                {control.priority}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-700 font-medium mb-2">
                              {control.control_name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-semibold text-red-700">Gap:</span>
                            <p className="text-sm text-gray-600 mt-1">{control.gap}</p>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <span className="text-xs font-semibold text-blue-700">Remediation:</span>
                            <p className="text-sm text-blue-900 mt-1">{control.remediation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    Key Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                        <span className="text-sm text-blue-900">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}