import { generateObject } from 'ai';
import { getAIProvider } from '@/lib/providers';
import { z } from 'zod';

const promptSchema = z.object({
  systemPrompt: z.string().describe('System prompt completo para ElevenLabs con formato estructurado'),
  dataSchema: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'array']),
      description: z.string(),
      required: z.boolean()
    }))
  }).describe('Schema de datos que define qué información debe extraerse de la conversación')
});

export interface PromptGenerationResult {
  systemPrompt: string;
  dataSchema: {
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array';
      description: string;
      required: boolean;
    }>;
  };
}

export async function generatePromptAndSchema(objective: string): Promise<PromptGenerationResult> {
  const { object } = await generateObject({
    model: getAIProvider(),
    schema: promptSchema,
    prompt: `Convierte este objetivo en un system prompt para un agente de ElevenLabs y define qué datos debe recolectar.

Objetivo: ${objective}

Genera:
1. Un system prompt estructurado con secciones claras:
   - Personalidad: Describe cómo debe comportarse el agente
   - Objetivo: Qué debe lograr en la conversación
   - Instrucciones: Pasos específicos a seguir
   - Guardrails: Límites y restricciones

2. Un schema de datos que defina qué información debe extraerse de la conversación. 
   Basa los campos en el objetivo proporcionado. Por ejemplo, si es seguimiento médico, 
   incluye campos como adherencia_medicamentos, sintomas, satisfaccion, etc.

El system prompt debe ser en español y seguir las mejores prácticas de ElevenLabs para agentes conversacionales.`,
  });

  return object;
}

