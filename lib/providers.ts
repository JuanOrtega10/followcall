import { createOpenAI } from '@ai-sdk/openai';

export function getAIProvider() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    throw new Error('Debes configurar OPENAI_API_KEY o ANTHROPIC_API_KEY en las variables de entorno');
  }

  // Por ahora usamos OpenAI por defecto
  // Se puede agregar soporte para Anthropic más adelante
  if (OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: OPENAI_API_KEY,
    });
    // Usar gpt-4o que soporta structured outputs con JSON schema
    return openai('gpt-4o');
  }

  // Si no hay OpenAI, usar Anthropic (cuando se implemente)
  throw new Error('OPENAI_API_KEY es requerida');
}

