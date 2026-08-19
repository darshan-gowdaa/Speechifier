"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDocumentExtractor } from '../hooks/useDocumentExtractor';
import { useTTS } from '../hooks/useTTS';
import { TTSControls } from '../components/TTSControls';
import { SpeakingBlob } from '../components/SpeakingBlob';
import { Snackbar, type SnackbarItem } from '../components/Snackbar';

const ACCEPTED =
  '.pdf,.docx,.txt,' +
  'application/pdf,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'text/plain';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isDragging, setIsDragging]       = useState(false);
  const [snackbars, setSnackbars]         = useState<SnackbarItem[]>([]);
  const [copied, setCopied]               = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { status: extractStatus, extract } = useDocumentExtractor();
  const tts = useTTS();

  useEffect(() => {
    if (tts.status === 'error' && tts.errorMsg) {
      showSnackbar(tts.errorMsg, 'error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.status, tts.errorMsg]);

  const ttsStopRef = useRef(tts.stop);
  useEffect(() => { ttsStopRef.current = tts.stop; }, [tts.stop]);

  const showSnackbar = useCallback(
    (message: string, type: SnackbarItem['type'] = 'default') => {
      setSnackbars((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), message, type },
      ]);
    },
    []
  );

  const dismissSnackbar = useCallback((id: number) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleCopy = useCallback(async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSnackbar('Text copied to clipboard!', 'success');
    } catch {
      showSnackbar('Could not copy — try selecting text manually.', 'error');
    }
  }, [extractedText, showSnackbar]);

  const handleDownload = useCallback(() => {
    if (!extractedText || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${baseName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('Downloaded as .txt', 'success');
  }, [extractedText, selectedFile, showSnackbar]);

  const handleFile = useCallback(
    async (file: File) => {
      const ext     = file.name.split('.').pop()?.toLowerCase() ?? '';
      const allowed = ['pdf', 'docx', 'txt'];

      if (!allowed.includes(ext)) {
        showSnackbar(
          `".${ext}" is not supported. Please upload a PDF, DOCX, or TXT.`,
          'error'
        );
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        showSnackbar('File is too large. Maximum is 50 MB.', 'error');
        return;
      }

      ttsStopRef.current(); 
      setSelectedFile(file);
      setExtractedText('');
      setCopied(false);

      try {
        showSnackbar(`Reading ${file.name}…`);
        const text = await extract(file);
        setExtractedText(text);
        const words = text.split(/\s+/).filter(Boolean).length;
        showSnackbar(
          `Ready! ${words.toLocaleString()} words extracted.`,
          'success'
        );
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Could not extract text.';
        showSnackbar(msg, 'error');
      }
    },
    [extract, showSnackbar] 
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  const isExtracting = extractStatus === 'extracting';
  const hasText      = extractedText.length > 0;
  const wordCount    = hasText
    ? extractedText.split(/\s+/).filter(Boolean).length
    : 0;

  if (mounted && !tts.isSupported) {
    return (
      <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col items-center justify-center gap-4">
        <div
          className="md3-shape-lg p-6 border text-center"
          style={{
            backgroundColor: 'var(--md-sys-color-error-container)',
            borderColor: 'var(--md-sys-color-error)',
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          <p className="md3-title-medium mb-2">⚠ Text-to-Speech not supported</p>
          <p className="md3-body-medium">
            Your browser doesn&apos;t support the Web Speech API.
            Please use Chrome or Edge on Android.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-6 pb-28">

      {/* ── Hero / Header ─────────────────────────────────────────────── */}
      <header
        className="md3-shape-xl p-8 mb-2 text-center flex flex-col items-center gap-3"
        style={{
          backgroundColor: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
        }}
      >
        <SpeakingBlob status={tts.status} pitch={tts.pitch} rate={tts.rate} />
        <h1 className="md3-display-large" style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>
          Speech to Text
        </h1>
        <p className="md3-title-medium opacity-90 max-w-sm">
          Listen to any PDF, DOCX, or TXT file offline on your device.
        </p>
      </header>

      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload document"
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e)  => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isExtracting && !selectedFile && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !isExtracting && !selectedFile && inputRef.current?.click()}
        className="md3-shape-lg p-8 border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-200"
        style={{
          borderColor: isDragging
            ? 'var(--md-sys-color-primary)'
            : 'var(--md-sys-color-outline-variant)',
          backgroundColor: isDragging
            ? 'var(--md-sys-color-primary-container)'
            : selectedFile
            ? 'var(--md-sys-color-surface-container-low)'
            : 'transparent',
          minHeight: '160px',
          cursor: selectedFile ? 'default' : 'pointer',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleInputChange}
          disabled={isExtracting}
          aria-hidden
        />

        {isExtracting ? (
          <>
            <div
              className="w-10 h-10 rounded-full border-[3px] animate-spin"
              style={{
                borderColor: 'var(--md-sys-color-primary)',
                borderTopColor: 'transparent',
              }}
            />
            <p className="md3-title-medium mt-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              Extracting text…
            </p>
          </>
        ) : selectedFile && hasText ? (
          <>
            <div
              className="p-4 md3-shape-full"
              style={{
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              }}
            >
              <DocumentIcon />
            </div>
            <div className="text-center">
              <p
                className="md3-title-medium truncate max-w-xs"
                style={{ color: 'var(--md-sys-color-on-surface)' }}
              >
                {selectedFile.name}
              </p>
              <p
                className="md3-body-medium mt-1"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {wordCount.toLocaleString()} words loaded
              </p>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="md3-tonal-button px-5 h-10"
              >
                Change File
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setExtractedText('');
                  ttsStopRef.current();
                }}
                className="md3-outlined-button px-5 h-10"
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="p-4 md3-shape-full"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              <UploadIcon />
            </div>
            <p
              className="md3-title-medium text-center"
              style={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              {isDragging ? 'Drop file here' : 'Tap to upload a document'}
            </p>
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              {['PDF', 'DOCX', 'TXT'].map((fmt) => (
                <span
                  key={fmt}
                  className="md3-chip"
                  style={{ fontSize: '0.8rem', height: '28px', padding: '0 12px' }}
                >
                  {fmt}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Text preview ──────────────────────────────────────────────── */}
      {hasText && (
        <div
          className="md3-shape-lg border"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
            <span
              className="md3-label-large"
              style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Extracted Text
            </span>
            <div className="flex items-center gap-2">
              <span
                className="md3-label-medium"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {wordCount.toLocaleString()} words
              </span>
              <button
                onClick={handleCopy}
                title="Copy text"
                className="md3-icon-button"
                aria-label="Copy extracted text"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
              <button
                onClick={handleDownload}
                title="Download as .txt"
                className="md3-icon-button"
                aria-label="Download as text file"
              >
                <DownloadIcon />
              </button>
            </div>
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

      {/* ── TTS Controls ──────────────────────────────────────────────── */}
      {hasText && (
        <TTSControls
          status={tts.status}
          progress={tts.progress}
          rate={tts.rate}
          pitch={tts.pitch}
          errorMsg={tts.errorMsg}
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

      {/* ── Snackbars ─────────────────────────────────────────────────── */}
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

/* ── SVG Icons ──────────────────────────────────────────────────────────── */
function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
