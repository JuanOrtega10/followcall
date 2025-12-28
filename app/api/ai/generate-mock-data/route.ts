import { NextRequest, NextResponse } from 'next/server';
import { generateMockData } from '@/lib/ai/mock-data';

export async function POST(request: NextRequest) {
  try {
    const { agentType, objective } = await request.json();

    if (!agentType || !objective) {
      return NextResponse.json(
        { error: 'agentType y objective son requeridos' },
        { status: 400 }
      );
    }

    const result = await generateMockData(agentType, objective);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating mock data:', error);
    return NextResponse.json(
      { error: 'Error al generar datos mockeados' },
      { status: 500 }
    );
  }
}

