/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
export {};

import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

// ─── State ───────────────────────────────────────────────────────────────────
let transcriber: AutomaticSpeechRecognitionPipeline | null = null;

// ─── Message handler ─────────────────────────────────────────────────────────
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload } = event.data as { type: string; payload: any };

  // ── LOAD_MODEL ──────────────────────────────────────────────────────────
  if (type === 'LOAD_MODEL') {
    try {
      transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          progress_callback: (data: any) => {
            self.postMessage({ type: 'MODEL_PROGRESS', payload: data });
          },
        }
      ) as AutomaticSpeechRecognitionPipeline;
      self.postMessage({ type: 'MODEL_READY' });
    } catch (err: any) {
      self.postMessage({
        type: 'MODEL_ERROR',
        payload: err?.message ?? String(err),
      });
    }
    return;
  }

  // ── TRANSCRIBE ───────────────────────────────────────────────────────────
  if (type === 'TRANSCRIBE') {
    if (!transcriber) {
      self.postMessage({
        type: 'TRANSCRIBE_ERROR',
        payload: 'Model not loaded yet. Please wait.',
      });
      return;
    }

    try {
      // Reconstruct Float32Array from transferred ArrayBuffer
      const audioData = new Float32Array(payload.audioData as ArrayBuffer);

      const output = (await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      })) as { text: string };

      self.postMessage({ type: 'TRANSCRIBE_DONE', payload: { text: output.text } });
    } catch (err: any) {
      self.postMessage({
        type: 'TRANSCRIBE_ERROR',
        payload: err?.message ?? String(err),
      });
    }
  }
});
