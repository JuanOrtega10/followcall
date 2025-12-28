'use client';

interface SubtitleToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function SubtitleToggle({ enabled, onToggle }: SubtitleToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
    >
      Subtitles: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}

