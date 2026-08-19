interface ModelStatusProps {
  progress: number;
}

export function ModelStatus({ progress }: ModelStatusProps) {
  return (
    <div className="md3-surface-container md3-shape-lg p-6 mb-8 border border-[var(--md-sys-color-outline-variant)]">
      <div className="flex items-center gap-4 mb-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--md-sys-color-primary)]"></div>
        <div>
          <h3 className="md3-title-medium text-[var(--md-sys-color-on-surface)]">
            Loading AI Model
          </h3>
          <p className="md3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
            Downloading Whisper AI model (happens once)
          </p>
        </div>
      </div>
      
      <div className="w-full bg-[var(--md-sys-color-surface-container-highest)] rounded-full h-2 overflow-hidden">
        <div 
          className="bg-[var(--md-sys-color-primary)] h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>
      <div className="flex justify-end mt-2">
        <span className="md3-label-medium text-[var(--md-sys-color-on-surface-variant)]">
          {progress}%
        </span>
      </div>
    </div>
  );
}
