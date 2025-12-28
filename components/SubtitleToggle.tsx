'use client';

interface SubtitleToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function SubtitleToggle({ enabled, onToggle }: SubtitleToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`px-6 py-2.5 rounded-lg font-medium transition-colors border ${
        enabled
          ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      Subtitles: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}


