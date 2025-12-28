'use client';

import { useState } from 'react';

interface CallControlsProps {
  onEndCall: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function CallControls({ onEndCall, isMuted = false, onToggleMute }: CallControlsProps) {
  const [isEnding, setIsEnding] = useState(false);

  const handleEndCall = async () => {
    if (isEnding) return; // Prevenir múltiples clics
    
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
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          disabled={isEnding}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      )}
      <button
        onClick={handleEndCall}
        disabled={isEnding}
        className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        {isEnding ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Ending...</span>
          </>
        ) : (
          'End Call'
        )}
      </button>
    </div>
  );
}


