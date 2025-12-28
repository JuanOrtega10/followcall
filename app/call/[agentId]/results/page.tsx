'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Call } from '@/types/call';
import { getCallsByAgent, getCalls } from '@/lib/storage';
import { StructuredCallData } from '@/types/call';

function CallResultsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.agentId) {
      const callId = searchParams.get('callId');
      console.log('🔍 [RESULTS] Loading results page:', { agentId: params.agentId, callId });
      
      if (callId) {
        // Buscar la llamada específica por ID
        const allCalls = getCalls();
        console.log('🔍 [RESULTS] Total calls in storage:', allCalls.length);
        const foundCall = allCalls.find(c => c.id === callId);
        
        if (foundCall) {
          console.log('✅ [RESULTS] Call found:', {
            id: foundCall.id,
            hasStructuredData: !!foundCall.structuredData,
            status: foundCall.status,
          });
          
          if (foundCall.structuredData) {
            console.log('📊 [RESULTS] Structured data structure:', {
              hasRespuestas: !!foundCall.structuredData.respuestas,
              respuestasCount: foundCall.structuredData.respuestas?.length || 0,
              hasMetricas: !!foundCall.structuredData.metricas,
              metricasKeys: foundCall.structuredData.metricas ? Object.keys(foundCall.structuredData.metricas) : [],
            });
            setCall(foundCall);
          } else {
            console.warn('⚠️ [RESULTS] Call found but no structuredData');
          }
        } else {
          console.error('❌ [RESULTS] Call not found with ID:', callId);
        }
      } else {
        // Si no hay callId, obtener la última llamada completada del agente
        console.log('🔍 [RESULTS] No callId provided, searching for latest completed call');
        const calls = getCallsByAgent(params.agentId as string);
        console.log('🔍 [RESULTS] Calls for agent:', calls.length);
        const completedCalls = calls.filter(c => c.status === 'completed' && c.structuredData);
        console.log('🔍 [RESULTS] Completed calls with structuredData:', completedCalls.length);
        
        if (completedCalls.length > 0) {
          // Ordenar por fecha y tomar la más reciente
          const latestCall = completedCalls.sort((a, b) => 
            new Date(b.endedAt || b.startedAt).getTime() - new Date(a.endedAt || a.startedAt).getTime()
          )[0];
          console.log('✅ [RESULTS] Latest call found:', latestCall.id);
          setCall(latestCall);
        } else {
          console.warn('⚠️ [RESULTS] No completed calls with structuredData found');
        }
      }
      setLoading(false);
    }
  }, [params.agentId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando resultados...</p>
      </div>
    );
  }

  if (!call || !call.structuredData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-gray-900 text-xl mb-4 font-semibold">No se encontraron resultados</p>
          <p className="text-gray-600 mb-6">No hay datos estructurados disponibles para esta llamada.</p>
          <Link
            href={`/agent/${params.agentId}`}
            className="inline-block px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Volver al agente
          </Link>
        </div>
      </div>
    );
  }

  const structuredData = call.structuredData as StructuredCallData;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">Resultados de la Llamada</h1>
            <p className="text-gray-600">
              Llamada completada el {call.endedAt ? new Date(call.endedAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          <Link
            href={`/agent/${params.agentId}`}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Volver al Agente
          </Link>
        </div>

        {/* Resumen */}
        {structuredData.resumen && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Resumen</h2>
            <p className="text-gray-700 leading-relaxed">{structuredData.resumen}</p>
          </div>
        )}

        {/* Respuestas */}
        {structuredData.respuestas && structuredData.respuestas.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Respuestas Recolectadas</h2>
            <div className="space-y-3">
              {structuredData.respuestas.map((respuesta, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase font-medium">{respuesta.categoria}</span>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{respuesta.pregunta}</p>
                  <p className="text-gray-700">{respuesta.respuesta}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métricas */}
        {structuredData.metricas && Object.keys(structuredData.metricas).length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Métricas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(structuredData.metricas).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-sm mb-1 font-medium">{key}</p>
                  <p className="text-gray-900 text-lg font-semibold">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {structuredData.observaciones && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Observaciones</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{structuredData.observaciones}</p>
          </div>
        )}

        {/* Acciones Recomendadas */}
        {structuredData.accionesRecomendadas && structuredData.accionesRecomendadas.length > 0 && (
          <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Recomendadas</h2>
            <ul className="space-y-2">
              {structuredData.accionesRecomendadas.map((accion, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{accion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transcript Original */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcript Original</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed font-mono">{call.transcript}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando resultados...</p>
      </div>
    }>
      <CallResultsContent />
    </Suspense>
  );
}

