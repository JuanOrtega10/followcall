'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Agent } from '@/types/agent';
import { getAgent, deleteAgent, saveAgent } from '@/lib/storage';
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
    
    // El voiceId ahora contiene el Agent ID de ElevenLabs
    const updatedAgent: Agent = {
      ...agentData,
      id: agent.id,
      elevenLabsAgentId: agentData.voiceId, // Asignar el voiceId como elevenLabsAgentId
      dataSchema: agentData.dataSchema || { fields: [] }, // Asegurar que dataSchema se guarde
      createdAt: agent.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Saving agent with data:', {
      name: updatedAgent.name,
      systemPrompt: updatedAgent.systemPrompt?.substring(0, 50) + '...',
      firstMessage: updatedAgent.firstMessage,
      dataSchemaFields: updatedAgent.dataSchema?.fields?.length || 0,
    });
    
    // Actualizar solo system prompt y first message en ElevenLabs
    // Usar siempre el agente por defecto: agent_2401kdkas1a9evba5w8tezpfesvf
    const defaultAgentId = 'agent_2401kdkas1a9evba5w8tezpfesvf';
    
    try {
      const updatePayload: any = {
        agentId: defaultAgentId,
        systemPrompt: updatedAgent.systemPrompt,
      };
      
      // Incluir firstMessage si existe
      if (updatedAgent.firstMessage) {
        updatePayload.firstMessage = updatedAgent.firstMessage;
      }
      
      const updateResponse = await fetch('/api/agents/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error updating agent in ElevenLabs:', errorData);
        // Continuar guardando localmente aunque falle la actualización en ElevenLabs
      } else {
        console.log('✅ Agent system prompt and first message updated successfully in ElevenLabs');
      }
    } catch (error) {
      console.error('Error updating agent in ElevenLabs:', error);
      // Continuar guardando localmente aunque falle la actualización en ElevenLabs
    }
    
    // Guardar actualización local usando saveAgent para mantener consistencia
    saveAgent(updatedAgent);
    
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-900 mb-4 font-semibold">Agente no encontrado</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">Editar Agente</h1>
            <p className="text-gray-600">{agent.name}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/call/${agent.id}`}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Probar Agente
            </Link>
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <AgentForm agent={agent} onSubmit={handleSubmit} onCancel={() => router.push('/')} />
        </div>
      </div>
    </div>
  );
}


