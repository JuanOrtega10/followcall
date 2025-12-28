'use client';

import { Bot, Calendar } from 'lucide-react';
import { Agent } from '@/types/agent';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          {/* Bot Icon */}
          <Bot className="w-8 h-8 text-blue-500" />
          {/* Language Tag */}
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-200">
            {(agent.language || 'ES').toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{agent.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{agent.objective}</p>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </Link>
  );
}


