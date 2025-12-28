import { z } from 'zod';

export interface Agent {
  id: string;
  name: string;
  objective: string;
  systemPrompt: string;
  voiceId: string;
  language: string;
  elevenLabsAgentId?: string;
  dataSchema: DataSchema;
  createdAt: string;
  updatedAt: string;
}

export interface DataSchema {
  fields: DataField[];
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
}

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  objective: z.string(),
  systemPrompt: z.string(),
  voiceId: z.string(),
  language: z.string(),
  elevenLabsAgentId: z.string().optional(),
  dataSchema: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'array']),
      description: z.string(),
      required: z.boolean()
    }))
  }),
  createdAt: z.string(),
  updatedAt: z.string()
});

