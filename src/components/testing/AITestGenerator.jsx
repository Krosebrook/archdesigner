import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FlaskConical, 
  Loader2, 
  Copy, 
  Download,
  CheckCircle2,
  Code,
  Bug,
  Layers,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import { saveAIInteraction } from "../ai-context/useAIContext";

const testFrameworks = [
  { value: "jest", label: "Jest", icon: "🃏" },
  { value: "vitest", label: "Vitest", icon: "⚡" },
  { value: "mocha", label: "Mocha", icon: "☕" },
  { value: "cypress", label: "Cypress", icon: "🌲" }
];

const testTypes = [
  { id: "unit", label: "Unit Tests", icon: Code, color: "text-blue-600" },
  { id: "integration", label: "Integration Tests", icon: Layers, color: "text-purple-600" },
  { id: "edge-cases", label: "Edge Cases", icon: Bug, color: "text-orange-600" },
  { id: "performance", label: "Performance Tests", icon: Zap, color: "text-green-600" }
];

function AITestGenerator({ project, services = [], analysis }) {
  const [selectedService, setSelectedService] = useState("all");
  const [selectedFramework, setSelectedFramework] = useState("jest");
  const [selectedTypes, setSelectedTypes] = useState(["unit", "integration", "edge-cases"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState(null);
  const [copied, setCopied] = useState({});

  const toggleTestType = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const generateTests = async () => {
    if (selectedTypes.length === 0) {
      toast.error("Please select at least one test type");
      return;
    }

    setIsGenerating(true);
    try {
      const targetServices = selectedService === "all" 
        ? services 
        : services.filter(s => s.id === selectedService);

      const serviceDetails = targetServices.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        technologies: s.technologies || [],
        apis: s.apis || [],
        boilerplate_code: s.boilerplate_code
      }));

      // Get refactoring issues for context
      const refactoringContext = analysis?.issues
        ?.filter(i => selectedService === "all" || i.service_id === selectedService)
        .map(i => ({
          title: i.title,
          category: i.category,
          location: i.location,
          description: i.description
        })) || [];

      const prompt = `You are a senior test automation engineer. Generate comprehensive test suites for the following ${selectedService === "all" ? "services" : "service"}:

PROJECT: ${project.name}
SERVICES: ${serviceDetails.map(s => `${s.name} (${s.technologies.join(", ")})`).join("; ")}

${refactoringContext.length > 0 ? `KNOWN ISSUES TO TEST:
${refactoringContext.map(i => `- ${i.title} (${i.category}): ${i.description}`).join("\n")}
` : ""}

TEST FRAMEWORK: ${selectedFramework}
TEST TYPES: ${selectedTypes.join(", ")}

Generate production-ready test suites with:

1. **UNIT TESTS** - Test individual functions, methods, components:
   - Happy path scenarios
   - Boundary conditions
   - Null/undefined handling
   - Type validation
   - Pure function behavior
   - Mocking dependencies

2. **INTEGRATION TESTS** - Test service interactions:
   - API endpoints (request/response)
   - Database operations (CRUD)
   - Service-to-service communication
   - Authentication/authorization flows
   - Error propagation

3. **EDGE CASES** - Complex scenarios:
   - Race conditions
   - Concurrent requests
   - Large datasets
   - Network failures
   - Timeout handling
   - Memory leaks

4. **PERFORMANCE TESTS** - Load and stress:
   - Response time benchmarks
   - Throughput limits
   - Resource utilization
   - Concurrent user handling

For EACH test suite, provide:
- File path (e.g., __tests__/services/auth.test.js)
- Complete test code with:
  - Proper setup/teardown
  - Descriptive test names
  - Arrange-Act-Assert pattern
  - Comprehensive assertions
  - Mock data and fixtures
  - Comments explaining complex scenarios
- Test coverage estimate
- Critical paths tested
- Edge cases covered

Use ${selectedFramework} syntax and best practices. Make tests maintainable and readable.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            total_tests: { type: "number" },
            estimated_coverage: { type: "number" },
            test_suites: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  file_path: { type: "string" },
                  test_type: { type: "string" },
                  test_code: { type: "string" },
                  test_count: { type: "number" },
                  critical_paths: { type: "array", items: { type: "string" } },
                  edge_cases_covered: { type: "array", items: { type: "string" } },
                  setup_instructions: { type: "string" }
                }
              }
            },
            integration_scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  services_involved: { type: "array", items: { type: "string" } },
                  test_code: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            performance_benchmarks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metric: { type: "string" },
                  target: { type: "string" },
                  test_code: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Save to AI context memory
      await saveAIInteraction(project.id, {
        type: "test_generation",
        prompt: `Generated tests for ${selectedService === "all" ? "all services" : "selected service"}`,
        response: JSON.stringify(result),
        serviceIds: selectedService === "all" ? services.map(s => s.id) : [selectedService],
        technologies: [...new Set(serviceDetails.flatMap(s => s.technologies))],
        tags: ["testing", ...selectedTypes],
        confidence: 0.9
      });

      setGeneratedTests(result);
      toast.success(`Generated ${result.total_tests} tests with ${result.estimated_coverage}% coverage`);
    } catch (error) {
      console.error("Test generation failed:", error);
      toast.error("Failed to generate tests");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content, key) => {
    navigator.clipboard.writeText(content);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    toast.success("Copied to clipboard");
  };

  const downloadAllTests = () => {
    if (!generatedTests) return;

    generatedTests.test_suites.forEach(suite => {
      const blob = new Blob([suite.test_code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suite.file_path.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    });

    toast.success("Downloaded all test files");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-600" />
            AI Test Generation
          </CardTitle>
          <CardDescription>
            Generate comprehensive test suites with edge case coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Select Service
              </label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} • {service.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Test Framework
              </label>
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {testFrameworks.map(framework => (
                    <SelectItem key={framework.value} value={framework.value}>
                      <span className="flex items-center gap-2">
                        <span>{framework.icon}</span>
                        {framework.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">
              Test Types to Generate
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              {testTypes.map(type => (
                <div
                  key={type.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleTestType(type.id)}
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={() => toggleTestType(type.id)}
                  />
                  <type.icon className={`w-5 h-5 ${type.color}`} />
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={generateTests}
            disabled={isGenerating || services.length === 0 || selectedTypes.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Tests...
              </>
            ) : (
              <>
                <FlaskConical className="w-5 h-5 mr-2" />
                Generate Test Suite
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedTests && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-blue-900">
                    {generatedTests.total_tests}
                  </div>
                  <div className="text-sm text-blue-700">Total Tests</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-900">
                    {generatedTests.estimated_coverage}%
                  </div>
                  <div className="text-sm text-green-700">Est. Coverage</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-purple-900">
                    {generatedTests.test_suites?.length || 0}
                  </div>
                  <div className="text-sm text-purple-700">Test Suites</div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-orange-900">
                    {generatedTests.integration_scenarios?.length || 0}
                  </div>
                  <div className="text-sm text-orange-700">Integration Tests</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">{generatedTests.summary}</p>
              <Button onClick={downloadAllTests} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <Tabs defaultValue="unit" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="unit">Unit Tests</TabsTrigger>
                <TabsTrigger value="integration">Integration</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="unit" className="space-y-4">
                {generatedTests.test_suites
                  ?.filter(suite => suite.test_type === "unit" || suite.test_type === "edge-cases")
                  .map((suite, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{suite.service_name}</CardTitle>
                            <CardDescription className="mt-1">
                              📄 {suite.file_path}
                            </CardDescription>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{suite.test_count} tests</Badge>
                              <Badge variant="secondary">{suite.test_type}</Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(suite.test_code, `unit-${idx}`)}
                          >
                            {copied[`unit-${idx}`] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                          {suite.test_code}
                        </pre>

                        {suite.critical_paths?.length > 0 && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-semibold text-blue-900 mb-2">Critical Paths:</div>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {suite.critical_paths.map((path, i) => (
                                <li key={i}>✓ {path}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {suite.edge_cases_covered?.length > 0 && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-sm font-semibold text-orange-900 mb-2">Edge Cases:</div>
                            <ul className="text-sm text-orange-800 space-y-1">
                              {suite.edge_cases_covered.map((edge, i) => (
                                <li key={i}>⚠️ {edge}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {suite.setup_instructions && (
                          <div className="p-3 bg-gray-50 rounded-lg border text-xs">
                            <strong>Setup:</strong> {suite.setup_instructions}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="integration" className="space-y-4">
                {generatedTests.integration_scenarios?.map((scenario, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{scenario.name}</CardTitle>
                            <CardDescription className="mt-1">{scenario.description}</CardDescription>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {scenario.services_involved?.map((service, i) => (
                                <Badge key={i} variant="outline">{service}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(scenario.test_code, `integration-${idx}`)}
                          >
                            {copied[`integration-${idx}`] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                          {scenario.test_code}
                        </pre>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                {generatedTests.performance_benchmarks?.map((benchmark, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{benchmark.metric}</CardTitle>
                            <CardDescription>Target: {benchmark.target}</CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(benchmark.test_code, `perf-${idx}`)}
                          >
                            {copied[`perf-${idx}`] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                          {benchmark.test_code}
                        </pre>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

AITestGenerator.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired,
  services: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    category: PropTypes.string,
    technologies: PropTypes.arrayOf(PropTypes.string),
    apis: PropTypes.array
  })),
  analysis: PropTypes.shape({
    issues: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      category: PropTypes.string,
      location: PropTypes.string,
      description: PropTypes.string,
      service_id: PropTypes.string
    }))
  })
};

export default AITestGenerator;