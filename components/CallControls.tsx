'use client';

import { useState } from 'react';
import { PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react';

interface CallControlsProps {
  onEndCall: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function CallControls({ onEndCall, isMuted = false, onToggleMute }: CallControlsProps) {
  const [isEnding, setIsEnding] = useState(false);

  const handleEndCall = async () => {
    if (isEnding) return;
    
    setIsEnding(true);
    try {
      await onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
      setIsEnding(false);
    }
  };

  return (
    <div className="flex gap-4 justify-center">
      {/* Botón Mute */}
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          disabled={isEnding}
          className={`group p-4 rounded-full font-medium transition-all duration-300 border ${
            isMuted
              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40 hover:border-amber-500/60'
              : 'bg-[#5EEAD4]/10 hover:bg-[#5EEAD4]/20 text-[#5EEAD4] border-[#5EEAD4]/30 hover:border-[#5EEAD4]/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Botón End Call */}
      <button
        onClick={handleEndCall}
        disabled={isEnding}
        className="group px-8 py-4 bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/40 hover:border-red-500/60 rounded-full font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] disabled:cursor-not-allowed flex items-center gap-3"
      >
        {isEnding ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Finalizando...</span>
          </>
        ) : (
          <>
            <PhoneOff className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>Terminar Llamada</span>
          </>
        )}
      </button>
    </div>
  );
}