import { NextRequest, NextResponse } from 'next/server';
import { parseTranscript } from '@/lib/ai/transcript-parser';
import { DataSchema } from '@/types/agent';

export async function POST(request: NextRequest) {
  console.log('🔵 [API] /api/ai/parse-transcript called');
  
  try {
    const { transcript, dataSchema, systemPrompt } = await request.json();

    console.log('📥 [API] Received request:', {
      transcriptLength: transcript?.length || 0,
      hasDataSchema: !!dataSchema,
      dataSchemaFields: dataSchema?.fields?.length || 0,
      systemPromptLength: systemPrompt?.length || 0,
    });

    if (!transcript || !dataSchema || !systemPrompt) {
      console.error('❌ [API] Missing required fields:', {
        hasTranscript: !!transcript,
        hasDataSchema: !!dataSchema,
        hasSystemPrompt: !!systemPrompt,
      });
      return NextResponse.json(
        { error: 'transcript, dataSchema y systemPrompt son requeridos' },
        { status: 400 }
      );
    }

    console.log('🤖 [API] Starting transcript parsing...');
    const result = await parseTranscript(
      transcript,
      dataSchema as DataSchema,
      systemPrompt
    );

    console.log('✅ [API] Parsing completed successfully');
    console.log('📊 [API] Result structure:', {
      hasRespuestas: !!result.respuestas,
      respuestasCount: result.respuestas?.length || 0,
      hasMetricas: !!result.metricas,
      metricasKeys: result.metricas ? Object.keys(result.metricas) : [],
      hasObservaciones: !!result.observaciones,
      hasAccionesRecomendadas: !!result.accionesRecomendadas,
      accionesCount: result.accionesRecomendadas?.length || 0,
      hasResumen: !!result.resumen,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [API] Error parsing transcript:', error);
    console.error('❌ [API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Error al parsear el transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


