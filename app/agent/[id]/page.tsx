'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Trash2, Loader2, AlertCircle } from 'lucide-react';
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
    
    const updatedAgent: Agent = {
      ...agentData,
      id: agent.id,
      elevenLabsAgentId: agentData.voiceId,
      dataSchema: agentData.dataSchema || { fields: [] },
      createdAt: agent.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Saving agent with data:', {
      name: updatedAgent.name,
      systemPrompt: updatedAgent.systemPrompt?.substring(0, 50) + '...',
      firstMessage: updatedAgent.firstMessage,
      dataSchemaFields: updatedAgent.dataSchema?.fields?.length || 0,
    });
    
    const defaultAgentId = 'agent_2401kdkas1a9evba5w8tezpfesvf';
    
    try {
      const updatePayload: any = {
        agentId: defaultAgentId,
        systemPrompt: updatedAgent.systemPrompt,
      };
      
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
      } else {
        console.log('✅ Agent system prompt and first message updated successfully in ElevenLabs');
      }
    } catch (error) {
      console.error('Error updating agent in ElevenLabs:', error);
    }
    
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] flex items-center justify-center">
        {/* Efectos de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#5EEAD4]/30 blur-xl rounded-full animate-pulse"></div>
            <Loader2 className="w-10 h-10 text-[#5EEAD4] animate-spin relative" />
          </div>
          <p className="text-[#A7F3D0]/70 text-sm tracking-wider">Cargando agente...</p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] flex items-center justify-center p-6">
        {/* Efectos de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center bg-[#0D3D2E]/60 backdrop-blur-sm p-10 rounded-2xl border border-[#5EEAD4]/20">
          <div className="inline-block p-4 bg-red-500/10 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-white text-xl font-semibold mb-2">Agente no encontrado</p>
          <p className="text-[#A7F3D0]/60 mb-6">El agente que buscas no existe o fue eliminado</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(94,234,212,0.4)] hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] p-6 md:p-10">
      {/* Efectos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5EEAD4]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            {/* Botón volver */}
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-[#5EEAD4]/70 hover:text-[#5EEAD4] transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Volver al inicio</span>
            </Link>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
              Editar Agente
            </h1>
            <p className="text-[#5EEAD4] font-medium">{agent.name}</p>
          </div>
          
          <div className="flex gap-3">
            {/* Botón Probar Agente */}
            <Link
              href={`/call/${agent.id}`}
              className="group relative px-5 py-2.5 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(94,234,212,0.4)] hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Probar Agente
              </span>
            </Link>
            
            {/* Botón Eliminar */}
            <button
              onClick={handleDelete}
              className="group px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </span>
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#5EEAD4]/20 shadow-[0_0_60px_rgba(94,234,212,0.05)]">
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#5EEAD4]/30 to-transparent"></div>
          
          <AgentForm agent={agent} onSubmit={handleSubmit} onCancel={() => router.push('/')} />
        </div>

        {/* Footer sutil */}
        <div className="mt-12 text-center">
          <p className="text-[#5EEAD4]/30 text-xs tracking-widest uppercase">
            Powered by AI • Healing through connection
          </p>
        </div>
      </div>
    </div>
  );
}