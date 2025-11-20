import { base44 } from "@/api/base44Client";

/**
 * Centralized AI LLM invocation utility
 * Handles common patterns for calling AI with structured responses
 */
export const invokeLLM = async (prompt, schema, options = {}) => {
  const {
    addContext = false,
    fileUrls = null
  } = options;

  try {
    return await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: addContext,
      response_json_schema: schema,
      ...(fileUrls && { file_urls: fileUrls })
    });
  } catch (error) {
    console.error("AI LLM Error:", error);
    throw error;
  }
};

/**
 * Common schema patterns for reuse
 */
export const schemas = {
  serviceDiscovery: {
    type: "object",
    properties: {
      suggested_services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            rationale: { type: "string" },
            priority: { type: "string" }
          }
        }
      },
      communication_patterns: {
        type: "array",
        items: {
          type: "object",
          properties: {
            from_service: { type: "string" },
            to_service: { type: "string" },
            pattern: { type: "string" },
            protocol: { type: "string" }
          }
        }
      }
    }
  },
  
  cicdConfig: {
    type: "object",
    properties: {
      platform: { type: "string" },
      deployment_targets: { type: "array", items: { type: "object" } },
      pipeline_stages: { type: "object" },
      rationale: { type: "string" }
    }
  }
};