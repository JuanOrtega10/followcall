'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AgentForm from '@/components/AgentForm';
import { createAgent } from '@/lib/elevenlabs/agent';
import { saveAgent, generateId } from '@/lib/storage';
import { Agent } from '@/types/agent';

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      // Crear agente en ElevenLabs
      const agent = await createAgent(agentData);
      
      // Guardar en localStorage
      saveAgent(agent);
      
      // Redirigir a la vista de prueba
      router.push(`/call/${agent.id}`);
    } catch (error) {
      console.error('Error creating agent:', error);
      // Aún así guardar localmente si falla ElevenLabs
      const localAgent: Agent = {
        ...agentData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveAgent(localAgent);
      router.push(`/call/${localAgent.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Crear Nuevo Agente</h1>
          <p className="text-gray-300">Configura un agente para automatizar llamadas de seguimiento</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
          <AgentForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

