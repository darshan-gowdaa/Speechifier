import { useState, useEffect, useRef, useCallback } from 'react';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

// We keep the pipeline instance in a module-level ref so it survives
// React re-renders and Fast Refresh without being re-created.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pipelineInstance: any = null;

export function useTranscriber() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [modelProgress, setModelProgress] = useState(0);
  const [modelError, setModelError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Already loaded — nothing to do
    if (_pipelineInstance) {
      setModelStatus('ready');
      setModelProgress(100);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setModelStatus('loading');
        setModelProgress(0);
        setModelError('');

        // Dynamic import avoids SSR issues and defers the huge bundle
        const { pipeline, env } = await import('@huggingface/transformers');

        env.allowLocalModels = false;
        env.useBrowserCache = true;

        const pipe = await pipeline(
          'automatic-speech-recognition',
          'Xenova/whisper-tiny.en',
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            progress_callback: (data: any) => {
              if (cancelled || !mountedRef.current) return;
              // data.progress is 0-100 when status === 'progress'
              if (data.status === 'progress' && typeof data.progress === 'number') {
                setModelProgress(Math.round(data.progress));
              } else if (
                data.status === 'progress' &&
                typeof data.loaded === 'number' &&
                typeof data.total === 'number' &&
                data.total > 0
              ) {
                setModelProgress(Math.round((data.loaded / data.total) * 100));
              }
            },
          }
        );

        if (cancelled) return;

        _pipelineInstance = pipe;
        if (mountedRef.current) {
          setModelStatus('ready');
          setModelProgress(100);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
            ? err
            : 'Unknown error loading model';
        if (mountedRef.current) {
          setModelStatus('error');
          setModelError(msg);
        }
      }
    };

    load();

    return () => { cancelled = true; };
  }, []); // run once

  const transcribe = useCallback(async (audioData: Float32Array): Promise<string> => {
    if (!_pipelineInstance) {
      throw new Error('Model is not loaded yet. Please wait.');
    }

    setIsTranscribing(true);
    try {
      const result = await _pipelineInstance(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });
      return (result as { text: string }).text ?? '';
    } finally {
      if (mountedRef.current) setIsTranscribing(false);
    }
  }, []);

  return { modelStatus, modelProgress, modelError, isTranscribing, transcribe };
}
