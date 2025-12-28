const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

function getApiKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no está configurada en las variables de entorno');
  }
  return apiKey;
}

export async function createElevenLabsAgent(params: {
  name: string;
  systemPrompt: string;
  voiceId: string;
  language?: string;
  firstMessage?: string;
}) {
  const response = await fetch(`${ELEVENLABS_API_URL}/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': getApiKey(),
    },
    body: JSON.stringify({
      name: params.name,
      system_prompt: params.systemPrompt,
      voice_id: params.voiceId,
      language: params.language || 'es',
      first_message: params.firstMessage,
      conversation_config: {
        agent_config: {
          prompt: {
            prompt: params.systemPrompt,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error al crear agente en ElevenLabs: ${error}`);
  }

  return response.json();
}

export async function getElevenLabsAgent(agentId: string) {
  const response = await fetch(`${ELEVENLABS_API_URL}/agents/${agentId}`, {
    method: 'GET',
    headers: {
      'xi-api-key': getApiKey(),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error al obtener agente de ElevenLabs: ${error}`);
  }

  return response.json();
}

export async function getVoices() {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    method: 'GET',
    headers: {
      'xi-api-key': getApiKey(),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error al obtener voces de ElevenLabs: ${error}`);
  }

  return response.json();
}

