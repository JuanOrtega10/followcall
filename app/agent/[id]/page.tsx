'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Agent } from '@/types/agent';
import { getAgent, deleteAgent } from '@/lib/storage';
import AgentForm from '@/components/AgentForm';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const foundAgent = getAgent(params.id as string);
      setAgent(foundAgent);
      setLoading(false);
    }
  }, [params.id]);

  const handleSubmit = async (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!agent) return;
    
    // TODO: Actualizar en ElevenLabs
    const updatedAgent: Agent = {
      ...agentData,
      id: agent.id,
      createdAt: agent.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    // Guardar actualización local
    const agents = JSON.parse(localStorage.getItem('followcall_agents') || '[]');
    const index = agents.findIndex((a: Agent) => a.id === agent.id);
    if (index >= 0) {
      agents[index] = updatedAgent;
      localStorage.setItem('followcall_agents', JSON.stringify(agents));
    }
    
    setAgent(updatedAgent);
    router.push('/');
  };

  const handleDelete = () => {
    if (!agent) return;
    if (confirm('¿Estás seguro de que quieres eliminar este agente?')) {
      deleteAgent(agent.id);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Agente no encontrado</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Editar Agente</h1>
            <p className="text-gray-300">{agent.name}</p>
          </div>
          <div className="flex gap-4">
            <Link
              href={`/call/${agent.id}`}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Probar Agente
            </Link>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
          <AgentForm agent={agent} onSubmit={handleSubmit} onCancel={() => router.push('/')} />
        </div>
      </div>
    </div>
  );
}


