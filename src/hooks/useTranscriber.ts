import { useState, useEffect, useCallback, useRef } from 'react';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useTranscriber() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [modelError, setModelError] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Stable refs — never change after mount
  const workerRef = useRef<Worker | null>(null);
  const loadedRef = useRef(false); // guard: only send LOAD_MODEL once

  // Transcribe promise refs
  const transcribeResolveRef = useRef<((text: string) => void) | null>(null);
  const transcribeRejectRef = useRef<((err: Error) => void) | null>(null);

  useEffect(() => {
    // Only run in browser, only once
    if (typeof window === 'undefined') return;
    if (workerRef.current) return;

    let worker: Worker;
    try {
      worker = new Worker(
        new URL('../workers/transcriber.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (e: any) {
      setModelStatus('error');
      setModelError('Failed to create Web Worker: ' + (e?.message ?? String(e)));
      return;
    }

    workerRef.current = worker;

    worker.addEventListener('message', (e: MessageEvent) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'MODEL_PROGRESS': {
          // payload: { status, name, file, progress, loaded, total }
          const pct =
            typeof payload?.progress === 'number'
              ? Math.round(payload.progress)
              : typeof payload?.loaded === 'number' && typeof payload?.total === 'number' && payload.total > 0
              ? Math.round((payload.loaded / payload.total) * 100)
              : 0;
          setModelProgress(pct);
          break;
        }
        case 'MODEL_READY':
          setModelStatus('ready');
          setModelProgress(100);
          break;
        case 'MODEL_ERROR':
          setModelStatus('error');
          setModelError(payload ?? 'Unknown model error');
          break;
        case 'TRANSCRIBE_DONE':
          setIsTranscribing(false);
          transcribeResolveRef.current?.(payload?.text ?? '');
          transcribeResolveRef.current = null;
          transcribeRejectRef.current = null;
          break;
        case 'TRANSCRIBE_ERROR':
          setIsTranscribing(false);
          transcribeRejectRef.current?.(new Error(payload ?? 'Transcription failed'));
          transcribeResolveRef.current = null;
          transcribeRejectRef.current = null;
          break;
      }
    });

    worker.addEventListener('error', (e: ErrorEvent) => {
      setModelStatus('error');
      setModelError(`Worker crashed: ${e.message}`);
      setIsTranscribing(false);
      transcribeRejectRef.current?.(new Error(`Worker crashed: ${e.message}`));
      transcribeResolveRef.current = null;
      transcribeRejectRef.current = null;
    });

    // Load model exactly once
    if (!loadedRef.current) {
      loadedRef.current = true;
      setModelStatus('loading');
      worker.postMessage({ type: 'LOAD_MODEL' });
    }

    return () => {
      worker.terminate();
      workerRef.current = null;
      loadedRef.current = false;
    };
  }, []); // ← empty deps: runs once on mount, cleans up on unmount

  const transcribe = useCallback((audioData: Float32Array): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not ready'));
        return;
      }

      setIsTranscribing(true);
      transcribeResolveRef.current = resolve;
      transcribeRejectRef.current = reject;

      // Transfer the underlying ArrayBuffer (zero-copy)
      const buffer = audioData.buffer.slice(0); // slice to ensure we own it
      workerRef.current.postMessage(
        { type: 'TRANSCRIBE', payload: { audioData: buffer } },
        [buffer]
      );
    });
  }, []);

  return {
    modelStatus,
    modelProgress,
    modelError,
    isTranscribing,
    transcribe,
  };
}
