import { NextRequest, NextResponse } from 'next/server';
import { parseTranscript } from '@/lib/ai/transcript-parser';
import { DataSchema } from '@/types/agent';

export async function POST(request: NextRequest) {
  try {
    const { transcript, dataSchema, systemPrompt } = await request.json();

    if (!transcript || !dataSchema || !systemPrompt) {
      return NextResponse.json(
        { error: 'transcript, dataSchema y systemPrompt son requeridos' },
        { status: 400 }
      );
    }

    const result = await parseTranscript(
      transcript,
      dataSchema as DataSchema,
      systemPrompt
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error parsing transcript:', error);
    return NextResponse.json(
      { error: 'Error al parsear el transcript' },
      { status: 500 }
    );
  }
}


