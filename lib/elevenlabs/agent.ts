import { createElevenLabsAgent, getElevenLabsAgent } from './client';
import { Agent } from '@/types/agent';

export async function createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'elevenLabsAgentId'>): Promise<Agent> {
  try {
    const elevenLabsResponse = await createElevenLabsAgent({
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      voiceId: agent.voiceId,
      language: agent.language,
    });

    const fullAgent: Agent = {
      ...agent,
      id: `agent-${Date.now()}`,
      elevenLabsAgentId: elevenLabsResponse.agent_id || elevenLabsResponse.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return fullAgent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

export async function fetchAgentDetails(elevenLabsAgentId: string) {
  try {
    return await getElevenLabsAgent(elevenLabsAgentId);
  } catch (error) {
    console.error('Error fetching agent details:', error);
    throw error;
  }
}

