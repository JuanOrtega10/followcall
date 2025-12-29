'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
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
      const agent: Agent = {
        ...agentData,
        id: generateId(),
        elevenLabsAgentId: agentData.voiceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      saveAgent(agent);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] p-6 md:p-10">
      {/* Efectos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5EEAD4]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          {/* Botón volver */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#5EEAD4]/70 hover:text-[#5EEAD4] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Volver al inicio</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#5EEAD4]/10 rounded-lg border border-[#5EEAD4]/30">
              <Sparkles className="w-6 h-6 text-[#5EEAD4]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Crear Nuevo Agente
            </h1>
          </div>
          <p className="text-[#A7F3D0]/70 ml-[52px]">
            Configura un agente para automatizar llamadas de seguimiento
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#5EEAD4]/20 shadow-[0_0_60px_rgba(94,234,212,0.05)] relative overflow-hidden">
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#5EEAD4]/30 to-transparent"></div>
          
          {/* Error global */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium mb-1">Error al crear agente</p>
                  <p className="text-red-400/70 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <AgentForm onSubmit={handleSubmit} onCancel={() => router.push('/')} />
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