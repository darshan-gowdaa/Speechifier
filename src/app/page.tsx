"use client";

import { useState, useCallback, useEffect } from 'react';
import { useTranscriber } from '../hooks/useTranscriber';
import { FileDropZone } from '../components/FileDropZone';
import { TranscriptionResult } from '../components/TranscriptionResult';
import { ModelStatus } from '../components/ModelStatus';
import { Snackbar, type SnackbarItem } from '../components/Snackbar';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);

  const { modelStatus, modelProgress, modelError, isTranscribing, transcribe } =
    useTranscriber();

  // ── Surface model errors into snackbar ─────────────────────────────────────
  useEffect(() => {
    if (modelStatus === 'error' && modelError) {
      showSnackbar(`Model failed to load: ${modelError}`, 'error');
    }
  }, [modelStatus, modelError]);

  // ── Snackbar helpers ───────────────────────────────────────────────────────
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

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('audio/')) {
        showSnackbar(`"${file.name}" is not an audio file`, 'error');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        showSnackbar('File is too large. Maximum size is 100 MB.', 'error');
        return;
      }
      setSelectedFile(file);
      setTranscriptionResult('');
    },
    [showSnackbar]
  );

  // ── Audio decoding ─────────────────────────────────────────────────────────
  const decodeAudioTo16kHz = async (file: File): Promise<Float32Array> => {
    // Create AudioContext at exactly 16 kHz — browser will resample automatically
    const AudioCtxClass =
      window.AudioContext ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext;

    if (!AudioCtxClass) {
      throw new Error(
        'Your browser does not support the Web Audio API. ' +
          'Try Chrome, Edge, or Firefox.'
      );
    }

    const ctx = new AudioCtxClass({ sampleRate: 16000 });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      // Whisper uses mono — use channel 0
      return decoded.getChannelData(0).slice(); // clone so we own the buffer
    } finally {
      await ctx.close();
    }
  };

  // ── Transcription ──────────────────────────────────────────────────────────
  const handleTranscribe = async () => {
    if (!selectedFile) return;

    let audioData: Float32Array;

    try {
      showSnackbar('Decoding audio…');
      audioData = await decodeAudioTo16kHz(selectedFile);
    } catch (err: any) {
      showSnackbar(err?.message ?? 'Could not decode audio file.', 'error');
      return;
    }

    try {
      showSnackbar('Transcribing with Whisper AI…');
      const text = await transcribe(audioData);
      setTranscriptionResult(text);
      showSnackbar('Transcription complete!', 'success');
    } catch (err: any) {
      showSnackbar(err?.message ?? 'Transcription failed. Please try again.', 'error');
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const isModelLoading = modelStatus === 'idle' || modelStatus === 'loading';
  const isReady = modelStatus === 'ready';
  const canTranscribe = isReady && !!selectedFile && !isTranscribing;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="text-center mt-8 mb-2">
        <h1
          className="md3-display-large mb-2"
          style={{ color: 'var(--md-sys-color-primary)' }}
        >
          Echo
        </h1>
        <p
          className="md3-headline-medium"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          Local AI Transcription
        </p>
        <p
          className="md3-body-medium mt-1"
          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          Powered by Whisper · Runs entirely in your browser
        </p>
      </header>

      {/* Model loading card */}
      {isModelLoading && <ModelStatus progress={modelProgress} />}

      {/* Model error card (persistent, not just snackbar) */}
      {modelStatus === 'error' && (
        <div
          className="md3-shape-lg p-4 border"
          style={{
            backgroundColor: 'var(--md-sys-color-error-container)',
            borderColor: 'var(--md-sys-color-error)',
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          <p className="md3-title-medium mb-1">⚠ Model failed to load</p>
          <p className="md3-body-medium">{modelError || 'Unknown error occurred.'}</p>
          <p className="md3-body-medium mt-2 opacity-70">
            This can happen if your browser blocks Web Workers, or if there's no
            internet for the first model download. Try refreshing the page.
          </p>
        </div>
      )}

      {/* File upload */}
      <FileDropZone
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        onClear={() => {
          setSelectedFile(null);
          setTranscriptionResult('');
        }}
      />

      {/* Transcribe button */}
      <div className="flex justify-center">
        <button
          onClick={handleTranscribe}
          disabled={!canTranscribe}
          className="md3-filled-button h-14 px-10 w-full md:w-auto md:min-w-[240px]"
          style={{ fontSize: '1rem' }}
        >
          {isTranscribing
            ? '⏳ Transcribing…'
            : isModelLoading
            ? '⏳ Loading model…'
            : 'Transcribe Audio'}
        </button>
      </div>

      {/* Result */}
      {transcriptionResult && (
        <TranscriptionResult text={transcriptionResult} />
      )}

      {/* Snackbar stack */}
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
