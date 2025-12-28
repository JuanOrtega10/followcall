import { generateText } from 'ai';
import { getAIProvider } from '@/lib/providers';
import { StructuredCallData } from '@/types/call';
import { DataSchema } from '@/types/agent';

export async function parseTranscript(
  transcript: string,
  dataSchema: DataSchema,
  systemPrompt: string
): Promise<StructuredCallData> {
  console.log('🔵 [PARSER] parseTranscript called');
  console.log('📝 [PARSER] Transcript length:', transcript.length);
  console.log('📋 [PARSER] DataSchema fields:', dataSchema.fields?.length || 0);
  console.log('📋 [PARSER] DataSchema fields:', dataSchema.fields?.map(f => f.name) || []);
  
  // Construir la lista de campos esperados para las métricas
  const metricasFields = dataSchema.fields.map(field => {
    return `- ${field.name} (${field.type}): ${field.description}${field.required ? ' [REQUERIDO]' : ' [OPCIONAL]'}`;
  }).join('\n');

  const prompt = `Analiza este transcript de una llamada y extrae la información estructurada según el schema definido.

System Prompt del agente: ${systemPrompt}

CAMPOS DE MÉTRICAS ESPERADOS (definidos en el schema del agente):
${metricasFields}

Schema de datos completo:
${JSON.stringify(dataSchema, null, 2)}

Transcript completo:
${transcript}

IMPORTANTE: 
- Extrae solo la información que esté presente en el transcript
- En "metricas", SOLO puedes usar los campos definidos arriba: ${dataSchema.fields.map(f => f.name).join(', ')}
- Si algún campo del schema no se menciona en la conversación, NO lo incluyas en "metricas" (NO inventes valores)
- Si la llamada terminó antes de completar todas las preguntas, solo incluye los datos que se obtuvieron
- Las métricas deben reflejar solo lo que se mencionó explícitamente en la conversación
- Usa los nombres exactos de los campos del schema (${dataSchema.fields.map(f => `"${f.name}"`).join(', ')})

Extrae:
1. Respuestas a preguntas clave identificadas en la conversación (solo las que se respondieron)
2. Métricas usando SOLO los campos del schema definido arriba (solo los que se mencionaron en el transcript)
3. Observaciones importantes mencionadas durante la llamada
4. Acciones recomendadas basadas en la conversación
5. Resumen ejecutivo de la llamada

Recuerda: 
- NO inventes información que no esté en el transcript
- NO uses campos en "metricas" que no estén en la lista de campos esperados
- Los nombres de los campos en "metricas" deben coincidir exactamente con los del schema`;

  console.log('🤖 [PARSER] Calling AI model with generateText...');
  
  try {
    const metricasExample = dataSchema.fields.length > 0
      ? `{
    ${dataSchema.fields.slice(0, 2).map(f => `"${f.name}": ${f.type === 'string' ? '"valor"' : f.type === 'number' ? '0' : f.type === 'boolean' ? 'true' : '[]'}`).join(',\n    ')}
    // Solo incluye los campos del schema que encontraste en el transcript
  }`
      : `{
    // Campos del schema: ${dataSchema.fields.map(f => f.name).join(', ')}
  }`;

    const enhancedPrompt = `${prompt}

Responde SOLO con un objeto JSON válido que tenga esta estructura:
{
  "respuestas": [{"pregunta": "...", "respuesta": "...", "categoria": "..."}],
  "metricas": ${metricasExample},
  "observaciones": "...",
  "accionesRecomendadas": ["..."],
  "resumen": "..."
}

CAMPOS PERMITIDOS EN "metricas" (solo estos, no otros):
${dataSchema.fields.map(f => `- "${f.name}" (${f.type})`).join('\n')}

IMPORTANTE: 
- Responde SOLO con JSON válido, sin markdown, sin código, sin explicaciones
- En "metricas", SOLO usa los campos listados arriba (${dataSchema.fields.map(f => f.name).join(', ')})
- Si un campo no se mencionó en el transcript, NO lo incluyas en "metricas"
- Si la llamada terminó antes de completar todas las preguntas, solo incluye los datos obtenidos
- Los nombres de los campos deben coincidir exactamente con los del schema`;

    const { text } = await generateText({
      model: getAIProvider(),
      prompt: enhancedPrompt,
    });

    console.log('✅ [PARSER] AI model returned successfully');
    console.log('📝 [PARSER] Raw response:', text.substring(0, 500));

    // Parsear el JSON manualmente
    let parsed: StructuredCallData;
    try {
      // Limpiar el texto si viene con markdown code blocks
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      parsed = JSON.parse(cleanedText);
      console.log('✅ [PARSER] JSON parsed successfully');
      console.log('📊 [PARSER] Parsed object keys:', Object.keys(parsed));
      console.log('📊 [PARSER] Parsed object:', JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.error('❌ [PARSER] Error parsing JSON:', parseError);
      console.error('❌ [PARSER] Text that failed to parse:', text);
      throw new Error(`Error al parsear la respuesta JSON del AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ [PARSER] Error in generateText:', error);
    console.error('❌ [PARSER] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
    });
    throw error;
  }
}

