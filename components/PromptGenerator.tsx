'use client';

import { useState } from 'react';
import { DataSchema } from '@/types/agent';

interface PromptGeneratorProps {
  objective: string;
  onGenerated: (systemPrompt: string, dataSchema: DataSchema) => void;
}

export default function PromptGenerator({ objective, onGenerated }: PromptGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dataSchema, setDataSchema] = useState<DataSchema | null>(null);

  const generatePrompt = async () => {
    if (!objective.trim()) {
      setError('Por favor ingresa un objetivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al generar el prompt');
      }

      const data = await response.json();
      setSystemPrompt(data.systemPrompt);
      setDataSchema(data.dataSchema);
      onGenerated(data.systemPrompt, data.dataSchema);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={generatePrompt}
        disabled={loading || !objective.trim()}
        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {loading ? 'Generando...' : 'Generar System Prompt'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {systemPrompt && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt Generado:
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-4 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[200px] font-mono text-sm"
              placeholder="System prompt aparecerá aquí..."
            />
          </div>

          {dataSchema && (
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
        </div>
      )}
    </div>
  );
}

