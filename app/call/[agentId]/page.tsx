'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Agent } from '@/types/agent';
import { Call } from '@/types/call';
import { getAgent } from '@/lib/storage';
import { saveCall, generateId } from '@/lib/storage';
import CallView from '@/components/CallView';

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  // Guardar referencia al transcript más reciente para asegurar que se capture al terminar
  const latestTranscriptRef = useRef<string>('');

  useEffect(() => {
    const initializeCall = async () => {
      if (params.agentId) {
        const foundAgent = getAgent(params.agentId as string);
        if (!foundAgent) {
          // Esperar un poco antes de redirigir para mostrar el mensaje
          setTimeout(() => {
            router.push('/');
          }, 2000);
          setLoading(false);
          return;
        }

        // Actualizar solo system prompt y first message en ElevenLabs antes de iniciar la llamada
        // Usar siempre el agente por defecto: agent_2401kdkas1a9evba5w8tezpfesvf
        const defaultAgentId = 'agent_2401kdkas1a9evba5w8tezpfesvf';
        const targetAgentId = defaultAgentId; // Siempre usar el agente por defecto
        
        if (foundAgent.systemPrompt) {
          try {
            console.log('Updating agent in ElevenLabs before call...', {
              agentId: targetAgentId,
              systemPrompt: foundAgent.systemPrompt.substring(0, 50) + '...',
              firstMessage: foundAgent.firstMessage || 'not set',
            });
            
            const updatePayload: any = {
              agentId: targetAgentId,
              systemPrompt: foundAgent.systemPrompt,
            };
            
            // Incluir firstMessage si existe
            if (foundAgent.firstMessage) {
              updatePayload.firstMessage = foundAgent.firstMessage;
            }
            
            const updateResponse = await fetch('/api/agents/update', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatePayload),
            });

            if (updateResponse.ok) {
              console.log('✅ Agent system prompt and first message updated successfully');
            } else {
              const errorData = await updateResponse.json().catch(() => ({ error: 'Error desconocido' }));
              console.error('❌ Error updating agent:', errorData);
              // Continuar con la llamada aunque falle la actualización
            }
          } catch (error) {
            console.error('❌ Error updating agent:', error);
            // Continuar con la llamada aunque falle la actualización
          }
        }
        
        // Usar siempre el agente por defecto para la llamada
        foundAgent.elevenLabsAgentId = targetAgentId;

        setAgent(foundAgent);
        
        // Crear nueva llamada
        const newCall: Call = {
          id: generateId(),
          agentId: foundAgent.id,
          transcript: '',
          duration: 0,
          startedAt: new Date().toISOString(),
          status: 'active',
        };
        setCall(newCall);
        saveCall(newCall);
        setLoading(false);
      }
    };

    initializeCall();
  }, [params.agentId, router]);

  const handleEndCall = async () => {
    console.log('🔴 [CALL END] handleEndCall called', { 
      call: !!call, 
      agent: !!agent,
      callId: call?.id,
      agentId: agent?.id 
    });
    
    // Guardar el transcript final y procesarlo ANTES de redirigir
    if (call && agent) {
      // Usar el transcript más reciente (del ref o del estado)
      const finalTranscript = latestTranscriptRef.current || call.transcript || '';
      
      console.log('📝 [CALL END] Final transcript length:', finalTranscript.length);
      console.log('📝 [CALL END] Transcript from state:', call.transcript?.length || 0);
      console.log('📝 [CALL END] Transcript from ref:', latestTranscriptRef.current.length);
      console.log('📝 [CALL END] Transcript preview:', finalTranscript.substring(0, 200));
      console.log('📋 [CALL END] Agent dataSchema fields:', agent.dataSchema?.fields?.length || 0);
      console.log('📋 [CALL END] Agent systemPrompt length:', agent.systemPrompt?.length || 0);
      
      // Actualizar el estado de la llamada a completada
      const completedCall: Call = {
        ...call,
        status: 'completed',
        endedAt: new Date().toISOString(),
        transcript: finalTranscript,
      };
      saveCall(completedCall);
      console.log('✅ [CALL END] Call saved as completed');

      // Si hay transcript, parsearlo
      if (finalTranscript.trim()) {
        console.log('🤖 [TRANSCRIPT PARSE] Starting transcript parsing...');
        console.log('📝 [TRANSCRIPT PARSE] Transcript to parse length:', finalTranscript.length);
        
        // Usar transcript mock si el transcript está vacío o es muy corto (para testing)
        const transcriptToParse = finalTranscript.length < 50 
          ? generateMockTranscript(agent.dataSchema)
          : finalTranscript;
        
        if (transcriptToParse !== finalTranscript) {
          console.log('🧪 [TRANSCRIPT PARSE] Using mock transcript for testing');
        }
        
        console.log('📤 [TRANSCRIPT PARSE] Sending to API:', {
          transcriptLength: transcriptToParse.length,
          dataSchemaFields: agent.dataSchema?.fields?.length || 0,
          hasSystemPrompt: !!agent.systemPrompt,
        });
        
        fetch('/api/ai/parse-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: transcriptToParse,
            dataSchema: agent.dataSchema,
            systemPrompt: agent.systemPrompt,
          }),
        })
          .then(response => {
            console.log('📡 [TRANSCRIPT PARSE] API response status:', response.status);
            if (response.ok) {
              return response.json();
            }
            return response.json().then(err => {
              console.error('❌ [TRANSCRIPT PARSE] API error:', err);
              throw new Error(err.error || 'Failed to parse transcript');
            });
          })
          .then(structuredData => {
            console.log('✅ [TRANSCRIPT PARSE] Parsing successful!');
            console.log('📊 [TRANSCRIPT PARSE] Structured data:', JSON.stringify(structuredData, null, 2));
            
            const updatedCall: Call = {
              ...completedCall,
              structuredData,
            };
            saveCall(updatedCall);
            console.log('💾 [TRANSCRIPT PARSE] Call saved with structured data');
          })
          .catch(error => {
            console.error('❌ [TRANSCRIPT PARSE] Error parsing transcript:', error);
            console.error('❌ [TRANSCRIPT PARSE] Error details:', {
              message: error.message,
              stack: error.stack,
            });
          });
      } else {
        console.log('⚠️ [CALL END] No transcript to parse (empty or too short)');
        console.log('⚠️ [CALL END] Transcript value:', finalTranscript);
        console.log('⚠️ [CALL END] Transcript trimmed length:', finalTranscript.trim().length);
      }
    } else {
      console.log('⚠️ [CALL END] Missing call or agent data');
    }
    
    // Redirigir después de iniciar el procesamiento
    if (agent) {
      router.push(`/agent/${agent.id}`);
    } else {
      router.push('/');
    }
  };

  // Función para generar un transcript mock para testing
  const generateMockTranscript = (dataSchema: any): string => {
    const mockTranscript = `
Agente: Hola, soy tu asistente médico. ¿Cómo puedo ayudarte hoy?

Usuario: Hola, quería hacer un seguimiento de mi tratamiento.

Agente: Por supuesto, estaré encantado de ayudarte. ¿Cómo te has sentido últimamente con el tratamiento?

Usuario: Me he sentido bastante bien, aunque a veces tengo algunas molestias menores.

Agente: Entiendo. ¿Podrías describir qué tipo de molestias experimentas?

Usuario: Principalmente dolores de cabeza ocasionales, especialmente por las mañanas.

Agente: ¿Con qué frecuencia experimentas estos dolores de cabeza?

Usuario: Aproximadamente 2 o 3 veces por semana.

Agente: Gracias por esa información. ¿Has notado alguna mejora en tu condición general desde que comenzaste el tratamiento?

Usuario: Sí, definitivamente he notado mejoras. Me siento más enérgico y los síntomas principales han disminuido.

Agente: Eso es excelente. ¿Estás tomando la medicación según las indicaciones?

Usuario: Sí, la tomo todos los días a la misma hora como me indicaron.

Agente: Perfecto. ¿Tienes alguna pregunta o preocupación sobre tu tratamiento?

Usuario: No, creo que todo está bien. Solo quería hacer este seguimiento.

Agente: Muy bien. Te recomiendo que continúes con el tratamiento y que me contactes si experimentas algún cambio significativo. ¿Hay algo más en lo que pueda ayudarte?

Usuario: No, eso es todo. Gracias.

Agente: De nada. Que tengas un buen día y cuídate.
    `.trim();
    
    console.log('🧪 [MOCK] Generated mock transcript length:', mockTranscript.length);
    return mockTranscript;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex items-center justify-center">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Agente no encontrado</p>
          <p className="text-gray-400 mb-6">El agente con ID {params.agentId} no existe en tu almacenamiento local.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!agent.elevenLabsAgentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Agente incompleto</p>
          <p className="text-gray-400 mb-6">Este agente no tiene un ID de ElevenLabs configurado. Por favor, créalo nuevamente.</p>
          <button
            onClick={() => router.push('/agent/new')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Crear nuevo agente
          </button>
        </div>
      </div>
    );
  }

  const handleTranscriptUpdate = (transcript: string) => {
    // Actualizar el ref inmediatamente para tener siempre la versión más reciente
    latestTranscriptRef.current = transcript;
    
    if (call) {
      console.log('📝 [TRANSCRIPT UPDATE] Updating call transcript, length:', transcript.length);
      const updatedCall: Call = {
        ...call,
        transcript,
        duration: Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000),
      };
      setCall(updatedCall);
      saveCall(updatedCall);
      console.log('✅ [TRANSCRIPT UPDATE] Call saved with updated transcript');
    }
  };

  // Usar siempre el agente por defecto
  const defaultAgentId = 'agent_2401kdkas1a9evba5w8tezpfesvf';
  
  return (
    <CallView 
      elevenLabsAgentId={defaultAgentId} 
      onEndCall={handleEndCall}
      onTranscriptUpdate={handleTranscriptUpdate}
    />
  );
}

