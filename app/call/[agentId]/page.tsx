'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Agent } from '@/types/agent';
import { Call } from '@/types/call';
import { getAgent } from '@/lib/storage';
import { saveCall, generateId } from '@/lib/storage';
import CallView from '@/components/CallView';
import { Loader2, AlertCircle, ArrowLeft, Phone, Settings } from 'lucide-react';

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const latestTranscriptRef = useRef<string>('');

  useEffect(() => {
    const initializeCall = async () => {
      if (params.agentId) {
        const foundAgent = getAgent(params.agentId as string);
        if (!foundAgent) {
          setTimeout(() => {
            router.push('/');
          }, 2000);
          setLoading(false);
          return;
        }

        const defaultAgentId = 'agent_2401kdkas1a9evba5w8tezpfesvf';
        const targetAgentId = defaultAgentId;
        
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
            }
          } catch (error) {
            console.error('❌ Error updating agent:', error);
          }
        }
        
        foundAgent.elevenLabsAgentId = targetAgentId;

        setAgent(foundAgent);
        
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

  const callRef = useRef<Call | null>(null);
  
  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const handleTranscriptUpdate = useCallback((transcript: string) => {
    latestTranscriptRef.current = transcript;
    
    const currentCall = callRef.current;
    if (currentCall) {
      console.log('📝 [TRANSCRIPT UPDATE] Updating call transcript, length:', transcript.length);
      const updatedCall: Call = {
        ...currentCall,
        transcript,
        duration: Math.floor((Date.now() - new Date(currentCall.startedAt).getTime()) / 1000),
      };
      setCall(updatedCall);
      saveCall(updatedCall);
      console.log('✅ [TRANSCRIPT UPDATE] Call saved with updated transcript');
    }
  }, []);

  const handleEndCall = async () => {
    console.log('🔴 [CALL END] handleEndCall called', { 
      call: !!call, 
      agent: !!agent,
      callId: call?.id,
      agentId: agent?.id 
    });
    
    if (call && agent) {
      const finalTranscript = latestTranscriptRef.current || call.transcript || '';
      
      console.log('📝 [CALL END] Final transcript length:', finalTranscript.length);
      console.log('📝 [CALL END] Transcript from state:', call.transcript?.length || 0);
      console.log('📝 [CALL END] Transcript from ref:', latestTranscriptRef.current.length);
      console.log('📝 [CALL END] Transcript preview:', finalTranscript.substring(0, 200));
      console.log('📋 [CALL END] Agent dataSchema fields:', agent.dataSchema?.fields?.length || 0);
      console.log('📋 [CALL END] Agent systemPrompt length:', agent.systemPrompt?.length || 0);
      
      const completedCall: Call = {
        ...call,
        status: 'completed',
        endedAt: new Date().toISOString(),
        transcript: finalTranscript,
      };
      saveCall(completedCall);
      console.log('✅ [CALL END] Call saved as completed');

      if (finalTranscript.trim()) {
        console.log('🤖 [TRANSCRIPT PARSE] Starting transcript parsing...');
        console.log('📝 [TRANSCRIPT PARSE] Transcript to parse length:', finalTranscript.length);
        
        if (!agent.dataSchema || !agent.dataSchema.fields || agent.dataSchema.fields.length === 0) {
          console.error('❌ [TRANSCRIPT PARSE] Agent dataSchema is missing or empty');
          alert('Error: El agente no tiene un schema de datos configurado. Por favor, configura el agente primero.');
          if (agent) {
            router.push(`/agent/${agent.id}`);
          } else {
            router.push('/');
          }
          return;
        }

        if (!agent.systemPrompt) {
          console.error('❌ [TRANSCRIPT PARSE] Agent systemPrompt is missing');
          alert('Error: El agente no tiene un system prompt configurado. Por favor, configura el agente primero.');
          if (agent) {
            router.push(`/agent/${agent.id}`);
          } else {
            router.push('/');
          }
          return;
        }

        const cleanedTranscript = finalTranscript
          .trim()
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+|\s+$/gm, '');

        if (cleanedTranscript.length < 20) {
          console.warn('⚠️ [TRANSCRIPT PARSE] Transcript too short, skipping parse');
          alert('El transcript es muy corto. Redirigiendo al agente.');
          if (agent) {
            router.push(`/agent/${agent.id}`);
          } else {
            router.push('/');
          }
          return;
        }

        console.log('🚀 [TRANSCRIPT PARSE] Starting parse request to LLM...');
        console.log('📋 [TRANSCRIPT PARSE] Request payload:', {
          transcriptLength: cleanedTranscript.length,
          dataSchemaFields: agent.dataSchema.fields.length,
          systemPromptLength: agent.systemPrompt.length,
        });

        const loadingTimeout = setTimeout(() => {
          console.log('⏳ [TRANSCRIPT PARSE] Parse taking longer than expected...');
        }, 5000);

        fetch('/api/ai/parse-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: cleanedTranscript,
            dataSchema: agent.dataSchema,
            systemPrompt: agent.systemPrompt,
          }),
        })
          .then(async response => {
            clearTimeout(loadingTimeout);
            console.log('📡 [TRANSCRIPT PARSE] API response status:', response.status);
            
            let responseData;
            try {
              responseData = await response.json();
            } catch (parseError) {
              console.error('❌ [TRANSCRIPT PARSE] Failed to parse JSON response:', parseError);
              throw new Error('Respuesta inválida del servidor');
            }
            
            if (!response.ok) {
              console.error('❌ [TRANSCRIPT PARSE] API error response:', responseData);
              const errorMessage = responseData?.error || responseData?.details || `Error del servidor (${response.status})`;
              throw new Error(errorMessage);
            }
            
            if (!responseData || typeof responseData !== 'object') {
              throw new Error('Formato de respuesta inválido');
            }
            
            const hasValidStructure = 
              (responseData.respuestas && Array.isArray(responseData.respuestas)) ||
              (responseData.metricas && typeof responseData.metricas === 'object') ||
              (responseData.resumen && typeof responseData.resumen === 'string');
            
            if (!hasValidStructure) {
              console.warn('⚠️ [TRANSCRIPT PARSE] Response structure may be incomplete:', responseData);
            }
            
            return responseData;
          })
          .then(structuredData => {
            console.log('✅ [TRANSCRIPT PARSE] Parsing successful!');
            console.log('📊 [TRANSCRIPT PARSE] Structured data received:', {
              hasRespuestas: !!structuredData.respuestas,
              respuestasCount: structuredData.respuestas?.length || 0,
              hasMetricas: !!structuredData.metricas,
              metricasKeys: structuredData.metricas ? Object.keys(structuredData.metricas) : [],
              hasObservaciones: !!structuredData.observaciones,
              hasAccionesRecomendadas: !!structuredData.accionesRecomendadas,
              accionesCount: structuredData.accionesRecomendadas?.length || 0,
              hasResumen: !!structuredData.resumen,
            });
            console.log('📊 [TRANSCRIPT PARSE] Full structured data:', JSON.stringify(structuredData, null, 2));
            
            if (!structuredData.respuestas && !structuredData.metricas && !structuredData.resumen) {
              console.warn('⚠️ [TRANSCRIPT PARSE] Structured data seems incomplete, but proceeding...');
            }
            
            const updatedCall: Call = {
              ...completedCall,
              structuredData,
            };
            saveCall(updatedCall);
            console.log('💾 [TRANSCRIPT PARSE] Call saved with structured data, callId:', updatedCall.id);
            
            console.log('🔄 [TRANSCRIPT PARSE] Redirecting to results page:', `/call/${agent.id}/results?callId=${updatedCall.id}`);
            router.push(`/call/${agent.id}/results?callId=${updatedCall.id}`);
          })
          .catch(error => {
            clearTimeout(loadingTimeout);
            console.error('❌ [TRANSCRIPT PARSE] Error parsing transcript:', error);
            console.error('❌ [TRANSCRIPT PARSE] Error details:', {
              message: error.message,
              stack: error.stack,
              transcriptLength: cleanedTranscript.length,
            });
            
            saveCall(completedCall);
            console.log('💾 [TRANSCRIPT PARSE] Call saved (parse failed, but transcript preserved)');
            
            const errorMessage = error.message || 'Error desconocido al procesar el transcript';
            alert(`Error al procesar el transcript: ${errorMessage}\n\nEl transcript se ha guardado pero no se pudo estructurar. Serás redirigido al agente.`);
            
            if (agent) {
              router.push(`/agent/${agent.id}`);
            } else {
              router.push('/');
            }
          });
      } else {
        console.log('⚠️ [CALL END] No transcript to parse (empty or too short)');
        console.log('⚠️ [CALL END] Transcript value:', finalTranscript);
        console.log('⚠️ [CALL END] Transcript trimmed length:', finalTranscript.trim().length);
        if (agent) {
          router.push(`/agent/${agent.id}`);
        } else {
          router.push('/');
        }
      }
    } else {
      console.log('⚠️ [CALL END] Missing call or agent data');
      router.push('/');
    }
  };

  const generateMockTranscript = (dataSchema: any): string => {
    const mockTranscript = `
Agente: Hola, buenos días. Estoy llamando para hacer un seguimiento. ¿Me podrías decir tu nombre completo, por favor?

Usuario: Sí, claro. Me llamo María González.

Agente: Muchas gracias, María. Es un placer hablar contigo. Te estoy llamando para saber cómo va todo. ¿Cómo te sientes con el servicio que recibiste?

Usuario: Muy bien, la verdad. Estoy bastante satisfecha con la atención que recibí. Todo ha funcionado como esperaba.

Agente: Eso es excelente escucharlo, María. Me alegra saber que estás satisfecha. Para tener un mejor seguimiento, ¿podrías calificar tu nivel de satisfacción del 1 al 10?

Usuario: Pues, déjame pensar... diría que un 8 o 9. Estoy muy contenta con cómo han ido las cosas.

Agente: Perfecto, eso es muy bueno. ¿Hay algo más que quieras comentarme sobre tu experiencia? Cualquier feedback es importante para nosotros.

Usuario: Bueno, la verdad es que todo está yendo bien. Tal vez podría mejorar un poco el tiempo de respuesta, pero en general estoy muy contenta.

Agente: Entiendo, María. Tomaremos en cuenta tu comentario sobre el tiempo de respuesta. ¿Tienes alguna pregunta o preocupación adicional?

Usuario: No, realmente no. Solo quería confirmar que todo está bien y que puedo seguir con el servicio.

Agente: Perfecto, María. Sí, puedes continuar sin problemas. Si tienes alguna duda o necesitas algo más, no dudes en contactarnos. ¿Hay algo más en lo que pueda ayudarte?

Usuario: No, eso es todo. Muchas gracias por llamar.

Agente: De nada, María. Fue un placer hablar contigo. Que tengas un excelente día.

Usuario: Igualmente, gracias. Adiós.

Agente: Adiós, María. Que tengas un buen día.
    `.trim();
    
    console.log('🧪 [MOCK] Generated mock transcript length:', mockTranscript.length);
    return mockTranscript;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] flex items-center justify-center">
        {/* Efectos de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#5EEAD4]/30 blur-xl rounded-full animate-pulse"></div>
            <Loader2 className="w-10 h-10 text-[#5EEAD4] animate-spin relative" />
          </div>
          <p className="text-[#A7F3D0]/70 text-sm tracking-wider">Preparando llamada...</p>
        </div>
      </div>
    );
  }

  // Agent Not Found
  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] flex items-center justify-center p-6">
        {/* Efectos de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center bg-[#0D3D2E]/60 backdrop-blur-sm p-10 rounded-2xl border border-[#5EEAD4]/20 max-w-md">
          <div className="inline-block p-4 bg-red-500/10 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-white text-xl font-semibold mb-2">Agente no encontrado</p>
          <p className="text-[#A7F3D0]/60 mb-6 text-sm">
            El agente con ID <span className="font-mono text-[#5EEAD4]">{params.agentId}</span> no existe en tu almacenamiento local.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(94,234,212,0.4)] hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Agent Without ElevenLabs ID
  if (!agent.elevenLabsAgentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F4C3A] via-[#134E4A] to-[#0D3D2E] flex items-center justify-center p-6">
        {/* Efectos de fondo */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5EEAD4]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A7F3D0]/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center bg-[#0D3D2E]/60 backdrop-blur-sm p-10 rounded-2xl border border-[#5EEAD4]/20 max-w-md">
          <div className="inline-block p-4 bg-amber-500/10 rounded-full mb-6">
            <Settings className="w-10 h-10 text-amber-400" />
          </div>
          <p className="text-white text-xl font-semibold mb-2">Agente incompleto</p>
          <p className="text-[#A7F3D0]/60 mb-6 text-sm">
            Este agente no tiene un ID de ElevenLabs configurado. Por favor, créalo nuevamente.
          </p>
          <button
            onClick={() => router.push('/agent/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(94,234,212,0.4)] hover:scale-105"
          >
            <Phone className="w-4 h-4" />
            Crear nuevo agente
          </button>
        </div>
      </div>
    );
  }

  const defaultAgentId = 'agent_2401kdkas1a9evba5w8tezpfesvf';
  
  return (
    <CallView 
      elevenLabsAgentId={defaultAgentId} 
      onEndCall={handleEndCall}
      onTranscriptUpdate={handleTranscriptUpdate}
    />
  );
}