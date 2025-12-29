'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare, Bot, User } from 'lucide-react';

interface TranscriptionProps {
  transcript: string;
  isVisible: boolean;
}

export default function Transcription({ transcript, isVisible }: TranscriptionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && transcript) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!isVisible) return null;

  const messages = transcript.split('\n\n').filter(msg => msg.trim());
  
  return (
    <div className="max-w-3xl w-full mx-auto mt-8 p-6 bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl border border-[#5EEAD4]/20 shadow-[0_0_40px_rgba(94,234,212,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <div className="p-2 bg-[#5EEAD4]/10 rounded-lg border border-[#5EEAD4]/30">
            <MessageSquare className="w-4 h-4 text-[#5EEAD4]" />
          </div>
          <span>Transcripción en tiempo real</span>
          <div className="w-2 h-2 bg-[#5EEAD4] rounded-full animate-pulse shadow-[0_0_10px_rgba(94,234,212,0.5)]"></div>
        </h3>
        {transcript && (
          <span className="text-xs text-[#5EEAD4]/60 bg-[#5EEAD4]/10 px-3 py-1.5 rounded-full border border-[#5EEAD4]/20">
            {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={scrollRef}
        className="whitespace-pre-wrap max-h-96 overflow-y-auto space-y-4 scroll-smooth pr-2"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#5EEAD4 #0D3D2E' }}
      >
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isAgent = message.startsWith('Agente:');
            const isUser = message.startsWith('Usuario:');
            const content = message.replace(/^(Agente|Usuario):\s*/, '');
            
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isAgent 
                    ? 'bg-[#5EEAD4]/10 border-[#5EEAD4]/30 border-l-4 border-l-[#5EEAD4]' 
                    : isUser
                    ? 'bg-[#0A332A]/50 border-[#5EEAD4]/20 border-l-4 border-l-[#A7F3D0]/50'
                    : 'bg-[#0A332A]/30 border-[#5EEAD4]/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                    isAgent 
                      ? 'bg-gradient-to-br from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A]' 
                      : isUser
                      ? 'bg-[#5EEAD4]/20 text-[#5EEAD4] border border-[#5EEAD4]/30'
                      : 'bg-[#5EEAD4]/10 text-[#5EEAD4]/50'
                  }`}>
                    {isAgent ? (
                      <Bot className="w-4 h-4" />
                    ) : isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">?</span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs mb-1.5 font-medium ${
                      isAgent ? 'text-[#5EEAD4]' : isUser ? 'text-[#A7F3D0]/70' : 'text-[#5EEAD4]/50'
                    }`}>
                      {isAgent ? 'Agente' : isUser ? 'Usuario' : 'Sistema'}
                    </div>
                    <div className="text-white/90 leading-relaxed text-sm">{content}</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-[#5EEAD4]/10 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-[#5EEAD4]/40" />
            </div>
            <div className="text-[#A7F3D0]/50 animate-pulse">Esperando transcripción...</div>
          </div>
        )}
      </div>
    </div>
  );
}