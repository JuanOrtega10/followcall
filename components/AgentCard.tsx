'use client';

import { Agent } from '@/types/agent';
import Link from 'next/link';
import { Phone, Calendar, ChevronRight, Activity } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer">
        
        {/* Icon + Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
            {agent.language.toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {agent.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{agent.objective}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(agent.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver más <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}