'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';

export interface RealtimeCallState {
  isConnected: boolean;
  isRecording: boolean;
  transcript: string;
  duration: number;
  error: string | null;
}

export function useRealtimeAgent(elevenLabsAgentId: string | null | undefined) {
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');

  const conversation = useConversation({
    micMuted,
    onMessage: (message) => {
      // Acumular transcripción - message tiene { message: string, role: 'user' | 'ai' }
      if (message.message) {
        const prefix = message.role === 'user' ? 'Usuario: ' : 'Agente: ';
        transcriptRef.current += prefix + message.message + '\n';
        setTranscript(transcriptRef.current.trim());
      }
    },
    onError: (errorMessage, context) => {
      console.error('Conversation error:', errorMessage, context);
      setError(errorMessage || 'Error en la conversación');
    },
  });

  const connect = useCallback(async () => {
    if (!elevenLabsAgentId) {
      setError('No se proporcionó un ID de agente de ElevenLabs');
      return;
    }

    try {
      // Solicitar permisos de micrófono primero
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Iniciar sesión con el agente
      await conversation.startSession({
        agentId: elevenLabsAgentId,
        connectionType: 'websocket', // o 'webrtc' para mejor calidad
      });

      startTimeRef.current = Date.now();
      transcriptRef.current = '';
      setTranscript('');
      setError(null);

      // Actualizar duración cada segundo
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDuration(elapsed);
        }
      }, 1000);
    } catch (err) {
      console.error('Error connecting to realtime agent:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar');
    }
  }, [elevenLabsAgentId, conversation]);

  const disconnect = useCallback(() => {
    conversation.endSession();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    transcriptRef.current = '';
    setTranscript('');
    setDuration(0);
    setError(null);
  }, [conversation]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: conversation.status === 'connected',
    isRecording: conversation.status === 'connected' && !micMuted,
    transcript,
    duration,
    error,
    connect,
    disconnect,
    micMuted,
    setMicMuted,
  };
}
