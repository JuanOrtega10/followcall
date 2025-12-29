'use client';

import { useState } from 'react';
import { DataSchema } from '@/types/agent';
import { Sparkles, Loader2, AlertCircle, Wand2 } from 'lucide-react';

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

  const inputStyles = "w-full p-3.5 bg-[#0A332A]/50 text-white rounded-xl border border-[#5EEAD4]/30 focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]/50 focus:outline-none transition-all duration-300 placeholder:text-[#5EEAD4]/30";
  const labelStyles = "block text-sm font-medium text-[#A7F3D0] mb-2";

  return (
    <div className="space-y-4">
      {/* Botón Generar */}
      <button
        onClick={generatePrompt}
        disabled={loading || !objective.trim()}
        className="group relative px-5 py-2.5 bg-gradient-to-r from-[#5EEAD4]/20 to-[#A7F3D0]/20 hover:from-[#5EEAD4]/30 hover:to-[#A7F3D0]/30 text-[#5EEAD4] border border-[#5EEAD4]/40 hover:border-[#5EEAD4]/60 rounded-xl font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(94,234,212,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-[#5EEAD4]/40"
      >
        <span className="flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              Generar System Prompt
              <Sparkles className="w-3 h-3 opacity-60" />
            </>
          )}
        </span>
      </button>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Resultado generado */}
      {systemPrompt && (
        <div className="space-y-4 pt-2">
          {/* System Prompt Generado */}
          <div>
            <label className={labelStyles}>
              <span className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#5EEAD4]" />
                System Prompt Generado:
              </span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className={`${inputStyles} min-h-[200px] font-mono text-sm resize-none`}
              placeholder="System prompt aparecerá aquí..."
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
        </div>
      )}
    </div>
  );
}