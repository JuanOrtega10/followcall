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
  const [isConnected, setIsConnected] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const connectingRef = useRef<boolean>(false);
  const shouldDisconnectRef = useRef<boolean>(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const conversation = useConversation({
    micMuted,
    onMessage: (message) => {
      // Acumular transcripción - message tiene { message: string, role: 'user' | 'ai' }
      console.log('Message received:', message);
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
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      connectingRef.current = false;
      setIsConnected(true);
      setError(null);
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        // Actualizar duración cada segundo
        intervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setDuration(elapsed);
          }
        }, 1000);
      }
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      connectingRef.current = false;
      setIsConnected(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      
      // Limpiar el stream guardado cuando se desconecta
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track in onDisconnect:', track.kind);
        });
        activeStreamRef.current = null;
      }
    },
    onStatusChange: (status) => {
      console.log('Status changed:', status);
      // El status puede venir como objeto {status: 'connected'} o como string directamente
      const statusValue = typeof status === 'string' ? status : status?.status || conversation.status;
      console.log('Status value:', statusValue);
      setIsConnected(statusValue === 'connected');
      if (statusValue === 'connected') {
        connectingRef.current = false;
        if (!startTimeRef.current) {
          startTimeRef.current = Date.now();
          intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setDuration(elapsed);
            }
          }, 1000);
        }
      } else if (statusValue === 'disconnected' || statusValue === 'disconnecting') {
        connectingRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        startTimeRef.current = null;
      }
    },
  });

  const connect = useCallback(async () => {
    if (!elevenLabsAgentId) {
      setError('No se proporcionó un ID de agente de ElevenLabs');
      return;
    }

    // Si se solicitó desconectar, no conectar
    if (shouldDisconnectRef.current) {
      console.log('Disconnect requested, skipping connection');
      return;
    }

    // Prevenir múltiples conexiones simultáneas
    if (connectingRef.current || conversation.status === 'connected' || conversation.status === 'connecting') {
      console.log('Already connecting or connected, skipping...');
      return;
    }

    connectingRef.current = true;
    console.log('Attempting to connect with agent ID:', elevenLabsAgentId);

    try {
      // Solicitar permisos de micrófono primero
      console.log('Requesting microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      // Guardar referencia al stream para poder detenerlo después
      activeStreamRef.current = stream;
      // NO detener el stream aquí - el hook lo necesita activo

      // Iniciar sesión con el agente
      console.log('Starting session with agent:', elevenLabsAgentId);
      const conversationId = await conversation.startSession({
        agentId: elevenLabsAgentId,
        connectionType: 'webrtc', // Cambiar a webrtc para mejor calidad y compatibilidad
      });
      console.log('Session started, conversation ID:', conversationId);

      // El timer se iniciará cuando onConnect o onStatusChange se dispare
      transcriptRef.current = '';
      setTranscript('');
      setError(null);
    } catch (err) {
      console.error('Error connecting to realtime agent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar';
      setError(errorMessage);
      console.error('Full error details:', {
        error: err,
        agentId: elevenLabsAgentId,
        hasMediaDevices: !!navigator.mediaDevices,
      });
      connectingRef.current = false;
    }
  }, [elevenLabsAgentId, conversation]);

  const disconnect = useCallback(async () => {
    console.log('Disconnecting from ElevenLabs...');
    
    // Marcar que se debe desconectar para prevenir reconexiones
    shouldDisconnectRef.current = true;
    
    // Limpiar estado inmediatamente
    setIsConnected(false);
    connectingRef.current = false;
    
    // Limpiar intervalos
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    startTimeRef.current = null;
    transcriptRef.current = '';
    setTranscript('');
    setDuration(0);
    setError(null);
    
    // Detener TODOS los tracks de audio activos ANTES de llamar a endSession
    // Esto asegura que el micrófono se detenga inmediatamente
    try {
      // Detener el stream que guardamos durante la conexión
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped audio track from active stream:', track.kind, track.label);
        });
        activeStreamRef.current = null;
      }
      
      // También intentar detener cualquier otro stream activo
      // Esto es una medida de seguridad adicional
      const allTracks = document.querySelectorAll('audio, video');
      allTracks.forEach(element => {
        const mediaElement = element as HTMLMediaElement;
        if (mediaElement.srcObject) {
          const stream = mediaElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped track from media element:', track.kind);
          });
          mediaElement.srcObject = null;
        }
        mediaElement.pause();
      });
    } catch (err) {
      console.log('Error stopping audio tracks:', err);
    }
    
    try {
      // Llamar a endSession() - según la documentación de ElevenLabs, esto cierra la sesión
      // Esperamos a que termine para asegurar que la conexión se cierre completamente
      await conversation.endSession();
      console.log('Session ended successfully');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [conversation]);

  // Monitorear el estado de la conversación directamente usando un intervalo
  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = conversation.status;
      if (currentStatus === 'connected' && !isConnected) {
        console.log('Detected connected status via polling');
        setIsConnected(true);
        connectingRef.current = false;
        if (!startTimeRef.current) {
          startTimeRef.current = Date.now();
          intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setDuration(elapsed);
            }
          }, 1000);
        }
      } else if ((currentStatus === 'disconnected' || currentStatus === 'disconnecting') && isConnected) {
        console.log('Detected disconnected status via polling');
        setIsConnected(false);
        connectingRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        startTimeRef.current = null;
      }
    };

    // Verificar el estado cada 500ms
    const statusInterval = setInterval(checkStatus, 500);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [conversation.status, isConnected]);

  useEffect(() => {
    return () => {
      // Cleanup: desconectar cuando el componente se desmonta
      shouldDisconnectRef.current = true;
      disconnect().catch(console.error);
    };
  }, [disconnect]);

  const finalIsConnected = isConnected || conversation.status === 'connected';

  return {
    isConnected: finalIsConnected,
    isRecording: finalIsConnected && !micMuted,
    transcript,
    duration,
    error,
    connect,
    disconnect,
    micMuted,
    setMicMuted,
  };
}
