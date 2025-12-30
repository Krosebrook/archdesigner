import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Terminal, Copy, CheckCircle2, Download, FileCode } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SDK_CODE_SAMPLES = {
  python: {
    install: "pip install buildbuddy-sdk",
    quickstart: `from buildbuddy import BuildBuddyClient

client = BuildBuddyClient(
    api_url='https://api.buildbuddy.dev',
    api_key='your_api_key'
)

# Create project
project = client.projects.create(
    name='AI Backend',
    description='Microservices platform',
    category='ai'
)

# Execute workflow
workflow = client.workflows.create(
    name='Security Audit',
    project_id=project['id'],
    agents=[
        {'agent_id': 'agt_123', 'order': 0}
    ]
)

execution = client.workflows.execute(workflow['id'])
print(f"Execution: {execution['id']}")`,
    projects: `# List projects
projects = client.projects.list(category='web')

# Get project
project = client.projects.get('proj_123')

# Update project
client.projects.update('proj_123', status='active')

# Export project
data = client.projects.export('proj_123')`,
    agents: `# List agents
agents = client.agents.list(category='security')

# Create custom agent
agent = client.agents.create(
    name='Custom Reviewer',
    description='Reviews Python code',
    category='testing',
    system_prompt='You are an expert...',
    capabilities=['code-review']
)`,
    workflows: `# Create workflow
workflow = client.workflows.create(
    name='Full Stack Audit',
    project_id='proj_123',
    agents=[
        {'agent_id': 'agt_1', 'order': 0},
        {'agent_id': 'agt_2', 'order': 1}
    ],
    trigger='manual'
)

# Execute with context
execution = client.workflows.execute(
    workflow['id'],
    context={'branch': 'main'}
)`
  },
  javascript: {
    install: "npm install @buildbuddy/sdk",
    quickstart: `import { BuildBuddyClient } from '@buildbuddy/sdk';

const client = new BuildBuddyClient({
  apiUrl: 'https://api.buildbuddy.dev',
  apiKey: process.env.BUILDBUDDY_API_KEY
});

// Create project
const project = await client.projects.create({
  name: 'E-commerce Platform',
  description: 'Microservices',
  category: 'enterprise'
});

// Execute workflow with streaming
await client.workflows.streamExecution(
  executionId,
  (data) => console.log('Progress:', data)
);`,
    projects: `// List projects
const projects = await client.projects.list({
  category: 'web',
  status: 'active'
});

// Create project
const project = await client.projects.create({
  name: 'My Project',
  description: 'Description'
});

// Update
await client.projects.update(projectId, {
  status: 'completed'
});`,
    services: `// Create service
const service = await client.services.create({
  project_id: projectId,
  name: 'Payment Service',
  category: 'backend',
  technology: 'Node.js'
});

// Generate code
const code = await client.services.generateCode(
  service.id,
  'express'
);`,
    error: `try {
  const project = await client.projects.create({
    name: 'My Project'
  });
} catch (error) {
  if (error instanceof BuildBuddyError) {
    console.error('API Error:', error.message);
  }
}`
  },
  go: {
    install: "go get github.com/buildbuddy/sdk-go",
    quickstart: `package main

import (
    "fmt"
    "github.com/buildbuddy/sdk-go"
)

func main() {
    client := buildbuddy.NewClient(buildbuddy.Config{
        APIURL: "https://api.buildbuddy.dev",
        APIKey: os.Getenv("BUILDBUDDY_API_KEY"),
    })

    // Create project
    project, err := client.Projects.Create(
        buildbuddy.Project{
            Name:        "Go Microservices",
            Description: "High-performance",
            Category:    "backend",
        },
    )
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Created: %s\\n", project.ID)
}`,
    concurrent: `var wg sync.WaitGroup
results := make(chan *buildbuddy.Agent, 10)

categories := []string{"frontend", "backend"}
for _, cat := range categories {
    wg.Add(1)
    go func(category string) {
        defer wg.Done()
        agents, _ := client.Agents.List(category, true)
        for _, agent := range agents {
            results <- &agent
        }
    }(cat)
}

go func() {
    wg.Wait()
    close(results)
}()

for agent := range results {
    fmt.Printf("Agent: %s\\n", agent.Name)
}`,
    workflow: `workflow, err := client.Workflows.Create(
    buildbuddy.Workflow{
        Name:      "API Review",
        ProjectID: projectID,
        Agents: []buildbuddy.WorkflowAgent{
            {AgentID: "agt_1", Order: 0},
        },
    },
)

executionID, err := client.Workflows.Execute(
    workflow.ID,
    map[string]interface{}{"env": "prod"},
)`
  },
  cli: {
    install: "npm install -g @buildbuddy/cli",
    auth: `# Configure authentication
buildbuddy auth --api-key YOUR_API_KEY

# Or use environment variable
export BUILDBUDDY_API_KEY=your_key`,
    projects: `# List projects
buildbuddy projects list
buildbuddy projects list --category web

# Create project
buildbuddy projects create \\
  --name "My Project" \\
  --category web

# Delete project
buildbuddy projects delete proj_123`,
    workflows: `# List workflows
buildbuddy workflows list proj_123

# Execute workflow
buildbuddy workflows execute wf_789

# With context
buildbuddy workflows execute wf_789 \\
  --context '{"branch":"main"}'`,
    ci: `# Generate GitHub Actions
buildbuddy ci --platform github \\
  --output .github/workflows/buildbuddy.yml

# Generate GitLab CI
buildbuddy ci --platform gitlab \\
  --output .gitlab-ci.yml`
  }
};

const CI_CD_EXAMPLES = {
  github: `name: BuildBuddy Workflow

on:
  push:
    branches: [ main ]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Code Review
        env:
          BUILDBUDDY_API_KEY: \${{ secrets.BUILDBUDDY_API_KEY }}
        run: |
          npm install -g @buildbuddy/cli
          buildbuddy auth --api-key $BUILDBUDDY_API_KEY
          buildbuddy workflows execute \${{ vars.WORKFLOW_ID }}`,
  gitlab: `stages:
  - review

buildbuddy_review:
  stage: review
  script:
    - npm install -g @buildbuddy/cli
    - buildbuddy auth --api-key $BUILDBUDDY_API_KEY
    - buildbuddy workflows execute $WORKFLOW_ID
  only:
    - merge_requests`,
  jenkins: `pipeline {
  agent any
  
  environment {
    BUILDBUDDY_API_KEY = credentials('buildbuddy-key')
  }
  
  stages {
    stage('Review') {
      steps {
        sh '''
          npm install -g @buildbuddy/cli
          buildbuddy auth --api-key $BUILDBUDDY_API_KEY
          buildbuddy workflows execute \${WORKFLOW_ID}
        '''
      }
    }
  }
}`
};

export default function SDKDocumentationPage() {
  const [activeLanguage, setActiveLanguage] = useState("python");
  const [activeSection, setActiveSection] = useState("quickstart");
  const [copied, setCopied] = useState({});

  const copyCode = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopied({ ...copied, [key]: true });
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4"
              >
                <Code className="w-8 h-8" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                SDKs & CLI
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                Programmatic access to BuildBuddy platform with Python, JavaScript, Go SDKs and CLI tool
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                  <Terminal className="w-3 h-3 mr-1" />
                  4 Languages
                </Badge>
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                  <FileCode className="w-3 h-3 mr-1" />
                  CI/CD Ready
                </Badge>
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                  MIT Licensed
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Language Selector */}
        <Tabs value={activeLanguage} onValueChange={setActiveLanguage} className="mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mx-auto">
            <TabsTrigger value="python">🐍 Python</TabsTrigger>
            <TabsTrigger value="javascript">📘 JavaScript</TabsTrigger>
            <TabsTrigger value="go">🔷 Go</TabsTrigger>
            <TabsTrigger value="cli">🖥️ CLI</TabsTrigger>
          </TabsList>

          {/* Python SDK */}
          <TabsContent value="python" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                    {SDK_CODE_SAMPLES.python.install}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                    onClick={() => copyCode(SDK_CODE_SAMPLES.python.install, 'py-install')}
                  >
                    {copied['py-install'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
              </TabsList>

              {Object.entries(SDK_CODE_SAMPLES.python).map(([key, code]) => (
                key !== 'install' && (
                  <TabsContent key={key} value={key}>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                            {code}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                            onClick={() => copyCode(code, `py-${key}`)}
                          >
                            {copied[`py-${key}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              ))}
            </Tabs>
          </TabsContent>

          {/* JavaScript SDK */}
          <TabsContent value="javascript" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                    {SDK_CODE_SAMPLES.javascript.install}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                    onClick={() => copyCode(SDK_CODE_SAMPLES.javascript.install, 'js-install')}
                  >
                    {copied['js-install'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="error">Error Handling</TabsTrigger>
              </TabsList>

              {Object.entries(SDK_CODE_SAMPLES.javascript).map(([key, code]) => (
                key !== 'install' && (
                  <TabsContent key={key} value={key}>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                            {code}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                            onClick={() => copyCode(code, `js-${key}`)}
                          >
                            {copied[`js-${key}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              ))}
            </Tabs>
          </TabsContent>

          {/* Go SDK */}
          <TabsContent value="go" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                    {SDK_CODE_SAMPLES.go.install}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                    onClick={() => copyCode(SDK_CODE_SAMPLES.go.install, 'go-install')}
                  >
                    {copied['go-install'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
                <TabsTrigger value="concurrent">Concurrent</TabsTrigger>
                <TabsTrigger value="workflow">Workflows</TabsTrigger>
              </TabsList>

              {Object.entries(SDK_CODE_SAMPLES.go).map(([key, code]) => (
                key !== 'install' && (
                  <TabsContent key={key} value={key}>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                            {code}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                            onClick={() => copyCode(code, `go-${key}`)}
                          >
                            {copied[`go-${key}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              ))}
            </Tabs>
          </TabsContent>

          {/* CLI */}
          <TabsContent value="cli" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Installation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                    {SDK_CODE_SAMPLES.cli.install}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                    onClick={() => copyCode(SDK_CODE_SAMPLES.cli.install, 'cli-install')}
                  >
                    {copied['cli-install'] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="auth">Auth</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="ci">CI/CD</TabsTrigger>
              </TabsList>

              {Object.entries(SDK_CODE_SAMPLES.cli).map(([key, code]) => (
                key !== 'install' && (
                  <TabsContent key={key} value={key}>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
                            {code}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                            onClick={() => copyCode(code, `cli-${key}`)}
                          >
                            {copied[`cli-${key}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* CI/CD Integration Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>CI/CD Integration Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="github">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="github">GitHub Actions</TabsTrigger>
                <TabsTrigger value="gitlab">GitLab CI</TabsTrigger>
                <TabsTrigger value="jenkins">Jenkins</TabsTrigger>
              </TabsList>

              {Object.entries(CI_CD_EXAMPLES).map(([key, code]) => (
                <TabsContent key={key} value={key}>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                      {code}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-100"
                      onClick={() => copyCode(code, `ci-${key}`)}
                    >
                      {copied[`ci-${key}`] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Resources */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <FileCode className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">API Reference</h3>
              <p className="text-sm text-gray-600">Complete API documentation with all endpoints</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <Terminal className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">GitHub Repository</h3>
              <p className="text-sm text-gray-600">Source code, examples, and contributions</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <Code className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Example Projects</h3>
              <p className="text-sm text-gray-600">Real-world integration examples</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}