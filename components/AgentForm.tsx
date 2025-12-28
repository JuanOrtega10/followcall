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
  const [name, setName] = useState(agent?.name || 'Agente de Seguimiento');
  const [objective, setObjective] = useState(agent?.objective || 'Quiero realizar llamadas de seguimiento para recopilar información');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
  const [firstMessage, setFirstMessage] = useState(agent?.firstMessage || '');
  // Usar elevenLabsAgentId si existe, sino usar voiceId (para compatibilidad)
  const [voiceId, setVoiceId] = useState(agent?.elevenLabsAgentId || agent?.voiceId || '');
  const [dataSchema, setDataSchema] = useState<DataSchema>(agent?.dataSchema || { fields: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockData, setMockData] = useState<any>(null);

  useEffect(() => {
    if (agent) {
      setName(agent.name || '');
      setObjective(agent.objective || '');
      setSystemPrompt(agent.systemPrompt || '');
      setFirstMessage(agent.firstMessage || '');
      setVoiceId(agent.elevenLabsAgentId || agent.voiceId || '');
      setDataSchema(agent.dataSchema || { fields: [] });
    }
  }, [agent]);

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
        body: JSON.stringify({ agentType: 'general', objective }),
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
        firstMessage,
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Agente
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="Ej: Agente de Seguimiento"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Objetivo
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[100px]"
          placeholder="Ej: Quiero realizar llamadas de seguimiento para recopilar información sobre el estado de los clientes"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[150px] font-mono text-sm"
          placeholder="El prompt del sistema para el agente..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primer Mensaje (First Message)
        </label>
        <textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[80px]"
          placeholder="El primer mensaje que dirá el agente..."
        />
      </div>

      {dataSchema && dataSchema.fields && dataSchema.fields.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Datos a Recolectar:
          </label>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ul className="space-y-2">
              {dataSchema.fields.map((field, index) => (
                <li key={index} className="text-sm text-gray-700">
                  <span className="font-medium text-blue-600">{field.name}</span>
                  {' '}({field.type})
                  {field.required && <span className="text-red-500 ml-2">*</span>}
                  {' - '}
                  <span className="text-gray-600">{field.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agent ID (ElevenLabs)
        </label>
        <input
          type="text"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm"
          placeholder="Pega aquí el Agent ID de ElevenLabs"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Crea un agente en <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">ElevenLabs Dashboard</a> y copia el Agent ID aquí
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Guardando...' : agent ? 'Actualizar Agente' : 'Crear Agente'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}


