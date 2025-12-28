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
  // Intentar con el endpoint de convai/agents primero
  let response = await fetch(`${ELEVENLABS_API_URL}/convai/agents`, {
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
    }),
  });

  // Si falla, intentar con el endpoint alternativo
  if (!response.ok && response.status === 404) {
    response = await fetch(`${ELEVENLABS_API_URL}/convai/agent`, {
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
      }),
    });
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error al crear agente en ElevenLabs (${response.status}): ${error}`);
  }

  return response.json();
}

export async function getElevenLabsAgent(agentId: string) {
  // Intentar primero con el endpoint de convai/agents
  let response = await fetch(`${ELEVENLABS_API_URL}/convai/agents/${agentId}`, {
    method: 'GET',
    headers: {
      'xi-api-key': getApiKey(),
    },
  });

  // Si falla, intentar con el endpoint alternativo
  if (!response.ok && response.status === 404) {
    response = await fetch(`${ELEVENLABS_API_URL}/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': getApiKey(),
      },
    });
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error al obtener agente de ElevenLabs: ${error}`);
  }

  return response.json();
}

export async function updateElevenLabsAgent(agentId: string, params: {
  systemPrompt?: string;
  name?: string;
  voiceId?: string;
  language?: string;
  firstMessage?: string;
}) {
  // Primero obtener la configuración actual del agente para hacer merge
  let currentAgent;
  try {
    currentAgent = await getElevenLabsAgent(agentId);
  } catch (error) {
    console.warn('Could not fetch current agent config, proceeding with partial update:', error);
  }
  
  // Construir el body con la estructura que espera ElevenLabs
  const body: Record<string, any> = {};
  
  if (params.name !== undefined) {
    body.name = params.name;
  } else if (currentAgent?.name) {
    body.name = currentAgent.name;
  }
  
  // Construir conversation_config solo si hay cambios en system prompt o first message
  // NO tocamos language ni LLM - el usuario lo configurará manualmente
  if (params.systemPrompt !== undefined || params.firstMessage !== undefined) {
    // Obtener la configuración actual del agente si existe
    const currentConfig = currentAgent?.conversation_config || {};
    const currentAgentConfig = currentConfig.agent || {};
    const currentPrompt = currentAgentConfig.prompt || {};
    
    body.conversation_config = {
      ...currentConfig,
      agent: {
        ...currentAgentConfig,
      }
    };
    
    // Actualizar solo el system prompt, manteniendo todo lo demás (incluyendo LLM)
    if (params.systemPrompt !== undefined) {
      body.conversation_config.agent.prompt = {
        ...currentPrompt, // Mantener LLM y otros campos del prompt actual
        prompt: params.systemPrompt // Solo actualizar el prompt
      };
    }
    
    // Actualizar solo el first message
    if (params.firstMessage !== undefined) {
      body.conversation_config.agent.first_message = params.firstMessage;
    }
  }
  
  if (params.voiceId !== undefined) {
    body.voice_id = params.voiceId;
  }

  console.log('Updating ElevenLabs agent with:', { agentId, updates: { systemPrompt: params.systemPrompt ? 'updated' : 'unchanged', firstMessage: params.firstMessage ? 'updated' : 'unchanged' } });

  // Intentar con el endpoint de convai/agents/{agentId} usando PATCH
  let response = await fetch(`${ELEVENLABS_API_URL}/convai/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': getApiKey(),
    },
    body: JSON.stringify(body),
  });

  // Si falla con PATCH, intentar con PUT
  if (!response.ok && response.status === 404) {
    console.log('PATCH failed, trying PUT...');
    response = await fetch(`${ELEVENLABS_API_URL}/convai/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': getApiKey(),
      },
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error updating agent:', { status: response.status, error: errorText });
    throw new Error(`Error al actualizar agente en ElevenLabs (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log('Agent updated successfully');
  return result;
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

