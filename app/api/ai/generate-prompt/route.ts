import { NextRequest, NextResponse } from 'next/server';
import { generatePromptAndSchema } from '@/lib/ai/prompt-generator';

export async function POST(request: NextRequest) {
  try {
    const { objective } = await request.json();

    if (!objective || typeof objective !== 'string') {
      return NextResponse.json(
        { error: 'El objetivo es requerido' },
        { status: 400 }
      );
    }

    const result = await generatePromptAndSchema(objective);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating prompt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al generar el prompt: ${errorMessage}` },
      { status: 500 }
    );
  }
}

