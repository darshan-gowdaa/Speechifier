import { useState, useEffect, useCallback, useRef } from 'react';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useTranscriber() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/transcriber.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }

    const worker = workerRef.current;

    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      switch (type) {
        case 'MODEL_PROGRESS':
          if (payload.status === 'progress' && payload.progress !== undefined) {
            setModelProgress(Math.round(payload.progress));
          }
          break;
        case 'MODEL_READY':
          setModelStatus('ready');
          break;
        case 'MODEL_ERROR':
          setModelStatus('error');
          console.error('Model error:', payload);
          break;
      }
    };

    worker.addEventListener('message', handleMessage);
    
    // Auto-load model
    if (modelStatus === 'idle') {
      setModelStatus('loading');
      worker.postMessage({ type: 'LOAD_MODEL' });
    }

    return () => {
      worker.removeEventListener('message', handleMessage);
    };
  }, [modelStatus]);

  const transcribe = useCallback((audioData: Float32Array): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const worker = workerRef.current;
      setIsTranscribing(true);

      const handleTranscribeMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        if (type === 'TRANSCRIBE_DONE') {
          setIsTranscribing(false);
          worker.removeEventListener('message', handleTranscribeMessage);
          resolve(payload.text);
        } else if (type === 'TRANSCRIBE_ERROR') {
          setIsTranscribing(false);
          worker.removeEventListener('message', handleTranscribeMessage);
          reject(new Error(payload));
        }
      };

      worker.addEventListener('message', handleTranscribeMessage);
      
      // Transfer buffer to avoid structured clone copying huge arrays
      worker.postMessage(
        { type: 'TRANSCRIBE', payload: { audioData: audioData.buffer } },
        [audioData.buffer]
      );
    });
  }, []);

  return {
    modelStatus,
    modelProgress,
    isTranscribing,
    transcribe
  };
}
