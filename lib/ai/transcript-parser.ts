import { generateObject } from 'ai';
import { getAIProvider } from '@/lib/providers';
import { z } from 'zod';
import { StructuredCallData } from '@/types/call';
import { DataSchema } from '@/types/agent';

export function createTranscriptSchema(dataSchema: DataSchema) {
  const metricsSchema: Record<string, any> = {};
  
  dataSchema.fields.forEach(field => {
    switch (field.type) {
      case 'string':
        metricsSchema[field.name] = z.string().optional();
        break;
      case 'number':
        metricsSchema[field.name] = z.number().optional();
        break;
      case 'boolean':
        metricsSchema[field.name] = z.boolean().optional();
        break;
      case 'array':
        metricsSchema[field.name] = z.array(z.string()).optional();
        break;
    }
  });

  return z.object({
    respuestas: z.array(z.object({
      pregunta: z.string(),
      respuesta: z.string(),
      categoria: z.string()
    })),
    metricas: z.object(metricsSchema),
    observaciones: z.string(),
    accionesRecomendadas: z.array(z.string()),
    resumen: z.string()
  });
}

export async function parseTranscript(
  transcript: string,
  dataSchema: DataSchema,
  systemPrompt: string
): Promise<StructuredCallData> {
  const schema = createTranscriptSchema(dataSchema);
  
  const { object } = await generateObject({
    model: getAIProvider(),
    schema: schema,
    prompt: `Analiza este transcript de una llamada y extrae la información estructurada según el schema definido.

System Prompt del agente: ${systemPrompt}

Schema de datos esperado:
${JSON.stringify(dataSchema, null, 2)}

Transcript completo:
${transcript}

Extrae:
1. Respuestas a preguntas clave identificadas en la conversación
2. Métricas según el schema de datos definido
3. Observaciones importantes mencionadas durante la llamada
4. Acciones recomendadas basadas en la conversación
5. Resumen ejecutivo de la llamada

Asegúrate de extraer todos los campos definidos en el schema de datos.`,
  });

  return object;
}

