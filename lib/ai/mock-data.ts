import { generateObject } from 'ai';
import { getAIProvider } from '@/lib/providers';
import { z } from 'zod';
import { MockData } from '@/types/call';

const mockDataSchema = z.object({
  nombrePaciente: z.string(),
  tipoProcedimiento: z.string(),
  fechaProcedimiento: z.string(),
  medicamentos: z.array(z.object({
    nombre: z.string(),
    dosis: z.string(),
    frecuencia: z.string()
  })),
  informacionContextual: z.string()
});

export async function generateMockData(agentType: string, objective: string): Promise<MockData> {
  const { object } = await generateObject({
    model: getAIProvider(),
    schema: mockDataSchema,
    prompt: `Genera datos de ejemplo realistas para un agente de tipo: ${agentType}

Objetivo del agente: ${objective}

Genera datos mockeados incluyendo:
- Nombre del paciente (nombre y apellido en español)
- Tipo de procedimiento o tratamiento
- Fecha del procedimiento (formato: YYYY-MM-DD)
- Medicamentos prescritos (array con nombre, dosis y frecuencia)
- Información contextual relevante para personalizar la conversación

Los datos deben ser realistas y apropiados para el contexto del agente.`,
  });

  return object;
}

