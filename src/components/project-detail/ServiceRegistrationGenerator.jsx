import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code, Loader2, Copy, CheckCircle2, Download } from "lucide-react";
import { motion } from "framer-motion";

const discoveryMechanisms = [
  { value: "consul", label: "HashiCorp Consul" },
  { value: "eureka", label: "Netflix Eureka" },
  { value: "etcd", label: "etcd" },
  { value: "zookeeper", label: "Apache ZooKeeper" },
  { value: "kubernetes", label: "Kubernetes Service Discovery" }
];

export default function ServiceRegistrationGenerator({ project, services }) {
  const [selectedService, setSelectedService] = useState("");
  const [selectedMechanism, setSelectedMechanism] = useState("consul");
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateRegistrationCode = async () => {
    if (!selectedService) return;

    setIsGenerating(true);
    try {
      const service = services.find(s => s.id === selectedService);

      const prompt = `Generate complete, production-ready service registration and de-registration code for:

SERVICE: ${service.name}
DESCRIPTION: ${service.description}
DISCOVERY MECHANISM: ${selectedMechanism}
LANGUAGE: ${selectedLanguage}

Generate code that includes:
1. Service registration on startup with health check endpoint
2. Graceful de-registration on shutdown
3. Health check implementation
4. Retry logic and error handling
5. Configuration management
6. Logging for observability

Return as JSON with:
- registration_code: Main registration logic
- deregistration_code: Cleanup logic
- health_check_code: Health endpoint implementation
- config_example: Configuration file example
- setup_instructions: Step-by-step setup guide`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            registration_code: { type: "string" },
            deregistration_code: { type: "string" },
            health_check_code: { type: "string" },
            config_example: { type: "string" },
            setup_instructions: { type: "string" }
          }
        }
      });

      setGeneratedCode(result);
    } catch (error) {
      console.error("Error generating registration code:", error);
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAll = () => {
    if (!generatedCode) return;

    const files = [
      { name: "registration.js", content: generatedCode.registration_code },
      { name: "deregistration.js", content: generatedCode.deregistration_code },
      { name: "health-check.js", content: generatedCode.health_check_code },
      { name: "config.example.json", content: generatedCode.config_example }
    ];

    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            Service Registration Code Generator
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Generate boilerplate for service discovery registration/de-registration
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Service</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Discovery Mechanism</label>
              <Select value={selectedMechanism} onValueChange={setSelectedMechanism}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {discoveryMechanisms.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Language</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateRegistrationCode}
            disabled={isGenerating || !selectedService}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Code...
              </>
            ) : (
              <>
                <Code className="w-4 h-4 mr-2" />
                Generate Registration Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedCode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Generated Code</h3>
            <Button onClick={downloadAll} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge>Registration</Badge>
                  registration.js
                </CardTitle>
                <Button onClick={() => copyToClipboard(generatedCode.registration_code)} variant="ghost" size="sm">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                {generatedCode.registration_code}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge>De-registration</Badge>
                  deregistration.js
                </CardTitle>
                <Button onClick={() => copyToClipboard(generatedCode.deregistration_code)} variant="ghost" size="sm">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                {generatedCode.deregistration_code}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge>Health Check</Badge>
                  health-check.js
                </CardTitle>
                <Button onClick={() => copyToClipboard(generatedCode.health_check_code)} variant="ghost" size="sm">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                {generatedCode.health_check_code}
              </pre>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm">Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedCode.setup_instructions}</pre>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}