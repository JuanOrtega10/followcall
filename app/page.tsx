'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { Agent } from '@/types/agent';
import { getAgents, getCalls } from '@/lib/storage';
import AgentCard from '@/components/AgentCard';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [successRate, setSuccessRate] = useState<number | null>(null);

  useEffect(() => {
    const agentsList = getAgents();
    setAgents(agentsList);

    // Calcular llamadas de hoy
    const calls = getCalls();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCalls = calls.filter(call => {
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            {/* Logo Stethoscope */}
            <Stethoscope className="w-10 h-10 text-green-400" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Follow Call</h1>
              <p className="text-white text-sm">Seguimiento médico automatizado con IA</p>
            </div>
          </div>
          <Link
            href="/agent/new"
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            + Nuevo Agente
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Total Agentes</p>
            <p className="text-white text-3xl font-bold">{agents.length}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Llamadas Hoy</p>
            <p className="text-green-400 text-3xl font-bold">{callsToday}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Tasa de Éxito</p>
            <p className="text-blue-400 text-3xl font-bold">
              {successRate !== null ? `${successRate}%` : '--'}
            </p>
          </div>
        </div>

        {/* Agents List */}
        {agents.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-4">No tienes agentes creados aún</p>
            <Link
              href="/agent/new"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Crear tu primer agente
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
