import { z } from 'zod';

export interface Call {
  id: string;
  agentId: string;
  transcript: string;
  structuredData?: StructuredCallData;
  duration: number;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'ended';
}

export interface StructuredCallData {
  respuestas: Array<{
    pregunta: string;
    respuesta: string;
    categoria: string;
  }>;
  metricas: Record<string, any>;
  observaciones: string;
  accionesRecomendadas: string[];
  resumen: string;
}

export interface MockData {
  nombrePaciente: string;
  tipoProcedimiento: string;
  fechaProcedimiento: string;
  medicamentos: Array<{
    nombre: string;
    dosis: string;
    frecuencia: string;
  }>;
  informacionContextual: string;
}

