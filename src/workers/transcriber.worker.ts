/// <reference lib="webworker" />
export {};

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload } = event.data;
  
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
      );
      self.postMessage({ type: 'MODEL_READY' });
    } catch (err: any) {
      self.postMessage({ type: 'MODEL_ERROR', payload: err.message });
    }
  }
  
  if (type === 'TRANSCRIBE') {
    if (!transcriber) {
      self.postMessage({ type: 'TRANSCRIBE_ERROR', payload: 'Model not loaded' });
      return;
    }
    try {
      const { audioData } = payload;
      // Convert ArrayBuffer back to Float32Array
      const f32Array = new Float32Array(audioData);
      
      const output = await transcriber(f32Array, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });
      self.postMessage({ type: 'TRANSCRIBE_DONE', payload: { text: output.text } });
    } catch (err: any) {
      self.postMessage({ type: 'TRANSCRIBE_ERROR', payload: err.message });
    }
  }
});
