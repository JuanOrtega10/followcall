'use client';

interface CallControlsProps {
  onEndCall: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function CallControls({ onEndCall, isMuted = false, onToggleMute }: CallControlsProps) {
  return (
    <div className="flex gap-4 justify-center">
      {onToggleMute && (
        <button
          onClick={onToggleMute}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      )}
      <button
        onClick={onEndCall}
        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        End Interview
      </button>
    </div>
  );
}

