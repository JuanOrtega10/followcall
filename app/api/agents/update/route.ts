import { NextRequest, NextResponse } from 'next/server';
import { updateElevenLabsAgent } from '@/lib/elevenlabs/client';

export async function PATCH(request: NextRequest) {
  try {
    const { agentId, ...updateData } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID es requerido' },
        { status: 400 }
      );
    }

    const result = await updateElevenLabsAgent(agentId, updateData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al actualizar agente: ${errorMessage}` },
      { status: 500 }
    );
  }
}

