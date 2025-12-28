'use client';

import { useState, useEffect, useRef } from 'react';
import { useRealtimeAgent } from '@/lib/elevenlabs/realtime';
import SubtitleToggle from './SubtitleToggle';
import CallControls from './CallControls';
import Transcription from './Transcription';

interface CallViewProps {
  elevenLabsAgentId: string | null | undefined;
  onEndCall: () => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CallView({ elevenLabsAgentId, onEndCall, onTranscriptUpdate }: CallViewProps) {
  const { 
    isConnected, 
    transcript, 
    duration, 
    connect, 
    disconnect,
    micMuted,
    setMicMuted,
    error 
  } = useRealtimeAgent(elevenLabsAgentId);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const hasConnectedRef = useRef(false);
  const isEndingRef = useRef(false);

  useEffect(() => {
    if (!elevenLabsAgentId || hasConnectedRef.current || isEndingRef.current) {
      return;
    }

    // Solo conectar una vez cuando el componente se monta
    hasConnectedRef.current = true;
    connect();

    return () => {
      // Cleanup: desconectar cuando el componente se desmonta
      if (!isEndingRef.current) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevenLabsAgentId]); // Remover connect y disconnect de las dependencias para evitar reconexiones

  useEffect(() => {
    if (transcript && onTranscriptUpdate) {
      console.log('📝 [CALL VIEW] Transcript updated, length:', transcript.length);
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  const handleEndCall = async () => {
    if (isEndingRef.current) {
      console.log('Already ending call, skipping...');
      return;
    }
    
    isEndingRef.current = true;
    console.log('🔴 [CALL VIEW] End call button clicked');
    console.log('📝 [CALL VIEW] Current transcript length:', transcript.length);
    console.log('📝 [CALL VIEW] Current transcript preview:', transcript.substring(0, 200));
    
    try {
      // Asegurar que el transcript final se envíe antes de desconectar
      if (transcript && onTranscriptUpdate) {
        console.log('📝 [CALL VIEW] Sending final transcript update before ending call');
        onTranscriptUpdate(transcript);
        // Esperar un momento para que se actualice el estado
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Desconectar - no esperar, dejar que se ejecute en segundo plano
      disconnect().catch(err => console.error('Error during disconnect:', err));
      
      // Redirigir - el callback manejará el parsing
      console.log('🔄 [CALL VIEW] Calling onEndCall callback');
      onEndCall();
    } catch (error) {
      console.error('❌ [CALL VIEW] Error ending call:', error);
      // Aún así ejecutar el callback para redirigir
      onEndCall();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-600 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-white">FOLLOWCALL</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Live</span>
              </div>
              <span className="text-white font-mono text-lg">
                {formatTime(duration)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Welcome Message */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 max-w-md text-center">
          <p className="text-white text-lg">
            {error ? `Error: ${error}` : isConnected ? 'Hello! Welcome to your interview' : 'Conectando...'}
          </p>
        </div>

        {/* Subtitle Toggle */}
        <div className="mb-8">
          <SubtitleToggle 
            enabled={subtitlesEnabled} 
            onToggle={setSubtitlesEnabled} 
          />
        </div>

        {/* Transcription */}
        {subtitlesEnabled && (
          <Transcription transcript={transcript} isVisible={subtitlesEnabled} />
        )}
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-indigo-950/95 to-transparent">
        <CallControls 
          onEndCall={handleEndCall}
          isMuted={micMuted}
          onToggleMute={() => setMicMuted(!micMuted)}
        />
      </div>
    </div>
  );
}

