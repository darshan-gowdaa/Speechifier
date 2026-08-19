"use client";

interface TTSControlsProps {
  status: 'idle' | 'playing' | 'paused' | 'done' | 'error';
  progress: number;
  rate: number;
  pitch: number;
  voices: { name: string; lang: string; voiceURI: string }[];
  selectedVoiceURI: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRateChange: (v: number) => void;
  onPitchChange: (v: number) => void;
  onVoiceChange: (uri: string) => void;
  disabled: boolean;
}

export function TTSControls({
  status, progress, rate, pitch, voices, selectedVoiceURI,
  onPlay, onPause, onResume, onStop,
  onRateChange, onPitchChange, onVoiceChange, disabled,
}: TTSControlsProps) {
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isActive = isPlaying || isPaused;

  return (
    <div
      className="md3-shape-lg p-5 border flex flex-col gap-5"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      {/* Progress bar */}
      <div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: '4px', backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--md-sys-color-primary)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="md3-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {isPlaying ? '▶ Reading…' : isPaused ? '⏸ Paused' : status === 'done' ? '✓ Done' : 'Ready'}
          </span>
          <span className="md3-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Playback buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Play / Pause / Resume */}
        {!isActive ? (
          <button
            onClick={onPlay}
            disabled={disabled}
            className="md3-filled-button h-14 px-8 gap-2"
            style={{ fontSize: '1rem', minWidth: '180px' }}
          >
            <PlayIcon /> Read Aloud
          </button>
        ) : isPlaying ? (
          <button
            onClick={onPause}
            className="md3-tonal-button h-12 px-6 gap-2"
          >
            <PauseIcon /> Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            className="md3-tonal-button h-12 px-6 gap-2"
          >
            <PlayIcon /> Resume
          </button>
        )}

        {/* Stop */}
        {isActive && (
          <button
            onClick={onStop}
            className="md3-outlined-button h-12 px-6 gap-2"
          >
            <StopIcon /> Stop
          </button>
        )}
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Voice */}
        {voices.length > 0 && (
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="md3-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Voice
            </label>
            <select
              value={selectedVoiceURI}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="md3-shape-sm md3-body-medium px-3 py-2 border outline-none"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderColor: 'var(--md-sys-color-outline)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Speed */}
        <div className="flex flex-col gap-1">
          <label className="md3-label-medium flex justify-between" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            <span>Speed</span><span style={{ color: 'var(--md-sys-color-primary)' }}>{rate}×</span>
          </label>
          <input
            type="range" min={0.5} max={2} step={0.1}
            value={rate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--md-sys-color-primary)', width: '100%' }}
          />
        </div>

        {/* Pitch */}
        <div className="flex flex-col gap-1">
          <label className="md3-label-medium flex justify-between" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            <span>Pitch</span><span style={{ color: 'var(--md-sys-color-primary)' }}>{pitch.toFixed(1)}</span>
          </label>
          <input
            type="range" min={0.5} max={2} step={0.1}
            value={pitch}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--md-sys-color-primary)', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}
