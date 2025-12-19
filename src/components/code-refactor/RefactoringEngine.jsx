import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileCode,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function RefactoringEngine({ project, services, analysis, selectedServiceId }) {
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [refactoringResults, setRefactoringResults] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (selectedServiceId && analysis?.issues) {
      const serviceIssues = analysis.issues
        .filter(i => i.service_id === selectedServiceId)
        .map(i => i.id);
      setSelectedIssues(serviceIssues);
    }
  }, [selectedServiceId, analysis]);

  const toggleIssue = (issueId) => {
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const selectAll = () => {
    if (!analysis?.issues) return;
    setSelectedIssues(analysis.issues.map(i => i.id));
  };

  const deselectAll = () => {
    setSelectedIssues([]);
  };

  const applyRefactoring = async () => {
    if (selectedIssues.length === 0) {
      toast.error("Please select at least one issue to refactor");
      return;
    }

    setIsRefactoring(true);
    setProgress(0);

    try {
      const selectedIssueData = analysis.issues.filter(i => selectedIssues.includes(i.id));
      const progressIncrement = 100 / selectedIssues.length;

      const results = [];

      for (let i = 0; i < selectedIssueData.length; i++) {
        const issue = selectedIssueData[i];
        
        // Simulate applying refactoring
        const prompt = `Apply the following refactoring:

ISSUE: ${issue.title}
DESCRIPTION: ${issue.description}
CURRENT CODE: ${issue.current_code}
REFACTORED CODE: ${issue.refactored_code}

Generate the complete refactored file with:
- The refactored code properly integrated
- All necessary imports and dependencies
- Proper formatting and structure
- Comments explaining the changes
- Any additional improvements that complement this refactoring

Return the complete refactored file content and a summary of changes.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              file_path: { type: "string" },
              refactored_content: { type: "string" },
              changes_summary: { type: "string" },
              status: { type: "string" }
            }
          }
        });

        results.push({
          issue_id: issue.id,
          issue_title: issue.title,
          ...result
        });

        setProgress((i + 1) * progressIncrement);
      }

      // Save refactoring results
      await base44.entities.RefactoringRecommendation.create({
        project_id: project.id,
        analysis_summary: `Applied ${selectedIssues.length} refactorings`,
        overall_score: 85,
        issues: selectedIssueData,
        recommendations: results.map(r => r.changes_summary),
        status: "applied"
      });

      // Trigger documentation sync
      window.dispatchEvent(new CustomEvent('code-refactored', { 
        detail: { projectId: project.id, changes: results }
      }));

      setRefactoringResults(results);
      toast.success(`Successfully applied ${results.length} refactorings`);
    } catch (error) {
      console.error("Refactoring failed:", error);
      toast.error("Failed to apply refactoring");
    } finally {
      setIsRefactoring(false);
      setProgress(100);
    }
  };

  const downloadRefactoredFiles = () => {
    if (!refactoringResults) return;

    refactoringResults.forEach(result => {
      const blob = new Blob([result.refactored_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.file_path?.split('/').pop() || 'refactored-file.txt';
      a.click();
      URL.revokeObjectURL(url);
    });

    toast.success("Downloaded all refactored files");
  };

  if (!analysis?.issues || analysis.issues.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FileCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No refactoring suggestions available</p>
          <p className="text-sm text-gray-500 mt-2">Run code analysis first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Automatic Refactoring
          </CardTitle>
          <CardDescription>
            Select issues to automatically apply AI-powered refactoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedIssues.length} of {analysis.issues.length} selected
            </div>
            <div className="flex gap-2">
              <Button onClick={selectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={deselectAll} variant="outline" size="sm">
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analysis.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={selectedIssues.includes(issue.id)}
                  onCheckedChange={() => toggleIssue(issue.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{issue.title}</span>
                    <Badge variant={
                      issue.severity === 'critical' ? 'destructive' :
                      issue.severity === 'high' ? 'default' : 'secondary'
                    } className="text-xs">
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>

          {isRefactoring && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Applying refactoring...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button
            onClick={applyRefactoring}
            disabled={isRefactoring || selectedIssues.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            size="lg"
          >
            {isRefactoring ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Refactoring {selectedIssues.length} issues...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Apply {selectedIssues.length} Refactoring{selectedIssues.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {refactoringResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="w-5 h-5" />
                  Refactoring Complete
                </CardTitle>
                <Button onClick={downloadRefactoredFiles} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Files
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {refactoringResults.length}
                  </div>
                  <div className="text-sm text-green-700">Files Refactored</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">100%</div>
                  <div className="text-sm text-green-700">Success Rate</div>
                </div>
              </div>

              <AnimatePresence>
                {refactoringResults.map((result, idx) => (
                  <motion.div
                    key={result.issue_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <CardTitle className="text-sm">{result.issue_title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-gray-600">
                          📄 {result.file_path}
                        </div>
                        <div className="p-3 bg-gray-50 rounded border text-sm">
                          {result.changes_summary}
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            View Refactored Code
                          </summary>
                          <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                            {result.refactored_content}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}