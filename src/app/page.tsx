"use client";

import { useState, useRef, useEffect } from "react";
import { RiUploadCloudLine, RiFileMusicLine, RiLoader4Line, RiCheckboxCircleLine } from "@remixicon/react";

// Web worker approach is better for transformers.js to avoid blocking UI,
// but for simplicity in ponytail mode, we can dynamic import and run in main thread if it's not too heavy,
// or just use a worker. Let's run in main thread first, it's a tiny model.

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string>("");
  const [status, setStatus] = useState("idle"); // idle, loading-model, transcribing, done, error
  const pipelineRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const loadModel = async () => {
      try {
        setStatus("loading-model");
        const { pipeline, env } = await import("@huggingface/transformers");
        // Disable local models to fetch from HF hub
        env.allowLocalModels = false;
        
        const transcriber = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
          {
            progress_callback: (data: any) => {
              if (data.status === "progress") {
                setProgress(Math.round((data.loaded / data.total) * 100));
              }
            },
          }
        );
        pipelineRef.current = transcriber;
        setStatus("idle");
      } catch (err) {
        console.error("Error loading model", err);
        setStatus("error");
      }
    };
    loadModel();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTranscribe = async () => {
    if (!file || !pipelineRef.current) return;
    
    setTranscribing(true);
    setStatus("transcribing");
    setResult("");

    try {
      // Decode audio to 16kHz mono Float32Array
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const audioData = audioBuffer.getChannelData(0);

      const transcriber = pipelineRef.current;
      const output = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      setResult(output.text);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8 pt-20">
      <div className="text-center mb-12">
        <h1 className="md3-heading mb-4">Speech to Text</h1>
        <p className="text-blue-300/80 text-lg">Upload any audio file. Free local transcription.</p>
      </div>

      <div className="md3-card mb-8">
        <div className="border-2 border-dashed border-blue-700/50 rounded-2xl p-10 text-center hover:bg-blue-800/20 transition-colors">
          <input
            type="file"
            id="audio-upload"
            className="hidden"
            accept="audio/*"
            onChange={handleFileChange}
          />
          <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center">
            {file ? (
              <>
                <RiFileMusicLine size={48} className="text-blue-400 mb-4" />
                <span className="text-xl font-medium text-blue-100">{file.name}</span>
                <span className="text-blue-400/60 mt-1">Click to change</span>
              </>
            ) : (
              <>
                <RiUploadCloudLine size={48} className="text-blue-400 mb-4" />
                <span className="text-xl font-medium text-blue-100">Drop audio file here</span>
                <span className="text-blue-400/60 mt-1">or click to browse</span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="flex justify-center mb-12">
        <button
          onClick={handleTranscribe}
          disabled={!file || status === "loading-model" || transcribing}
          className="md3-button w-full md:w-auto md:min-w-[200px]"
        >
          {status === "loading-model" ? (
            <>
              <RiLoader4Line className="animate-spin" size={20} />
              Loading Model {progress}%
            </>
          ) : transcribing ? (
            <>
              <RiLoader4Line className="animate-spin" size={20} />
              Transcribing...
            </>
          ) : (
            <>
              <RiFileMusicLine size={20} />
              Transcribe Audio
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="md3-card animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4 text-blue-300">
            <RiCheckboxCircleLine size={24} className="text-green-400" />
            <h2 className="text-xl font-semibold">Transcription Complete</h2>
          </div>
          <div className="p-4 bg-blue-950/50 rounded-2xl text-blue-100 leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-900/50 text-center">
          An error occurred. Check the console.
        </div>
      )}
    </main>
  );
}
