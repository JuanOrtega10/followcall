'use client';

interface TranscriptionProps {
  transcript: string;
  isVisible: boolean;
}

export default function Transcription({ transcript, isVisible }: TranscriptionProps) {
  if (!isVisible) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Transcripción</h3>
      <div className="text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
        {transcript || 'Esperando transcripción...'}
      </div>
    </div>
  );
}


