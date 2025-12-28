'use client';

import { Agent } from '@/types/agent';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
        <h3 className="text-xl font-semibold text-white mb-2">{agent.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{agent.objective}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Creado: {new Date(agent.createdAt).toLocaleDateString()}</span>
          <span className="px-2 py-1 bg-purple-600 text-white rounded">
            {agent.language.toUpperCase()}
          </span>
        </div>
      </div>
    </Link>
  );
}

