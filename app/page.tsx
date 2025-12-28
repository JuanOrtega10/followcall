'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall } from 'lucide-react';
import { Agent } from '@/types/agent';
import { getAgents, getCalls } from '@/lib/storage';
import AgentCard from '@/components/AgentCard';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [successRate, setSuccessRate] = useState<number | null>(null);

  useEffect(() => {
    // Inicializar en 0
    setCallsToday(0);
    setSuccessRate(null);
    
    const agentsList = getAgents();
    setAgents(agentsList);

    // Calcular llamadas de hoy
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

      // Calcular tasa de éxito (llamadas completadas con structuredData)
      const completedCalls = calls.filter(call => call.status === 'completed' && call.structuredData);
      if (calls.length > 0) {
        const rate = Math.round((completedCalls.length / calls.length) * 100);
        setSuccessRate(rate);
      }
    } catch (error) {
      // En caso de error, mantener en 0
      setCallsToday(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            {/* Logo PhoneCall */}
            <PhoneCall className="w-10 h-10 text-blue-500" />
            <div>
              <h1 className="text-4xl font-semibold text-gray-900 mb-1">Follow Call</h1>
              <p className="text-gray-600 text-sm">Seguimiento automatizado con IA</p>
            </div>
          </div>
          <Link
            href="/agent/new"
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            + Nuevo Agente
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-gray-500 text-sm mb-2">Total Agentes</p>
            <p className="text-gray-900 text-3xl font-semibold">{agents.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-gray-500 text-sm mb-2">Llamadas Hoy</p>
            <p className="text-blue-500 text-3xl font-semibold">{callsToday}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-gray-500 text-sm mb-2">Tasa de Éxito</p>
            <p className="text-blue-500 text-3xl font-semibold">
              {successRate !== null ? `${successRate}%` : '--'}
            </p>
          </div>
        </div>

        {/* Agents List */}
        {agents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No tienes agentes creados aún</p>
            <Link
              href="/agent/new"
              className="inline-block px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Crear tu primer agente
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
