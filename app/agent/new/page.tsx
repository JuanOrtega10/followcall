'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AgentForm from '@/components/AgentForm';
import { saveAgent, generateId } from '@/lib/storage';
import { Agent } from '@/types/agent';

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      // El usuario ya ingresó el Agent ID de ElevenLabs manualmente en el campo voiceId
      // Simplemente crear el agente local con ese ID
      const agent: Agent = {
        ...agentData,
        id: generateId(),
        elevenLabsAgentId: agentData.voiceId, // El voiceId contiene el Agent ID de ElevenLabs
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Guardar en localStorage
      saveAgent(agent);
      
      // Redirigir a la vista de prueba
      router.push(`/call/${agent.id}`);
    } catch (error) {
      console.error('Error creating agent:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error desconocido al crear el agente');
      }
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
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-200 font-medium mb-2">Error al crear agente</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <AgentForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}


