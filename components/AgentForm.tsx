'use client';

import { useState, useEffect } from 'react';
import { Agent, DataSchema } from '@/types/agent';
import PromptGenerator from './PromptGenerator';
import { generateId } from '@/lib/storage';

interface AgentFormProps {
  agent?: Agent;
  onSubmit: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
}

export default function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || 'Asistente de consultorio');
  const [objective, setObjective] = useState(agent?.objective || 'Quiero llamar a mis pacientes para saber como va su tratamiento');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
  // Usar elevenLabsAgentId si existe, sino usar voiceId (para compatibilidad)
  const [voiceId, setVoiceId] = useState(agent?.elevenLabsAgentId || agent?.voiceId || '');
  const [dataSchema, setDataSchema] = useState<DataSchema>(agent?.dataSchema || { fields: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockData, setMockData] = useState<any>(null);

  const handlePromptGenerated = (prompt: string, schema: DataSchema) => {
    setSystemPrompt(prompt);
    setDataSchema(schema);
  };

  const generateMockData = async () => {
    if (!objective.trim()) {
      setError('Primero ingresa un objetivo');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: 'medical', objective }),
      });

      if (!response.ok) throw new Error('Error al generar datos mockeados');
      const data = await response.json();
      setMockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !objective.trim() || !systemPrompt.trim() || !voiceId.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name,
        objective,
        systemPrompt,
        voiceId, // Este campo ahora contiene el Agent ID de ElevenLabs
        language: 'es',
        dataSchema,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el agente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre del Agente
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
          placeholder="Ej: Seguimiento Médico"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Objetivo
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none min-h-[100px]"
          placeholder="Ej: Quiero llamar a mis pacientes para saber cómo va su tratamiento"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Generar System Prompt y Schema
        </label>
        <PromptGenerator objective={objective} onGenerated={handlePromptGenerated} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent ID (ElevenLabs)
        </label>
        <input
          type="text"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
          placeholder="Pega aquí el Agent ID de ElevenLabs"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Crea un agente en <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">ElevenLabs Dashboard</a> y copia el Agent ID aquí
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Guardando...' : agent ? 'Actualizar Agente' : 'Crear Agente'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}
    </form>
  );
}


