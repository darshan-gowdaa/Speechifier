"use client";

interface TTSControlsProps {
  status: 'idle' | 'preparing' | 'playing' | 'paused' | 'done' | 'error';
  progress: number;
  rate: number;
  pitch: number;
  errorMsg: string;
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
  status, progress, rate, pitch, errorMsg,
  voices, selectedVoiceURI,
  onPlay, onPause, onResume, onStop,
  onRateChange, onPitchChange, onVoiceChange, disabled,
}: TTSControlsProps) {
  const isIdle      = status === 'idle';
  const isPreparing = status === 'preparing';
  const isPlaying   = status === 'playing';
  const isPaused    = status === 'paused';
  const isDone      = status === 'done';
  const isError     = status === 'error';
  const isActive    = isPlaying || isPaused;
  const isBusy      = isPreparing || isPlaying;

  const progressBarColor = isError
    ? 'var(--md-sys-color-error)'
    : 'var(--md-sys-color-primary)';

  const statusLabel = isPreparing
    ? '⏳ Preparing…'
    : isPlaying
    ? '▶ Reading…'
    : isPaused
    ? '⏸ Paused'
    : isDone
    ? '✓ Done'
    : isError
    ? '✕ Error'
    : 'Ready to read';

  return (
    <div
      className="md3-shape-expressive-lg p-6 flex flex-col gap-6"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        border: isError
          ? '1px solid var(--md-sys-color-error)'
          : '1px solid var(--md-sys-color-outline-variant)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      {/* ── Error banner ─────────────────────────────────────────────── */}
      {isError && errorMsg && (
        <div
          className="md3-shape-md p-3 flex items-start gap-2"
          style={{
            backgroundColor: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5" aria-hidden>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="md3-body-medium">{errorMsg}</span>
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div>
        {/* Indeterminate shimmer while preparing */}
        {isPreparing ? (
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '4px', backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                animation: 'tts-indeterminate 1.4s infinite ease-in-out',
                transformOrigin: 'left center',
              }}
            />
          </div>
        ) : (
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '4px', backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: progressBarColor }}
            />
          </div>
        )}

        <div className="flex justify-between mt-1">
          <span className="md3-label-medium" style={{ color: isError ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-on-surface-variant)' }}>
            {statusLabel}
          </span>
          {!isError && !isPreparing && (
            <span className="md3-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {progress}%
            </span>
          )}
        </div>
      </div>

      {/* ── Playback buttons ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 flex-wrap">

        {/* Idle / Error → Read Aloud */}
        {(isIdle || isError) && (
          <button
            onClick={onPlay}
            disabled={disabled}
            className="md3-filled-button h-14 px-8 gap-2"
            style={{ fontSize: '1rem', minWidth: '180px' }}
          >
            <PlayIcon /> Read Aloud
          </button>
        )}

        {/* Preparing → spinner + disabled */}
        {isPreparing && (
          <button
            disabled
            className="md3-filled-button h-14 px-8 gap-2 opacity-80"
            style={{ fontSize: '1rem', minWidth: '180px', cursor: 'not-allowed' }}
          >
            <SpinnerIcon /> Preparing…
          </button>
        )}

        {/* Playing → Pause */}
        {isPlaying && (
          <button onClick={onPause} className="md3-tonal-button h-12 px-6 gap-2">
            <PauseIcon /> Pause
          </button>
        )}

        {/* Paused → Resume */}
        {isPaused && (
          <button onClick={onResume} className="md3-tonal-button h-12 px-6 gap-2">
            <PlayIcon /> Resume
          </button>
        )}

        {/* Active → Stop */}
        {isActive && (
          <button onClick={onStop} className="md3-outlined-button h-12 px-6 gap-2">
            <StopIcon /> Stop
          </button>
        )}

        {/* Done → Read Again + Reset */}
        {isDone && (
          <>
            <button onClick={onPlay} disabled={disabled} className="md3-tonal-button h-12 px-6 gap-2">
              <ReplayIcon /> Read Again
            </button>
            <button onClick={onStop} className="md3-outlined-button h-12 px-6 gap-2">
              <StopIcon /> Reset
            </button>
          </>
        )}
      </div>

      {/* ── Settings ─────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 transition-opacity ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}>

        <div className="flex flex-col gap-1 md:col-span-1">
          <label className="md3-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Voice
          </label>
          <select
            value={selectedVoiceURI}
            onChange={(e) => onVoiceChange(e.target.value)}
            disabled={voices.length === 0}
            className="md3-shape-expressive-sm md3-body-medium px-4 py-3 border outline-none truncate"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
              opacity: voices.length === 0 ? 0.7 : 1,
              transition: 'border-color 0.2s ease',
            }}
          >
            {voices.length === 0 ? (
              <option value="">System Default Voice</option>
            ) : (
              voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="md3-label-medium flex justify-between" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            <span>Speed</span>
            <span style={{ color: 'var(--md-sys-color-primary)' }}>{rate.toFixed(1)}×</span>
          </label>
          <input type="range" min={0.5} max={2} step={0.1} value={rate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--md-sys-color-primary)', width: '100%' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="md3-label-medium flex justify-between" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            <span>Pitch</span>
            <span style={{ color: 'var(--md-sys-color-primary)' }}>{pitch.toFixed(1)}</span>
          </label>
          <input type="range" min={0.5} max={2} step={0.1} value={pitch}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            style={{ accentColor: 'var(--md-sys-color-primary)', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

function PlayIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>;
}
function PauseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
}
function StopIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 6h12v12H6z" /></svg>;
}
function ReplayIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>;
}
function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden
      style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
