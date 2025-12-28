'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Agent } from '@/types/agent';
import { getAgents } from '@/lib/storage';
import AgentCard from '@/components/AgentCard';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    setAgents(getAgents());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Follow Call</h1>
            <p className="text-gray-300">Gestiona tus agentes de seguimiento automatizado</p>
          </div>
          <Link
            href="/agent/new"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            + Nuevo Agente
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-4">No tienes agentes creados aún</p>
            <Link
              href="/agent/new"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Crear tu primer agente
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
  );
}
