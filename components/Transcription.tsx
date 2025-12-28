'use client';

import { useEffect, useRef } from 'react';

interface TranscriptionProps {
  transcript: string;
  isVisible: boolean;
}

export default function Transcription({ transcript, isVisible }: TranscriptionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevo contenido
  useEffect(() => {
    if (scrollRef.current && transcript) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!isVisible) return null;

  // Parsear el transcript para mostrar mensajes de forma más clara
  const messages = transcript.split('\n\n').filter(msg => msg.trim());
  
  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Transcripción en tiempo real
        </h3>
        {transcript && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div 
        ref={scrollRef}
        className="text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto space-y-3 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isAgent = message.startsWith('Agente:');
            const isUser = message.startsWith('Usuario:');
            const content = message.replace(/^(Agente|Usuario):\s*/, '');
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  isAgent 
                    ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' 
                    : isUser
                    ? 'bg-gray-50 border-gray-200 border-l-4 border-l-gray-400'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isAgent 
                      ? 'bg-blue-500 text-white' 
                      : isUser
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isAgent ? 'A' : isUser ? 'U' : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1 font-medium">
                      {isAgent ? 'Agente' : isUser ? 'Usuario' : 'Sistema'}
                    </div>
                    <div className="text-gray-900 leading-relaxed">{content}</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-pulse">Esperando transcripción...</div>
          </div>
        )}
      </div>
    </div>
  );
}


