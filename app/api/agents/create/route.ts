import { NextRequest, NextResponse } from 'next/server';
import { createAgent } from '@/lib/elevenlabs/agent';
import { Agent } from '@/types/agent';

export async function POST(request: NextRequest) {
  try {
    const agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'elevenLabsAgentId'> = await request.json();

    // Validar datos requeridos
    if (!agentData.name || !agentData.systemPrompt || !agentData.voiceId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const agent = await createAgent(agentData);

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al crear agente: ${errorMessage}` },
      { status: 500 }
    );
  }
}

