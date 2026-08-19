"use client";

interface SpeakingBlobProps {
  status: 'idle' | 'preparing' | 'playing' | 'paused' | 'done' | 'error';
  pitch: number;
  rate: number;
}

export function SpeakingBlob({ status, pitch, rate }: SpeakingBlobProps) {
  const isPlaying = status === 'playing';
  
  // Calculate animation speeds based on playback rate and pitch
  const morphDuration = isPlaying ? `${Math.max(1.5, 4 - rate)}s` : '8s';
  const pulseDuration = isPlaying ? `${Math.max(0.5, 2 - (pitch * 0.5))}s` : '4s';
  
  // Adjust scale dynamically based on pitch (higher pitch = smaller/tighter blob)
  const baseScale = isPlaying ? (1 + (pitch - 1) * 0.1) : 1;

  return (
    <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
      {/* ── 3D Blob Background ────────────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out shadow-lg"
        style={{
          background: 'radial-gradient(circle at 30% 30%, var(--md-sys-color-primary-container) 0%, var(--md-sys-color-primary) 50%, #381E72 100%)',
          animation: `blob-morph ${morphDuration} ease-in-out infinite, blob-pulse ${pulseDuration} ease-in-out infinite alternate`,
          transform: `scale(${baseScale})`,
          boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.3), inset 5px 5px 15px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.15)',
          opacity: status === 'error' ? 0.3 : 1
        }}
      />
      
      {/* ── Inner Headphone Icon ──────────────────────────────────────── */}
      <svg
        width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
        className="relative z-10 transition-transform duration-500"
        style={{
          color: 'var(--md-sys-color-on-primary)',
          transform: isPlaying ? `scale(${1 + (rate - 1) * 0.1})` : 'scale(1)',
        }}
      >
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    </div>
  );
}
