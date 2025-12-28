'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Agent } from '@/types/agent';
import { getAgents } from '@/lib/storage';
import AgentCard from '@/components/AgentCard';
import { Plus, Phone, Stethoscope } from 'lucide-react';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    setAgents(getAgents());
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/50 via-[#0a0f1a] to-emerald-950/30 pointer-events-none" />
      
      <div className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl">
                <Stethoscope className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Follow Call</h1>
                <p className="text-gray-400">Seguimiento médico automatizado con IA</p>
              </div>
            </div>
            <Link
              href="/agent/new"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-5 h-5" />
              Nuevo Agente
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-gray-400 text-sm">Total Agentes</p>
              <p className="text-2xl font-bold text-white">{agents.length}</p>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-gray-400 text-sm">Llamadas Hoy</p>
              <p className="text-2xl font-bold text-emerald-400">0</p>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
              <p className="text-gray-400 text-sm">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-blue-400">--</p>
            </div>
          </div>

          {/* Content */}
          {agents.length === 0 ? (
            <div className="text-center py-20 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
              <div className="p-4 bg-emerald-500/20 rounded-2xl w-fit mx-auto mb-4">
                <Phone className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No tienes agentes creados</h3>
              <p className="text-gray-400 mb-6">Crea tu primer agente de seguimiento automatizado</p>
              <Link
                href="/agent/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Crear Agente
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}