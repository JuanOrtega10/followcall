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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // Nivel de audio para indicadores visuales
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');
  const transcriptMessagesRef = useRef<Array<{role: 'user' | 'ai', message: string, timestamp: number}>>([]); // Mensajes individuales para mejor manejo
  const connectingRef = useRef<boolean>(false);
  const shouldDisconnectRef = useRef<boolean>(false);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const hasAttemptedConnectionRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Obtener la API key al montar el componente
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/elevenlabs/api-key');
        if (response.ok) {
          const data = await response.json();
          setApiKey(data.apiKey);
          console.log('✅ ElevenLabs API key loaded');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          console.error('❌ Error loading API key:', errorData);
          setError('Error al cargar la API key de ElevenLabs');
        }
      } catch (err) {
        console.error('❌ Error fetching API key:', err);
        setError('Error al obtener la API key de ElevenLabs');
      }
    };

    fetchApiKey();
  }, []);

  // Solo inicializar el hook cuando tengamos la API key
  // Usar una key para forzar reinicialización cuando cambie la API key
  const conversation = useConversation({
    apiKey: apiKey || undefined, // Pasar la API key al hook
    micMuted,
    onMessage: (message) => {
      // Manejar mensajes de forma más estructurada
      console.log('Message received:', message);
      if (message.message && message.message.trim()) {
        const timestamp = Date.now();
        const messageEntry = {
          role: message.role as 'user' | 'ai',
          message: message.message.trim(),
          timestamp
        };
        
        // Agregar a la lista de mensajes
        transcriptMessagesRef.current.push(messageEntry);
        
        // Construir transcript formateado
        const formattedTranscript = transcriptMessagesRef.current
          .map(msg => {
            const prefix = msg.role === 'user' ? 'Usuario' : 'Agente';
            return `${prefix}: ${msg.message}`;
          })
          .join('\n\n');
        
        transcriptRef.current = formattedTranscript;
        setTranscript(formattedTranscript);
      }
    },
    onError: (errorMessage, context) => {
      console.error('Conversation error:', errorMessage, context);
      setError(errorMessage || 'Error en la conversación');
    },
    onConnect: () => {
      console.log('✅ [ON_CONNECT] Connected to ElevenLabs');
      console.log('✅ [ON_CONNECT] Setting isConnecting to false, isConnected to true');
      connectingRef.current = false;
      setIsConnecting(false);
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
      console.log('🔄 [ON_STATUS_CHANGE] Status changed:', status);
      // El status puede venir como objeto {status: 'connected'} o como string directamente
      const statusValue = typeof status === 'string' ? status : status?.status || conversation.status;
      console.log('🔄 [ON_STATUS_CHANGE] Status value:', statusValue);
      setIsConnected(statusValue === 'connected');
      if (statusValue === 'connected') {
        console.log('✅ [ON_STATUS_CHANGE] Setting isConnecting to false (connected)');
        connectingRef.current = false;
        setIsConnecting(false); // Asegurar que isConnecting se actualice cuando la conexión se establece
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
        console.log('❌ [ON_STATUS_CHANGE] Setting isConnecting to false (disconnected)');
        connectingRef.current = false;
        setIsConnecting(false); // También actualizar cuando se desconecta
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        startTimeRef.current = null;
      } else if (statusValue === 'connecting') {
        // Si el estado es 'connecting', mantener isConnecting en true
        console.log('⏳ [ON_STATUS_CHANGE] Setting isConnecting to true (connecting)');
        connectingRef.current = true;
        setIsConnecting(true);
      }
    },
  });

  // Intentar conectar automáticamente cuando la API key esté disponible
  useEffect(() => {
    console.log('🔍 [AUTO-CONNECT] useEffect triggered', {
      hasApiKey: !!apiKey,
      hasAgentId: !!elevenLabsAgentId,
      hasAttempted: hasAttemptedConnectionRef.current,
      isConnected,
      conversationStatus: conversation?.status
    });

    // Resetear los flags cuando cambian las dependencias clave
    if (apiKey && elevenLabsAgentId) {
      hasAttemptedConnectionRef.current = false;
      shouldDisconnectRef.current = false; // Resetear el flag de desconexión para permitir nueva conexión
    }

    // Solo intentar conectar si tenemos API key y agent ID, y no hemos intentado conectar antes
    if (!apiKey || !elevenLabsAgentId || hasAttemptedConnectionRef.current) {
      console.log('⏸️ [AUTO-CONNECT] Skipping connection', {
        hasApiKey: !!apiKey,
        hasAgentId: !!elevenLabsAgentId,
        hasAttempted: hasAttemptedConnectionRef.current
      });
      return;
    }

    // Si ya estamos conectados, no hacer nada
    if (isConnected || conversation.status === 'connected') {
      console.log('⏸️ [AUTO-CONNECT] Already connected, skipping', {
        isConnected,
        conversationStatus: conversation.status
      });
      hasAttemptedConnectionRef.current = true;
      return;
    }

    // Si se solicitó desconectar, no conectar
    if (shouldDisconnectRef.current) {
      console.log('⏸️ [AUTO-CONNECT] Disconnect requested, skipping');
      return;
    }

    console.log('🔍 [AUTO-CONNECT] Checking connection conditions...', {
      hasApiKey: !!apiKey,
      hasAgentId: !!elevenLabsAgentId,
      isConnecting: connectingRef.current,
      isConnected,
      shouldDisconnect: shouldDisconnectRef.current,
      conversationStatus: conversation?.status
    });

    // Marcar que intentamos conectar para evitar múltiples intentos
    hasAttemptedConnectionRef.current = true;

    // Esperar un momento para asegurar que el hook useConversation esté listo con la nueva API key
    const timer = setTimeout(() => {
      // Verificar nuevamente antes de conectar (las condiciones pueden haber cambiado)
      if (!connectingRef.current && !isConnected && !shouldDisconnectRef.current) {
        console.log('🚀 [AUTO-CONNECT] API key ready, attempting to connect...', { 
          hasApiKey: !!apiKey, 
          agentId: elevenLabsAgentId,
          conversationStatus: conversation?.status 
        });
        connect();
      } else {
        // Si las condiciones cambiaron, resetear el flag para permitir otro intento
        hasAttemptedConnectionRef.current = false;
      }
    }, 1000); // Delay suficiente para que el hook se actualice

    return () => {
      console.log('🧹 [AUTO-CONNECT] Cleaning up timer');
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, elevenLabsAgentId]); // Solo ejecutar cuando apiKey o agentId cambien

  const connect = useCallback(async () => {
    console.log('📞 [CONNECT] connect() called', {
      hasAgentId: !!elevenLabsAgentId,
      hasApiKey: !!apiKey,
      isConnecting: connectingRef.current,
      conversationStatus: conversation?.status,
      shouldDisconnect: shouldDisconnectRef.current
    });

    if (!elevenLabsAgentId) {
      const errorMsg = 'No se proporcionó un ID de agente de ElevenLabs';
      console.error('❌ [CONNECT]', errorMsg);
      setError(errorMsg);
      return;
    }

    // Verificar que la API key esté disponible
    if (!apiKey) {
      const errorMsg = 'Esperando la API key de ElevenLabs...';
      console.log('⏳ [CONNECT]', errorMsg);
      setError(errorMsg);
      return;
    }

    // Si se solicitó desconectar, no conectar
    if (shouldDisconnectRef.current) {
      console.log('⏸️ [CONNECT] Disconnect requested, skipping connection');
      return;
    }

    // Prevenir múltiples conexiones simultáneas
    if (connectingRef.current || conversation.status === 'connected' || conversation.status === 'connecting') {
      console.log('⏸️ [CONNECT] Already connecting or connected, skipping...', {
        connectingRef: connectingRef.current,
        status: conversation.status
      });
      return;
    }

    connectingRef.current = true;
    setIsConnecting(true);
    console.log('🚀 [CONNECT] Attempting to connect with agent ID:', elevenLabsAgentId);

    try {
      // Solicitar permisos de micrófono primero con mejor configuración de audio
      console.log('Requesting microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimizado para voz
        } 
      });
      console.log('Microphone permission granted');
      
      // Guardar referencia al stream
      activeStreamRef.current = stream;
      
      // Configurar análisis de audio para indicadores visuales
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // Monitorear nivel de audio
        const checkAudioLevel = () => {
          if (analyserRef.current && isConnected) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average);
            requestAnimationFrame(checkAudioLevel);
          }
        };
        checkAudioLevel();
      } catch (audioError) {
        console.log('Audio analysis not available:', audioError);
      }

      // Iniciar sesión con el agente
      console.log('Starting session with agent:', elevenLabsAgentId);
      const conversationId = await conversation.startSession({
        agentId: elevenLabsAgentId,
        connectionType: 'webrtc', // Cambiar a webrtc para mejor calidad y compatibilidad
      });
      console.log('Session started, conversation ID:', conversationId);

      // Limpiar transcripts anteriores
      transcriptRef.current = '';
      transcriptMessagesRef.current = [];
      setTranscript('');
      setError(null);
      // NO establecer setIsConnecting(false) aquí - dejar que onConnect/onStatusChange lo manejen
    } catch (err) {
      console.error('Error connecting to realtime agent:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar';
      setError(errorMessage);
      setIsConnecting(false);
      connectingRef.current = false;
      console.error('Full error details:', {
        error: err,
        agentId: elevenLabsAgentId,
        hasMediaDevices: !!navigator.mediaDevices,
      });
    }
  }, [elevenLabsAgentId, conversation, apiKey]);

  const disconnect = useCallback(async () => {
    console.log('Disconnecting from ElevenLabs...');
    
    // Marcar que se debe desconectar para prevenir reconexiones
    shouldDisconnectRef.current = true;
    // Resetear el flag de intento de conexión para permitir reconexión en el futuro
    hasAttemptedConnectionRef.current = false;
    
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
    transcriptMessagesRef.current = [];
    setTranscript('');
    setDuration(0);
    setError(null);
    setIsConnecting(false);
    setAudioLevel(0);
    
    // Limpiar análisis de audio
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    
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
        setIsConnecting(false); // Asegurar que isConnecting se actualice
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
        setIsConnecting(false); // También actualizar cuando se desconecta
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
      console.log('🧹 [CLEANUP] Component unmounting, disconnecting...');
      shouldDisconnectRef.current = true;
      disconnect().catch(console.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al desmontar, no cuando cambien las dependencias

  const finalIsConnected = isConnected || conversation.status === 'connected';
  // Usar conversation.status como fuente de verdad principal para isConnecting
  // Si está conectado, definitivamente no está conectando
  // Si está conectando, definitivamente está conectando
  // De lo contrario, usar el estado local
  const finalIsConnecting = conversation.status === 'connected' 
    ? false 
    : conversation.status === 'connecting' 
    ? true 
    : isConnecting;

  // Logging para debugging
  useEffect(() => {
    console.log('📊 [HOOK_STATE] State update:', {
      isConnected,
      finalIsConnected,
      isConnecting,
      finalIsConnecting,
      conversationStatus: conversation.status,
      connectingRef: connectingRef.current
    });
  }, [isConnected, isConnecting, conversation.status]);

  return {
    isConnected: finalIsConnected,
    isConnecting: finalIsConnecting,
    isRecording: finalIsConnected && !micMuted,
    transcript,
    transcriptMessages: transcriptMessagesRef.current, // Exponer mensajes individuales
    duration,
    error,
    connect,
    disconnect,
    micMuted,
    setMicMuted,
    apiKeyReady: !!apiKey,
    audioLevel, // Nivel de audio para indicadores visuales
  };
}
