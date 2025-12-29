'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, Sparkles, Activity, TrendingUp } from 'lucide-react';
import { Agent } from '@/types/agent';
import { getAgents, getCalls } from '@/lib/storage';
import AgentCard from '@/components/AgentCard';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [successRate, setSuccessRate] = useState<number | null>(null);

  useEffect(() => {
    setCallsToday(0);
    setSuccessRate(null);
    
    const agentsList = getAgents();
    setAgents(agentsList);

    try {
      const calls = getCalls();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCalls = calls.filter(call => {
        if (!call.startedAt) return false;
        const callDate = new Date(call.startedAt);
        callDate.setHours(0, 0, 0, 0);
        return callDate.getTime() === today.getTime();
      });
      setCallsToday(todayCalls.length);

      const completedCalls = calls.filter(call => call.status === 'completed' && call.structuredData);
      if (calls.length > 0) {
        const rate = Math.round((completedCalls.length / calls.length) * 100);
        setSuccessRate(rate);
      }
    } catch (error) {
      setCallsToday(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] p-6 md:p-10">
      {/* Efecto de partículas/brillo sutil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            {/* Logo con efecto glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#5EEAD4] blur-xl opacity-50 rounded-full"></div>
              <div className="relative bg-gradient-to-br from-[#5EEAD4] to-[#A7F3D0] p-3 rounded-2xl">
                <PhoneCall className="w-8 h-8 text-[#0F4C3A]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Follow Call
              </h1>
              <p className="text-[#A7F3D0]/80 text-sm flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Seguimiento automatizado con IA
              </p>
            </div>
          </div>
          
          <Link
            href="/agent/new"
            className="group relative px-6 py-3 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(94,234,212,0.4)] hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">+</span>
              Nuevo Agente
            </span>
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Total Agentes */}
          <div className="group bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#5EEAD4]/20 hover:border-[#5EEAD4]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(94,234,212,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#A7F3D0]/70 text-sm font-medium uppercase tracking-wider">Total Agentes</p>
              <div className="p-2 bg-[#5EEAD4]/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-[#5EEAD4]" />
              </div>
            </div>
            <p className="text-white text-4xl font-bold">{agents.length}</p>
          </div>

          {/* Llamadas Hoy */}
          <div className="group bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#5EEAD4]/20 hover:border-[#5EEAD4]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(94,234,212,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#A7F3D0]/70 text-sm font-medium uppercase tracking-wider">Llamadas Hoy</p>
              <div className="p-2 bg-[#5EEAD4]/10 rounded-lg">
                <Activity className="w-4 h-4 text-[#5EEAD4]" />
              </div>
            </div>
            <p className="text-[#5EEAD4] text-4xl font-bold">{callsToday}</p>
          </div>

          {/* Tasa de Éxito */}
          <div className="group bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#5EEAD4]/20 hover:border-[#5EEAD4]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(94,234,212,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#A7F3D0]/70 text-sm font-medium uppercase tracking-wider">Tasa de Éxito</p>
              <div className="p-2 bg-[#5EEAD4]/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-[#5EEAD4]" />
              </div>
            </div>
            <p className="text-[#5EEAD4] text-4xl font-bold">
              {successRate !== null ? `${successRate}%` : '--'}
            </p>
          </div>
        </div>

        {/* Agents List */}
        {agents.length === 0 ? (
          <div className="text-center py-20 bg-[#0D3D2E]/40 backdrop-blur-sm rounded-2xl border border-[#5EEAD4]/20">
            <div className="inline-block p-4 bg-[#5EEAD4]/10 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-[#5EEAD4]" />
            </div>
            <p className="text-[#A7F3D0]/70 mb-6 text-lg">No tienes agentes creados aún</p>
            <Link
              href="/agent/new"
              className="inline-block px-8 py-3 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(94,234,212,0.4)] hover:scale-105"
            >
              Crear tu primer agente
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Footer sutil */}
        <div className="mt-16 text-center">
          <p className="text-[#5EEAD4]/30 text-xs tracking-widest uppercase">
            Powered by AI • Healing through connection
          </p>
        </div>
      </div>
    </div>
  );
}