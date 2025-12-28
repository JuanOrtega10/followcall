import { Agent } from '@/types/agent';
import { Call } from '@/types/call';

const AGENTS_STORAGE_KEY = 'followcall_agents';
const CALLS_STORAGE_KEY = 'followcall_calls';

export function saveAgent(agent: Agent): void {
  const agents = getAgents();
  const existingIndex = agents.findIndex(a => a.id === agent.id);
  
  if (existingIndex >= 0) {
    agents[existingIndex] = { ...agent, updatedAt: new Date().toISOString() };
  } else {
    agents.push(agent);
  }
  
  localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
}

export function getAgents(): Agent[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getAgent(id: string): Agent | null {
  const agents = getAgents();
  return agents.find(a => a.id === id) || null;
}

export function deleteAgent(id: string): void {
  const agents = getAgents();
  const filtered = agents.filter(a => a.id !== id);
  localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(filtered));
}

export function saveCall(call: Call): void {
  const calls = getCalls();
  const existingIndex = calls.findIndex(c => c.id === call.id);
  
  if (existingIndex >= 0) {
    calls[existingIndex] = call;
  } else {
    calls.push(call);
  }
  
  localStorage.setItem(CALLS_STORAGE_KEY, JSON.stringify(calls));
}

export function getCalls(): Call[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(CALLS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getCallsByAgent(agentId: string): Call[] {
  return getCalls().filter(c => c.agentId === agentId);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


