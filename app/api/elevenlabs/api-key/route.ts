import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ ELEVENLABS_API_KEY no está configurada en las variables de entorno');
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Devolver la API key para uso en el cliente
    // Nota: Esto expone la API key en el cliente, pero es necesario para WebRTC
    // En producción, considera usar tokens temporales si ElevenLabs lo soporta
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error('❌ Error en /api/elevenlabs/api-key:', error);
    return NextResponse.json(
      { error: 'Error al obtener la API key' },
      { status: 500 }
    );
  }
}

