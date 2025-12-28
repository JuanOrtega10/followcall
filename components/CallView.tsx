'use client';

import { useState, useEffect } from 'react';
import { useRealtimeAgent } from '@/lib/elevenlabs/realtime';
import SubtitleToggle from './SubtitleToggle';
import CallControls from './CallControls';
import Transcription from './Transcription';

interface CallViewProps {
  elevenLabsAgentId: string | null | undefined;
  onEndCall: () => void;
  onTranscriptUpdate?: (transcript: string) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CallView({ elevenLabsAgentId, onEndCall, onTranscriptUpdate }: CallViewProps) {
  const { 
    isConnected, 
    transcript, 
    duration, 
    connect, 
    disconnect,
    micMuted,
    setMicMuted,
    error 
  } = useRealtimeAgent(elevenLabsAgentId);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  useEffect(() => {
    if (elevenLabsAgentId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [elevenLabsAgentId, connect, disconnect]);

  useEffect(() => {
    if (transcript && onTranscriptUpdate) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  const handleEndCall = () => {
    disconnect();
    onEndCall();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-600 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-white">FOLLOWCALL</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Live</span>
              </div>
              <span className="text-white font-mono text-lg">
                {formatTime(duration)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Welcome Message */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8 max-w-md text-center">
          <p className="text-white text-lg">
            {error ? `Error: ${error}` : isConnected ? 'Hello! Welcome to your interview' : 'Conectando...'}
          </p>
        </div>

        {/* Subtitle Toggle */}
        <div className="mb-8">
          <SubtitleToggle 
            enabled={subtitlesEnabled} 
            onToggle={setSubtitlesEnabled} 
          />
        </div>

        {/* Transcription */}
        {subtitlesEnabled && (
          <Transcription transcript={transcript} isVisible={subtitlesEnabled} />
        )}
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-indigo-950/95 to-transparent">
        <CallControls 
          onEndCall={handleEndCall}
          isMuted={micMuted}
          onToggleMute={() => setMicMuted(!micMuted)}
        />
      </div>
    </div>
  );
}

