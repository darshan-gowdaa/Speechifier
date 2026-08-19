"use client";

import { useState, useCallback, useRef } from 'react';
import { useDocumentExtractor } from '../hooks/useDocumentExtractor';
import { useTTS } from '../hooks/useTTS';
import { TTSControls } from '../components/TTSControls';
import { Snackbar, type SnackbarItem } from '../components/Snackbar';

const ACCEPTED = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { status: extractStatus, extract } = useDocumentExtractor();
  const tts = useTTS();

  // ── Snackbar ──────────────────────────────────────────────────────────────
  const showSnackbar = useCallback((message: string, type: SnackbarItem['type'] = 'default') => {
    setSnackbars((prev) => [...prev, { id: Date.now() + Math.random(), message, type }]);
  }, []);

  const dismissSnackbar = useCallback((id: number) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt'];
    if (!ext || !allowed.includes(ext)) {
      showSnackbar(`Unsupported file type .${ext}. Use PDF, DOCX, or TXT.`, 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showSnackbar('File is too large. Maximum size is 50 MB.', 'error');
      return;
    }

    tts.stop();
    setSelectedFile(file);
    setExtractedText('');

    try {
      showSnackbar(`Extracting text from ${file.name}…`);
      const text = await extract(file);
      setExtractedText(text);
      showSnackbar(`Ready! ${text.split(/\s+/).length.toLocaleString()} words extracted.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not extract text.';
      showSnackbar(msg, 'error');
    }
  }, [extract, showSnackbar, tts]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── TTS not supported ─────────────────────────────────────────────────────
  if (!tts.isSupported) {
    return (
      <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col items-center justify-center gap-4">
        <div className="md3-shape-lg p-6 border text-center"
          style={{ backgroundColor: 'var(--md-sys-color-error-container)', borderColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error-container)' }}>
          <p className="md3-title-medium mb-2">⚠ Text-to-Speech not supported</p>
          <p className="md3-body-medium">Your browser doesn't support the Web Speech API. Please use Chrome or Edge on Android.</p>
        </div>
      </main>
    );
  }

  const isExtracting = extractStatus === 'extracting';
  const hasText = !!extractedText;
  const wordCount = hasText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-6 pb-24">

      {/* Header */}
      <header className="text-center mt-6 mb-2">
        <h1 className="md3-display-large mb-1" style={{ color: 'var(--md-sys-color-primary)' }}>
          Echo
        </h1>
        <p className="md3-headline-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Document Reader
        </p>
        <p className="md3-body-medium mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Upload a PDF, DOCX, or TXT — your phone will read it aloud
        </p>
      </header>

      {/* Drop zone */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isExtracting && inputRef.current?.click()}
        className="md3-shape-lg p-8 border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200"
        style={{
          borderColor: isDragging ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
          backgroundColor: isDragging ? 'var(--md-sys-color-primary-container)' : selectedFile ? 'var(--md-sys-color-surface-container-low)' : 'transparent',
          minHeight: '160px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleInputChange}
          disabled={isExtracting}
        />

        {isExtracting ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--md-sys-color-primary)', borderTopColor: 'transparent' }} />
            <p className="md3-title-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Extracting text…
            </p>
          </>
        ) : selectedFile && hasText ? (
          <>
            {/* File icon */}
            <div className="p-3 md3-shape-full" style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="text-center">
              <p className="md3-title-medium truncate max-w-xs" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                {selectedFile.name}
              </p>
              <p className="md3-body-medium mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                {wordCount.toLocaleString()} words · tap to change file
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 md3-shape-full" style={{ backgroundColor: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="md3-title-medium text-center" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {isDragging ? 'Drop file here' : 'Tap to upload a document'}
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {['PDF', 'DOCX', 'TXT'].map((fmt) => (
                <span key={fmt} className="md3-chip" style={{ fontSize: '0.75rem', height: '26px', padding: '0 10px' }}>
                  {fmt}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Text preview */}
      {hasText && (
        <div className="md3-shape-lg border" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="md3-label-large" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Extracted Text
            </span>
            <span className="md3-label-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {wordCount.toLocaleString()} words
            </span>
          </div>
          <div
            className="px-4 pb-4 md3-body-large overflow-y-auto"
            style={{
              maxHeight: '240px',
              color: 'var(--md-sys-color-on-surface)',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.7',
            }}
          >
            {extractedText}
          </div>
        </div>
      )}

      {/* TTS Controls */}
      {hasText && (
        <TTSControls
          status={tts.status}
          progress={tts.progress}
          rate={tts.rate}
          pitch={tts.pitch}
          voices={tts.voices}
          selectedVoiceURI={tts.selectedVoiceURI}
          onPlay={() => tts.speak(extractedText)}
          onPause={tts.pause}
          onResume={tts.resume}
          onStop={tts.stop}
          onRateChange={tts.setRate}
          onPitchChange={tts.setPitch}
          onVoiceChange={tts.setSelectedVoiceURI}
          disabled={!hasText}
        />
      )}

      {/* Snackbars */}
      {snackbars.map((sb, idx) => (
        <Snackbar
          key={sb.id}
          item={sb}
          stackOffset={snackbars.length - 1 - idx}
          onDismiss={dismissSnackbar}
        />
      ))}
    </main>
  );
}
