'use client';

import { Subtitles } from 'lucide-react';

interface SubtitleToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function SubtitleToggle({ enabled, onToggle }: SubtitleToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`group px-5 py-2.5 rounded-xl font-medium transition-all duration-300 border flex items-center gap-2 ${
        enabled
          ? 'bg-gradient-to-r from-[#5EEAD4]/20 to-[#A7F3D0]/20 hover:from-[#5EEAD4]/30 hover:to-[#A7F3D0]/30 text-[#5EEAD4] border-[#5EEAD4]/40 hover:border-[#5EEAD4]/60 shadow-[0_0_15px_rgba(94,234,212,0.15)]'
          : 'bg-[#0D3D2E]/40 hover:bg-[#0D3D2E]/60 text-[#A7F3D0]/60 hover:text-[#A7F3D0] border-[#5EEAD4]/20 hover:border-[#5EEAD4]/30'
      }`}
    >
      <Subtitles className={`w-4 h-4 transition-transform duration-300 ${enabled ? 'scale-110' : 'scale-100'}`} />
      <span>Subtítulos: {enabled ? 'ON' : 'OFF'}</span>
    </button>
  );
}