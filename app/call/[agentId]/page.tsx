'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
    console.log('handleEndCall called', { call: !!call, agent: !!agent });
    
    // Redirigir inmediatamente sin esperar nada
    // El procesamiento del transcript se hará en segundo plano si es necesario
    if (agent) {
      router.push(`/agent/${agent.id}`);
    } else {
      router.push('/');
    }
    
    // Guardar el transcript final y procesarlo en segundo plano (no bloquear)
    if (call && agent) {
      const finalTranscript = call.transcript || '';
      
      // Actualizar el estado de la llamada a completada
      const completedCall: Call = {
        ...call,
        status: 'completed',
        endedAt: new Date().toISOString(),
        transcript: finalTranscript,
      };
      saveCall(completedCall);

      // Si hay transcript, parsearlo en segundo plano (no bloquear la navegación)
      if (finalTranscript.trim()) {
        fetch('/api/ai/parse-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: finalTranscript,
            dataSchema: agent.dataSchema,
            systemPrompt: agent.systemPrompt,
          }),
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Failed to parse transcript');
          })
          .then(structuredData => {
            const updatedCall: Call = {
              ...completedCall,
              structuredData,
            };
            saveCall(updatedCall);
            console.log('Transcript parsed successfully');
          })
          .catch(error => {
            console.error('Error parsing transcript:', error);
          });
      }
    }
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
    if (call) {
      const updatedCall: Call = {
        ...call,
        transcript,
        duration: Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000),
      };
      setCall(updatedCall);
      saveCall(updatedCall);
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

