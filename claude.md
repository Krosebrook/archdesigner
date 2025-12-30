# Claude Integration Documentation

## Overview

ArchDesigner integrates with Claude (by Anthropic) through the Base44 SDK's LLM abstraction layer. Claude powers the AI agent system with advanced reasoning capabilities, particularly excelling at Chain-of-Thought (CoT) reasoning and structured output generation.

**Provider**: Anthropic  
**Model Family**: Claude (Claude 3 and 3.5 families)  
**Integration Method**: Base44 SDK LLM abstraction  
**Version**: 0.0.0  
**Last Updated**: December 29, 2024

---

## Table of Contents

- [Why Claude?](#why-claude)
- [Architecture Integration](#architecture-integration)
- [Usage Patterns](#usage-patterns)
- [Prompt Engineering](#prompt-engineering)
- [Chain-of-Thought (CoT) with Claude](#chain-of-thought-cot-with-claude)
- [Structured Output Generation](#structured-output-generation)
- [Best Practices](#best-practices)
- [Performance Characteristics](#performance-characteristics)
- [Security Considerations](#security-considerations)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)

---

## Why Claude?

### Key Strengths

1. **Superior Reasoning**: Claude excels at complex, multi-step reasoning tasks
2. **Long Context**: Handles large codebases and architecture contexts (100K+ tokens)
3. **Safety & Honesty**: Reduced hallucination, admits uncertainty
4. **Structured Output**: Excellent JSON schema adherence
5. **Code Understanding**: Strong performance on code analysis and generation
6. **Ethical AI**: Built with constitutional AI principles

### Use Cases in ArchDesigner

- **Architecture Analysis**: Complex system evaluation with multi-stage reasoning
- **Security Auditing**: Comprehensive OWASP Top 10 analysis
- **Code Generation**: Production-ready microservice scaffolding
- **Documentation**: Technical writing with accuracy and clarity
- **CI/CD Planning**: Multi-stage pipeline design
- **Compliance Assessment**: Regulatory framework analysis

---

## Architecture Integration

### Base44 SDK Abstraction

Claude is accessed through Base44's unified LLM interface:

```typescript
const base44 = createClientFromRequest(req);
const result = await base44.integrations.Core.InvokeLLM({
  prompt: string,
  response_json_schema?: object, // For structured output
  max_tokens?: number,
  temperature?: number,
  model_preference?: string // Optional model selection
});
```

### Integration Flow

```
User Request
    ↓
Serverless Function (Deno)
    ↓
Input Validation & Sanitization
    ↓
Base44 SDK
    ↓
Base44 LLM Router
    ↓
Claude API (Anthropic)
    ↓
Response Validation
    ↓
Structured Output
    ↓
User Response
```

### Benefits of Abstraction

1. **Provider Flexibility**: Easy to switch or A/B test models
2. **Consistent Interface**: Same code works with multiple providers
3. **Managed Authentication**: Base44 handles API keys
4. **Rate Limiting**: Built-in throttling and retry logic
5. **Cost Tracking**: Centralized token usage monitoring
6. **Error Handling**: Unified error format

---

## Usage Patterns

### Basic Invocation

```typescript
// Simple prompt
const response = await base44.integrations.Core.InvokeLLM({
  prompt: "Analyze this architecture..."
});
```

### Structured Output

```typescript
// With JSON schema for validated output
const response = await base44.integrations.Core.InvokeLLM({
  prompt: buildPrompt(context),
  response_json_schema: {
    type: "object",
    properties: {
      health_score: { type: "number" },
      recommendations: { 
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["health_score", "recommendations"]
  }
});
```

### Advanced CoT Invocation

```typescript
// With explicit Chain-of-Thought stages
const cotResult = await executeAdvancedCoTReasoning({
  task: 'architecture_analysis',
  context: sanitizedContext,
  logger: logger,
  outputSchema: VALIDATION_SCHEMA,
  executor: async (ctx) => {
    return await base44.integrations.Core.InvokeLLM({
      prompt: buildCoTPrompt(ctx, CoTStages.ALL),
      response_json_schema: OUTPUT_SCHEMA
    });
  },
  validator: validateOutput
});
```

---

## Prompt Engineering

### Prompt Structure for Claude

Claude responds well to structured prompts with clear instructions:

```
Role Definition
    ↓
Task Description
    ↓
Context/Data
    ↓
Reasoning Framework (CoT Stages)
    ↓
Output Format
    ↓
Examples (if needed)
    ↓
Constraints/Rules
```

### Example: Architecture Analysis Prompt

```typescript
const prompt = `You are an expert software architect performing a comprehensive architecture analysis.

TASK: Analyze this microservices architecture and provide recommendations.

REASONING STAGES (follow these explicitly):

1. INPUT GATHERING:
   - List all services and their technologies
   - Note the architecture pattern and project category

2. CONTEXTUAL ANALYSIS:
   - Identify service relationships and dependencies
   - Assess technology stack coherence
   - Evaluate architectural patterns used

3. PROBLEM IDENTIFICATION:
   - Find bottlenecks and single points of failure
   - Identify security vulnerabilities
   - Spot scalability limitations
   - Note missing essential services

4. RECOMMENDATION GENERATION:
   - Prioritize issues by severity
   - Provide actionable remediation steps
   - Suggest missing services with rationale

5. OUTPUT FORMATTING:
   - Calculate overall health score (0-100)
   - Structure findings by category
   - Include confidence levels

PROJECT CONTEXT:
Name: ${project.name}
Description: ${project.description}
Services: ${JSON.stringify(services, null, 2)}

Provide your analysis following the structured output format.`;
```

### Prompt Best Practices

1. **Be Explicit**: State exactly what you want
2. **Structure with Headers**: Use clear section markers
3. **Provide Context**: Give relevant background information
4. **Define Output Format**: Specify JSON schema if needed
5. **Use Examples**: Show desired output format
6. **Set Boundaries**: Define what to avoid
7. **Request Confidence**: Ask for uncertainty estimates
8. **Enable CoT**: Explicitly request step-by-step reasoning

---

## Chain-of-Thought (CoT) with Claude

### Why CoT Works Well with Claude

Claude is specifically designed to excel at step-by-step reasoning:
- Constitutional AI training emphasizes reasoning transparency
- Strong performance on multi-hop inference tasks
- Natural ability to explain its thought process
- Reduced hallucination through explicit reasoning

### 5-Stage CoT Framework

**Stage 1: Input Gathering**
```
Claude lists all relevant data points, identifies constraints, notes missing information.
```

**Stage 2: Contextual Analysis**
```
Claude analyzes relationships, considers best practices, evaluates patterns against known architectures.
```

**Stage 3: Problem Identification**
```
Claude discovers issues, prioritizes problems by severity, considers edge cases and failure modes.
```

**Stage 4: Recommendation Generation**
```
Claude proposes solutions with rationale, includes implementation steps, estimates effort and impact.
```

**Stage 5: Output Formatting**
```
Claude structures output according to schema, adds confidence scores, includes reasoning trail for transparency.
```

### Implementing CoT with Claude

```typescript
const cotPrompt = buildCoTPrompt({
  role: "Expert Software Architect",
  task: "Comprehensive Architecture Analysis",
  context: {
    project: sanitizedProject,
    services: sanitizedServices
  },
  stages: [
    {
      name: "Input Gathering",
      instructions: "List all services, technologies, and constraints"
    },
    {
      name: "Contextual Analysis", 
      instructions: "Analyze relationships and evaluate patterns"
    },
    {
      name: "Problem Identification",
      instructions: "Find issues, prioritize by severity"
    },
    {
      name: "Recommendation Generation",
      instructions: "Propose actionable solutions"
    },
    {
      name: "Output Formatting",
      instructions: "Structure findings with confidence scores"
    }
  ],
  outputSchema: ARCHITECTURE_ANALYSIS_SCHEMA
});

const result = await base44.integrations.Core.InvokeLLM({
  prompt: cotPrompt,
  response_json_schema: ARCHITECTURE_ANALYSIS_SCHEMA
});
```

### CoT Output Structure

```typescript
{
  reasoning_steps: [
    {
      stage: "Input Gathering",
      findings: [
        "Identified 8 microservices",
        "Technology stack: Node.js (5), Python (2), Go (1)",
        "Architecture pattern: Microservices with API Gateway"
      ],
      confidence: 1.0
    },
    {
      stage: "Contextual Analysis",
      findings: [
        "Services communicate via REST and message queue",
        "No service mesh detected",
        "Shared database pattern observed (anti-pattern)"
      ],
      confidence: 0.9
    },
    // ... more stages
  ],
  final_answer: {
    health_score: 72,
    bottlenecks: [...],
    recommendations: [...]
  },
  overall_confidence: 0.85
}
```

---

## Structured Output Generation

### JSON Schema Support

Claude excels at generating valid JSON that conforms to schemas:

```typescript
const SCHEMA = {
  type: "object",
  properties: {
    health_score: { 
      type: "number",
      minimum: 0,
      maximum: 100
    },
    bottlenecks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          service: { type: "string" },
          issue: { type: "string" },
          severity: { 
            type: "string",
            enum: ["critical", "high", "medium", "low"]
          }
        },
        required: ["service", "issue", "severity"]
      }
    }
  },
  required: ["health_score", "bottlenecks"]
};
```

### Validation Strategy

1. **Schema Definition**: Define strict JSON schema
2. **LLM Generation**: Claude generates conforming JSON
3. **Parse & Validate**: Parse JSON and validate against schema
4. **Business Logic Check**: Additional domain-specific validation
5. **Fallback**: Retry or return error if validation fails

```typescript
function validateAnalysisResult(result) {
  // Schema validation
  const schemaValidation = validateCoTOutput(result, VALIDATION_SCHEMA);
  if (!schemaValidation.valid) {
    return { valid: false, issues: schemaValidation.issues };
  }

  // Business logic validation
  if (result.health_score < 0 || result.health_score > 100) {
    return { valid: false, issues: ['health_score out of range'] };
  }

  // Consistency checks
  if (result.bottlenecks.length === 0 && result.health_score < 90) {
    return { valid: false, issues: ['Low health score but no bottlenecks identified'] };
  }

  return { valid: true };
}
```

---

## Best Practices

### Prompt Engineering

1. **Clear Instructions**: Be explicit about task and format
2. **Provide Examples**: Show desired output structure
3. **Use Delimiters**: Separate different sections clearly
4. **Request Verification**: Ask Claude to double-check its work
5. **Enable Self-Correction**: Allow Claude to revise reasoning

### Context Management

1. **Sanitize Input**: Remove PII and sensitive data
2. **Limit Context Size**: Keep prompts focused and relevant
3. **Structured Data**: Use JSON for complex data structures
4. **Incremental Processing**: Break large tasks into smaller chunks

### Error Handling

1. **Expect Failures**: Always have fallback logic
2. **Validate Output**: Never trust LLM output without validation
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **Log Everything**: Track prompts, responses, and errors

### Quality Assurance

1. **Request Confidence Scores**: Ask Claude to rate its certainty
2. **Cross-Validate**: Check outputs against known constraints
3. **Human Review**: Critical decisions should have human approval
4. **A/B Testing**: Compare different prompt strategies
5. **Feedback Loops**: Learn from user corrections

---

## Performance Characteristics

### Response Times

- **Simple Analysis**: 2-5 seconds
- **Complex CoT Reasoning**: 10-30 seconds
- **Code Generation**: 15-45 seconds
- **Security Audit**: 20-60 seconds

### Token Consumption

**Average Tokens per Agent**:
- Architecture Analysis: 3,000-5,000 tokens
- Security Audit: 5,000-8,000 tokens
- Code Generation: 8,000-15,000 tokens
- Documentation: 2,000-4,000 tokens

### Context Window

Claude 3 models support:
- **Claude 3 Opus**: 200K tokens
- **Claude 3 Sonnet**: 200K tokens
- **Claude 3 Haiku**: 200K tokens

This allows ArchDesigner to analyze entire codebases in a single context.

---

## Security Considerations

### Data Privacy

**What Claude Sees**:
- Sanitized project metadata (name, description, category)
- Service names and technologies (no implementation code)
- Architecture patterns and relationships
- Configuration structures (no secrets)

**What Claude Never Sees**:
- Personally Identifiable Information (PII)
- API keys, passwords, tokens
- Production data or customer information
- Proprietary business logic details

### Input Sanitization

```typescript
// Before sending to Claude
const safeProject = filterSensitiveForLLM({
  name: sanitiseString(project.name, 200),
  description: sanitiseString(project.description, 2000),
  category: project.category,
  // Remove: created_by, api_keys, secrets, etc.
});
```

### Audit Logging

Every Claude invocation is logged:
- User ID who initiated request
- Task type and context
- Prompt summary (not full prompt)
- Response summary
- Timestamp and correlation ID

### Compliance

- **GDPR**: No personal data sent to Claude
- **HIPAA**: PHI filtered before LLM calls
- **SOC2**: All LLM interactions audited
- **ISO 27001**: Data classification enforced

---

## Cost Optimization

### Token Management

1. **Compress Context**: Remove unnecessary whitespace and comments
2. **Summarize Long Data**: Use summaries instead of full datasets
3. **Cache Prompts**: Reuse system prompts when possible
4. **Batch Requests**: Group similar analyses together
5. **Limit Output**: Set max_tokens appropriately

### Smart Routing

Use cheaper models for simpler tasks:
- **Claude 3 Haiku**: Quick scans, simple analysis
- **Claude 3 Sonnet**: Standard analysis and generation
- **Claude 3 Opus**: Complex reasoning, critical decisions

### Caching Strategy

1. **Architecture Analysis**: Cache for 1 hour (unless project changes)
2. **Security Scans**: Cache for 24 hours
3. **Documentation**: Cache until project updated
4. **Code Generation**: No caching (always fresh)

### Cost Monitoring

```typescript
logger.metric('claude_invocation', executionTime, {
  task: 'architecture_analysis',
  input_tokens: estimatedInputTokens,
  output_tokens: estimatedOutputTokens,
  model: 'claude-3-sonnet',
  cache_hit: false
});
```

---

## Troubleshooting

### Common Issues

**Issue: "Rate limit exceeded"**
- **Cause**: Too many requests to Claude API
- **Solution**: Implement exponential backoff, use caching
- **Prevention**: Batch requests, optimize token usage

**Issue: "Invalid JSON in response"**
- **Cause**: Claude didn't follow schema strictly
- **Solution**: Retry with more explicit schema instructions
- **Prevention**: Include schema examples in prompt

**Issue: "Context length exceeded"**
- **Cause**: Prompt too large for model context window
- **Solution**: Compress context, use smaller model
- **Prevention**: Estimate token count before sending

**Issue: "Hallucinated information"**
- **Cause**: Claude generated plausible but incorrect data
- **Solution**: Validate all outputs, use confidence scores
- **Prevention**: Request evidence, enable CoT reasoning

**Issue: "Low confidence scores"**
- **Cause**: Insufficient context or ambiguous task
- **Solution**: Provide more context, clarify instructions
- **Prevention**: Better prompt engineering

### Debugging Tips

1. **Log Full Prompts**: In development, log entire prompts
2. **Track Token Usage**: Monitor input/output token counts
3. **Measure Latency**: Track time spent in Claude calls
4. **A/B Test Prompts**: Compare different prompt strategies
5. **Review Reasoning Steps**: Examine CoT stages for logic errors

---

## Model Comparison

### Claude 3 and 3.5 Family

| Model | Best For | Speed | Cost | Context |
|-------|----------|-------|------|---------|
| **Claude 3.5 Sonnet** | Advanced tasks, best quality-to-cost ratio | Medium | Medium | 200K |
| **Claude 3 Opus** | Complex reasoning, critical decisions | Slower | High | 200K |
| **Claude 3 Sonnet** | Standard tasks, balanced performance | Medium | Medium | 200K |
| **Claude 3 Haiku** | Quick scans, simple analysis | Fast | Low | 200K |

### When to Use Each

**Claude 3 Opus**:
- Complex security audits
- Architecture refactoring recommendations
- Critical compliance assessments
- Multi-service dependency analysis

**Claude 3 Sonnet** (Default):
- Standard architecture analysis
- Code generation
- Documentation generation
- CI/CD pipeline design

**Claude 3 Haiku**:
- Quick health checks
- Simple service analysis
- Notification content generation
- Status report generation

---

## Future Enhancements

### Planned Improvements

1. **Multi-Modal Analysis**: Use Claude's vision capabilities for diagram analysis
2. **Extended Context**: Analyze entire codebases with 200K+ context
3. **Fine-Tuning**: Custom Claude models for ArchDesigner-specific tasks
4. **Streaming Responses**: Real-time output for long-running tasks
5. **Agent Chaining**: Multiple Claude calls in sequence for complex workflows
6. **Self-Improvement**: Learn from user feedback to improve prompts

### Research Areas

- **Prompt Optimization**: Automated prompt engineering
- **Model Ensembling**: Combine multiple Claude versions
- **Hybrid Approaches**: Mix Claude with traditional algorithms
- **Evaluation Frameworks**: Measure Claude performance on architecture tasks

---

## References

### External Resources

- [Anthropic Claude Documentation](https://docs.anthropic.com/claude/docs)
- [Constitutional AI Paper](https://arxiv.org/abs/2212.08073)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Base44 SDK Documentation](https://base44.com/docs)

### Internal Documentation

- [agents.md](./agents.md) - AI Agent System overview
- [README.md](./README.md) - ArchDesigner overview
- [TECHNICAL_AUDIT.md](./TECHNICAL_AUDIT.md) - Technical details

---

## Support

For Claude integration issues:
- **GitHub Issues**: [archdesigner/issues](https://github.com/Krosebrook/archdesigner/issues)
- **Base44 Support**: support@base44.com
- **Anthropic Support**: support@anthropic.com

---

**Maintained by**: Krosebrook Team  
**Provider**: Anthropic  
**Version**: 0.0.0  
**Last Updated**: December 29, 2024
