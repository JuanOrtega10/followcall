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
  console.log('🤖 [PROMPT GEN] Generating prompt for objective:', objective);
  
  const { object } = await generateObject({
    model: getAIProvider(),
    schema: promptSchema,
    prompt: `Crea un system prompt SIMPLE y CORTO para un agente de voz basado en:

"${objective}"

REGLAS:
- Máximo 4-5 oraciones
- Lenguaje natural y conversacional
- En español
- Sin formato complejo, solo texto simple
- DEBE mencionar qué información debe recolectar durante la conversación

También crea 3-4 campos de datos que el agente debe recolectar. Cada campo:
- Nombre en camelCase (ej: nombrePaciente, frecuenciaSintomas)
- Tipo: string, number, boolean, o array
- Descripción corta (1 línea)

El system prompt debe incluir naturalmente qué datos debe recolectar. Por ejemplo:
"Llama a tus pacientes para preguntar cómo va su tratamiento. Asegúrate de obtener su nombre, si han notado mejoras, la frecuencia de síntomas y cualquier comentario adicional."

Ejemplo de campos:
- nombrePaciente (string): Nombre del paciente
- mejoraNotada (boolean): Si notó mejoras
- frecuenciaSintomas (number): Veces por semana con síntomas

Mantén TODO simple y directo. El system prompt debe mencionar los datos a recolectar de forma natural.`,
  });

  console.log('✅ [PROMPT GEN] Prompt generated successfully');
  console.log('📝 [PROMPT GEN] System prompt length:', object.systemPrompt.length);
  console.log('📝 [PROMPT GEN] System prompt preview:', object.systemPrompt.substring(0, 200) + '...');
  console.log('📋 [PROMPT GEN] Data schema fields:', object.dataSchema.fields.length);

  // Mejorar el system prompt para incluir explícitamente los campos a recolectar de forma natural
  const fieldsDescriptions = object.dataSchema.fields.map(f => {
    // Convertir la descripción a lenguaje natural
    return f.description.toLowerCase().replace(/\.$/, '');
  });

  // Crear una lista natural de los datos a recolectar
  let dataToCollect = '';
  if (fieldsDescriptions.length > 0) {
    if (fieldsDescriptions.length === 1) {
      dataToCollect = fieldsDescriptions[0];
    } else if (fieldsDescriptions.length === 2) {
      dataToCollect = `${fieldsDescriptions[0]} y ${fieldsDescriptions[1]}`;
    } else {
      const lastField = fieldsDescriptions.pop();
      dataToCollect = `${fieldsDescriptions.join(', ')}, y ${lastField}`;
    }
  }

  // Verificar si el system prompt ya menciona los datos, si no, agregarlos
  const promptLower = object.systemPrompt.toLowerCase();
  const needsDataMention = !fieldsDescriptions.some(desc => promptLower.includes(desc.split(' ')[0]));

  let enhancedSystemPrompt = object.systemPrompt;
  if (needsDataMention && dataToCollect) {
    // Agregar de forma natural al final
    enhancedSystemPrompt = `${object.systemPrompt} Asegúrate de obtener información sobre: ${dataToCollect}.`;
  }

  console.log('📝 [PROMPT GEN] Enhanced system prompt with data fields');
  console.log('📝 [PROMPT GEN] Data to collect:', dataToCollect);

  return {
    ...object,
    systemPrompt: enhancedSystemPrompt
  };
}

