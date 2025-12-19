import { base44 } from "@/api/base44Client";

/**
 * Hook to save and retrieve AI context for better continuity
 */
export const saveAIInteraction = async (projectId, data) => {
  try {
    await base44.entities.AIContextMemory.create({
      project_id: projectId,
      interaction_type: data.type,
      user_prompt: data.prompt,
      ai_response: data.response,
      metadata: {
        service_ids: data.serviceIds || [],
        technologies: data.technologies || [],
        tags: data.tags || [],
        confidence_score: data.confidence || 0.8,
        user_feedback: "pending"
      },
      related_entities: data.relatedEntities || {},
      token_count: estimateTokens(data.prompt + data.response)
    });
  } catch (error) {
    console.error("Failed to save AI interaction:", error);
  }
};

export const getRelevantContext = async (projectId, limit = 10) => {
  try {
    const memories = await base44.entities.AIContextMemory.filter(
      { project_id: projectId },
      '-created_date',
      limit
    );

    // Build context string from recent memories
    return memories.map(m => {
      if (m.is_summarized) {
        return `[${m.interaction_type}] Summary: ${m.context_summary}`;
      }
      return `[${m.interaction_type}] Q: ${m.user_prompt} A: ${m.ai_response.substring(0, 200)}...`;
    }).join('\n\n');
  } catch (error) {
    console.error("Failed to get context:", error);
    return "";
  }
};

export const getContextForService = async (projectId, serviceId) => {
  try {
    const memories = await base44.entities.AIContextMemory.filter(
      { project_id: projectId },
      '-created_date'
    );

    return memories.filter(m => 
      m.metadata?.service_ids?.includes(serviceId) ||
      m.related_entities?.service_id === serviceId
    );
  } catch (error) {
    console.error("Failed to get service context:", error);
    return [];
  }
};

const estimateTokens = (text) => {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
};

export default {
  saveAIInteraction,
  getRelevantContext,
  getContextForService
};