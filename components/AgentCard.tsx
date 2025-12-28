'use client';

import { Heart, Calendar } from 'lucide-react';
import { Agent } from '@/types/agent';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          {/* Heartbeat Icon */}
          <Heart className="w-8 h-8 text-green-400 fill-green-400" />
          {/* Language Tag */}
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
            {(agent.language || 'ES').toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">{agent.name}</h3>
        <p className="text-white text-sm mb-4">{agent.objective}</p>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </Link>
  );
}


