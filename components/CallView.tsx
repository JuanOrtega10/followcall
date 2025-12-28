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
    isConnecting,
    transcript, 
    duration, 
    connect, 
    disconnect,
    micMuted,
    setMicMuted,
    error,
    apiKeyReady,
    audioLevel
  } = useRealtimeAgent(elevenLabsAgentId);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const isEndingRef = useRef(false);

  // El hook ahora maneja la conexión automáticamente cuando la API key está lista
  // No necesitamos conectar manualmente aquí

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">FOLLOWCALL</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 text-sm font-medium">Live</span>
              </div>
              <span className="text-gray-900 font-mono text-lg font-medium">
                {formatTime(duration)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg p-8 mb-8 max-w-md text-center border border-gray-200 shadow-sm">
          {error ? (
            <div className="text-red-600">
              <p className="text-lg font-semibold mb-2">⚠️ Error</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          ) : !apiKeyReady ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
              <p className="text-gray-900 text-lg font-medium">Cargando configuración...</p>
            </div>
          ) : isConnecting ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500"></div>
              <p className="text-gray-900 text-lg font-medium">Conectando...</p>
              <p className="text-gray-500 text-sm">Solicitando permisos de micrófono</p>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-gray-900 text-lg font-semibold">Conectado</p>
              </div>
              <p className="text-gray-600">Hola! Bienvenido a tu llamada</p>
              {audioLevel > 0 && !micMuted && (
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        audioLevel > i * 20 ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                      style={{ height: `${(i + 1) * 4}px` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-900 text-lg font-medium">Preparando conexión...</p>
          )}
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
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
        <CallControls 
          onEndCall={handleEndCall}
          isMuted={micMuted}
          onToggleMute={() => setMicMuted(!micMuted)}
        />
      </div>
    </div>
  );
}

