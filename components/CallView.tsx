'use client';

import { useState, useEffect, useRef } from 'react';
import { useRealtimeAgent } from '@/lib/elevenlabs/realtime';
import SubtitleToggle from './SubtitleToggle';
import CallControls from './CallControls';
import Transcription from './Transcription';
import { Phone, Loader2, AlertCircle, Wifi } from 'lucide-react';

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
    audioLevel,
    micPermissionGranted
  } = useRealtimeAgent(elevenLabsAgentId);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const isEndingRef = useRef(false);

  const lastTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current && onTranscriptUpdate) {
      console.log('📝 [CALL VIEW] Transcript updated, length:', transcript.length);
      lastTranscriptRef.current = transcript;
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
      if (transcript && onTranscriptUpdate) {
        console.log('📝 [CALL VIEW] Sending final transcript update before ending call');
        onTranscriptUpdate(transcript);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      disconnect().catch(err => console.error('Error during disconnect:', err));
      
      console.log('🔄 [CALL VIEW] Calling onEndCall callback');
      onEndCall();
    } catch (error) {
      console.error('❌ [CALL VIEW] Error ending call:', error);
      onEndCall();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] flex flex-col">
      {/* Efectos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#5EEAD4]/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 border-b border-[#5EEAD4]/20 backdrop-blur-sm bg-[#0D3D2E]/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-[#5EEAD4]/30 blur-lg rounded-full"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#5EEAD4] to-[#A7F3D0] rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#0F4C3A]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FOLLOWCALL</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#5EEAD4]/10 rounded-full border border-[#5EEAD4]/30">
                <div className="w-2 h-2 bg-[#5EEAD4] rounded-full animate-pulse shadow-[0_0_10px_rgba(94,234,212,0.5)]"></div>
                <span className="text-[#5EEAD4] text-sm font-medium">En vivo</span>
              </div>
              <span className="text-white font-mono text-xl font-semibold bg-[#0D3D2E]/60 px-4 py-2 rounded-xl border border-[#5EEAD4]/20">
                {formatTime(duration)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Status Card */}
        <div className="bg-[#0D3D2E]/60 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-md w-full text-center border border-[#5EEAD4]/20 shadow-[0_0_60px_rgba(94,234,212,0.05)]">
          {error ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-red-500/10 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 text-lg font-semibold mb-2">Error de conexión</p>
                <p className="text-[#A7F3D0]/60 text-sm">{error}</p>
              </div>
            </div>
          ) : !apiKeyReady ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#5EEAD4]/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-10 h-10 text-[#5EEAD4] animate-spin relative" />
              </div>
              <p className="text-white text-lg font-medium">Cargando configuración...</p>
            </div>
          ) : isConnecting ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#5EEAD4]/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-10 h-10 text-[#5EEAD4] animate-spin relative" />
              </div>
              <p className="text-white text-lg font-medium">Conectando...</p>
              <p className="text-[#A7F3D0]/60 text-sm">
                {micPermissionGranted ? 'Estableciendo conexión...' : 'Solicitando permisos de micrófono'}
              </p>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col items-center gap-4">
              {/* Indicador de conexión */}
              <div className="relative">
                <div className="absolute inset-0 bg-[#5EEAD4]/30 blur-xl rounded-full animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-br from-[#5EEAD4]/20 to-[#A7F3D0]/10 rounded-full border border-[#5EEAD4]/40">
                  <Wifi className="w-8 h-8 text-[#5EEAD4]" />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#5EEAD4] rounded-full animate-pulse shadow-[0_0_10px_rgba(94,234,212,0.5)]"></div>
                <p className="text-white text-lg font-semibold">Conectado</p>
              </div>
              
              <p className="text-[#A7F3D0]/70">¡Hola! Bienvenido a tu llamada</p>
              
              {/* Indicador de nivel de audio */}
              {audioLevel > 0 && !micMuted && (
                <div className="flex items-center gap-1.5 mt-2 p-2 bg-[#5EEAD4]/10 rounded-full">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        audioLevel > i * 20 
                          ? 'bg-gradient-to-t from-[#5EEAD4] to-[#A7F3D0] shadow-[0_0_5px_rgba(94,234,212,0.5)]' 
                          : 'bg-[#5EEAD4]/20'
                      }`}
                      style={{ height: `${(i + 1) * 6}px` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#5EEAD4]/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="w-10 h-10 text-[#5EEAD4] animate-spin relative" />
              </div>
              <p className="text-white text-lg font-medium">Preparando conexión...</p>
            </div>
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
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0D3D2E]/80 backdrop-blur-md border-t border-[#5EEAD4]/20 z-20">
        <CallControls 
          onEndCall={handleEndCall}
          isMuted={micMuted}
          onToggleMute={() => setMicMuted(!micMuted)}
        />
      </div>
    </div>
  );
}