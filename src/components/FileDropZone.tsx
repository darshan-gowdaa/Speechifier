import { useState, useCallback, useRef } from 'react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function FileDropZone({ onFileSelect, selectedFile, onClear }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  if (selectedFile) {
    return (
      <div className="md3-surface-container md3-shape-lg p-6 flex items-center justify-between border border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center gap-4">
          <div className="bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] p-3 md3-shape-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm12-3c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zM9 10l12-3" />
            </svg>
          </div>
          <div>
            <p className="md3-title-medium text-[var(--md-sys-color-on-surface)] truncate max-w-[200px] md:max-w-[400px]">
              {selectedFile.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="md3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="md3-chip !h-6 !text-xs bg-[var(--md-sys-color-surface-container-high)]">
                {selectedFile.type || 'audio'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="md3-icon-button"
          title="Remove file"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`md3-shape-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed
        ${isDragging 
          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/10 scale-[1.02]' 
          : 'border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:border-[var(--md-sys-color-outline)]'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className={`p-4 md3-shape-full mb-4 transition-colors ${isDragging ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'}`}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="md3-title-medium text-[var(--md-sys-color-on-surface)] mb-2">
        {isDragging ? 'Drop to transcribe' : 'Click or drag audio file here'}
      </p>
      <p className="md3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
        Supports MP3, WAV, M4A, etc. (Max 100MB)
      </p>
    </div>
  );
}
