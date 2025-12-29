'use client';

import { Bot, Calendar, ChevronRight } from 'lucide-react';
import { Agent } from '@/types/agent';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <div className="group relative p-6 bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl border border-[#5EEAD4]/20 hover:border-[#5EEAD4]/50 transition-all duration-500 cursor-pointer overflow-hidden">
        {/* Efecto hover glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5EEAD4]/0 to-[#5EEAD4]/0 group-hover:from-[#5EEAD4]/5 group-hover:to-[#A7F3D0]/5 transition-all duration-500"></div>
        
        {/* Línea decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5EEAD4]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            {/* Bot Icon con glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#5EEAD4]/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-3 bg-gradient-to-br from-[#5EEAD4]/20 to-[#A7F3D0]/10 rounded-xl border border-[#5EEAD4]/30 group-hover:border-[#5EEAD4]/50 transition-all duration-300">
                <Bot className="w-6 h-6 text-[#5EEAD4]" />
              </div>
            </div>
            
            {/* Language Tag */}
            <span className="px-3 py-1.5 bg-[#5EEAD4]/10 text-[#5EEAD4] rounded-full text-xs font-semibold tracking-wider border border-[#5EEAD4]/30">
              {(agent.language || 'ES').toUpperCase()}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#5EEAD4] transition-colors duration-300">
            {agent.name}
          </h3>
          
          <p className="text-[#A7F3D0]/60 text-sm mb-5 line-clamp-2 leading-relaxed">
            {agent.objective}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#5EEAD4]/50">
              <Calendar className="w-4 h-4" />
              <span>{agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            
            {/* Flecha indicadora */}
            <div className="flex items-center gap-1 text-[#5EEAD4]/50 group-hover:text-[#5EEAD4] transition-all duration-300">
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Ver más</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}