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
    if (params.agentId) {
      const foundAgent = getAgent(params.agentId as string);
      if (!foundAgent) {
        router.push('/');
        return;
      }
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
  }, [params.agentId, router]);

  const handleEndCall = async () => {
    if (!call || !agent) return;

    // Si hay transcript, parsearlo
    if (call.transcript) {
      try {
        const response = await fetch('/api/ai/parse-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: call.transcript,
            dataSchema: agent.dataSchema,
            systemPrompt: agent.systemPrompt,
          }),
        });

        if (response.ok) {
          const structuredData = await response.json();
          const completedCall: Call = {
            ...call,
            structuredData,
            status: 'completed',
            endedAt: new Date().toISOString(),
          };
          saveCall(completedCall);
        }
      } catch (error) {
        console.error('Error parsing transcript:', error);
      }
    }

    router.push(`/agent/${agent.id}`);
  };

  if (loading || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex items-center justify-center">
        <p className="text-white">Cargando...</p>
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

  return (
    <CallView 
      elevenLabsAgentId={agent.elevenLabsAgentId} 
      onEndCall={handleEndCall}
      onTranscriptUpdate={handleTranscriptUpdate}
    />
  );
}

