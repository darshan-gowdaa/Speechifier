"use client";

import { useState, useCallback, useEffect } from 'react';
import { useTranscriber } from '../hooks/useTranscriber';
import { FileDropZone } from '../components/FileDropZone';
import { TranscriptionResult } from '../components/TranscriptionResult';
import { ModelStatus } from '../components/ModelStatus';
import { Snackbar } from '../components/Snackbar';

interface SnackbarState {
  id: number;
  message: string;
  type: 'default' | 'error' | 'success';
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<string>('');
  const [snackbars, setSnackbars] = useState<SnackbarState[]>([]);
  const { modelStatus, modelProgress, isTranscribing, transcribe } = useTranscriber();

  const showSnackbar = useCallback((message: string, type: 'default' | 'error' | 'success' = 'default') => {
    setSnackbars((prev) => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const handleDismissSnackbar = useCallback((id: number) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      showSnackbar('File too large (Max 100MB)', 'error');
      return;
    }
    setSelectedFile(file);
    setTranscriptionResult(''); // Reset result on new file
  };

  const processAudioFile = async (file: File): Promise<Float32Array> => {
    // SSR guard
    if (typeof window === 'undefined' || !window.AudioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) throw new Error('AudioContext not supported in this browser');
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate: 16000 }); // MUST resample to 16kHz
    
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // We only need a single channel for Whisper
    return audioBuffer.getChannelData(0);
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;
    
    try {
      showSnackbar('Processing audio...', 'default');
      const audioData = await processAudioFile(selectedFile);
      
      showSnackbar('Transcribing...', 'default');
      const result = await transcribe(audioData);
      
      setTranscriptionResult(result);
      showSnackbar('Transcription complete!', 'success');
    } catch (err: any) {
      console.error(err);
      showSnackbar(err.message || 'Error transcribing audio', 'error');
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 max-w-4xl mx-auto flex flex-col gap-8">
      <header className="text-center mt-8 mb-4">
        <h1 className="md3-display-large text-[var(--md-sys-color-primary)] font-medium mb-2">Echo</h1>
        <p className="md3-headline-medium text-[var(--md-sys-color-on-surface-variant)]">
          Local AI Transcription
        </p>
      </header>

      {(modelStatus === 'loading' || modelStatus === 'idle') && (
        <ModelStatus progress={modelProgress} />
      )}

      {modelStatus === 'error' && (
        <div className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-4 md3-shape-lg">
          <p className="md3-body-large font-medium">Error loading AI model. Please check console.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <FileDropZone 
          onFileSelect={handleFileSelect} 
          selectedFile={selectedFile} 
          onClear={() => {
            setSelectedFile(null);
            setTranscriptionResult('');
          }} 
        />
        
        <div className="flex justify-center">
          <button 
            onClick={handleTranscribe}
            disabled={!selectedFile || isTranscribing || modelStatus !== 'ready'}
            className="md3-filled-button h-14 px-8 w-full md:w-auto md:min-w-[240px] text-lg"
          >
            {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
          </button>
        </div>
      </div>

      {transcriptionResult && (
        <TranscriptionResult text={transcriptionResult} />
      )}

      {/* Snackbar queue render */}
      {snackbars.map((sb, idx) => (
        <Snackbar
          key={sb.id}
          visible={true}
          message={sb.message}
          type={sb.type}
          onDismiss={() => handleDismissSnackbar(sb.id)}
          // offset older snackbars up
          {...(idx < snackbars.length - 1 ? { style: { bottom: `${(snackbars.length - 1 - idx) * 60 + 24}px` } } : {})}
        />
      ))}
    </main>
  );
}
