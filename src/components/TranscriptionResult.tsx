import { useState } from 'react';

interface TranscriptionResultProps {
  text: string;
}

export function TranscriptionResult({ text }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="md3-surface-container md3-shape-xl p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] p-2 md3-shape-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="md3-title-large text-[var(--md-sys-color-on-surface)]">Transcription Complete</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="md3-chip bg-[var(--md-sys-color-surface-container-high)]">
            {wordCount} words
          </span>
          <span className="md3-chip bg-[var(--md-sys-color-surface-container-high)]">
            {text.length} chars
          </span>
        </div>
      </div>

      <div className="bg-[var(--md-sys-color-surface-container-low)] md3-shape-lg p-6 mb-6 max-h-[400px] overflow-y-auto border border-[var(--md-sys-color-outline-variant)]">
        <p className="md3-body-large whitespace-pre-wrap text-[var(--md-sys-color-on-surface)]">
          {text}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button 
          onClick={handleCopy}
          className="md3-outlined-button gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {copied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            )}
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button 
          onClick={handleDownload}
          className="md3-filled-button gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .txt
        </button>
      </div>
    </div>
  );
}
