'use client';

import { useState, useEffect } from 'react';
import { Agent, DataSchema } from '@/types/agent';
import PromptGenerator from './PromptGenerator';
import { generateId } from '@/lib/storage';
import { AlertCircle, ExternalLink, Loader2, Save, X } from 'lucide-react';

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
        voiceId,
        language: 'es',
        dataSchema,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el agente');
    } finally {
      setLoading(false);
    }
  };

  // Estilos comunes para inputs
  const inputStyles = "w-full p-3.5 bg-[#0A332A]/50 text-white rounded-xl border border-[#5EEAD4]/30 focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]/50 focus:outline-none transition-all duration-300 placeholder:text-[#5EEAD4]/30";
  const labelStyles = "block text-sm font-medium text-[#A7F3D0] mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre del Agente */}
      <div>
        <label className={labelStyles}>
          Nombre del Agente
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputStyles}
          placeholder="Ej: Agente de Seguimiento"
          required
        />
      </div>

      {/* Objetivo */}
      <div>
        <label className={labelStyles}>
          Objetivo
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className={`${inputStyles} min-h-[100px] resize-none`}
          placeholder="Ej: Quiero realizar llamadas de seguimiento para recopilar información sobre el estado de los clientes"
          required
        />
      </div>

      {/* Generador de Prompt */}
      <div className="p-4 bg-[#0A332A]/30 rounded-xl border border-[#5EEAD4]/20">
        <label className={`${labelStyles} mb-3`}>
          Generar System Prompt y Schema
        </label>
        <PromptGenerator objective={objective} onGenerated={handlePromptGenerated} />
      </div>

      {/* System Prompt */}
      <div>
        <label className={labelStyles}>
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className={`${inputStyles} min-h-[150px] font-mono text-sm resize-none`}
          placeholder="El prompt del sistema para el agente..."
          required
        />
      </div>

      {/* Primer Mensaje */}
      <div>
        <label className={labelStyles}>
          Primer Mensaje (First Message)
        </label>
        <textarea
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          className={`${inputStyles} min-h-[80px] resize-none`}
          placeholder="El primer mensaje que dirá el agente..."
        />
      </div>

      {/* Datos a Recolectar */}
      {dataSchema && dataSchema.fields && dataSchema.fields.length > 0 && (
        <div>
          <label className={labelStyles}>
            Datos a Recolectar:
          </label>
          <div className="p-4 bg-[#0A332A]/50 rounded-xl border border-[#5EEAD4]/20">
            <ul className="space-y-3">
              {dataSchema.fields.map((field, index) => (
                <li key={index} className="text-sm flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#5EEAD4]">{field.name}</span>
                  <span className="px-2 py-0.5 bg-[#5EEAD4]/10 text-[#A7F3D0] rounded-md text-xs border border-[#5EEAD4]/20">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md text-xs border border-red-500/20">
                      requerido
                    </span>
                  )}
                  <span className="text-[#A7F3D0]/60 text-xs">— {field.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Agent ID */}
      <div>
        <label className={labelStyles}>
          Agent ID (ElevenLabs)
        </label>
        <input
          type="text"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          className={`${inputStyles} font-mono text-sm`}
          placeholder="Pega aquí el Agent ID de ElevenLabs"
          required
        />
        <p className="text-xs text-[#5EEAD4]/50 mt-2 flex items-center gap-1">
          Crea un agente en{' '}
          <a 
            href="https://elevenlabs.io/app/conversational-ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#5EEAD4] hover:text-[#A7F3D0] underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
          >
            ElevenLabs Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>
          {' '}y copia el Agent ID aquí
        </p>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="group relative px-6 py-3 bg-gradient-to-r from-[#5EEAD4] to-[#A7F3D0] text-[#0F4C3A] rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(94,234,212,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {agent ? 'Actualizar Agente' : 'Crear Agente'}
              </>
            )}
          </span>
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-transparent hover:bg-[#5EEAD4]/10 text-[#A7F3D0] border border-[#5EEAD4]/30 hover:border-[#5EEAD4]/50 rounded-xl font-medium transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </form>
  );
}