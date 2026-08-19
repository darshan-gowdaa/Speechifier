"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDocumentExtractor } from "../hooks/useDocumentExtractor";
import { useTTS } from "../hooks/useTTS";
import { M3LoadingIndicator } from "@alerix/m3-loading-indicator/react";
import { 
  RiUploadCloud2Line, RiFileTextLine, RiFileCopyLine, RiCheckLine, 
  RiDownloadLine, RiPlayFill, RiPauseFill, RiStopFill, RiRefreshLine
} from "@remixicon/react";

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { status: extractStatus, extract } = useDocumentExtractor();
  const tts = useTTS();

  const isExtracting = extractStatus === "extracting";
  const hasText = extractedText.length > 0;
  const wordCount = hasText ? extractedText.split(/\s+/).filter(Boolean).length : 0;

  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    if (!extractedText || !selectedFile) return;
    const blob = new Blob([extractedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) return;
    tts.stop();
    setSelectedFile(file);
    setExtractedText("");
    setCopied(false);
    try {
      const text = await extract(file);
      setExtractedText(text);
    } catch {}
  };

  if (mounted && !tts.isSupported) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="m3-shape-lg p-6 m3-error max-w-sm text-center">
          <p className="font-bold mb-2">TTS Not Supported</p>
          <p className="text-sm opacity-80">Use Chrome or Edge.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Hero */}
      <header className="text-center py-12 m3-shape-xl bg-indigo-50 dark:bg-zinc-900 shadow-sm border border-indigo-100 dark:border-zinc-800 transition-all">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-rose-400 mb-4">
          Speechifier
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-medium tracking-tight">
          Listen to PDF, DOCX, or TXT offline.
        </p>
      </header>

      {/* Upload Zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => !isExtracting && !selectedFile && inputRef.current?.click()}
        className={`m3-shape-xl p-12 flex flex-col items-center justify-center gap-6 transition-all duration-500 cursor-pointer border-2
          ${isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.02]" : selectedFile ? "border-transparent m3-surface-high cursor-default" : "border-dashed border-zinc-300 dark:border-zinc-700 m3-surface-low hover:border-indigo-400"}
        `}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleFile(f); e.target.value=""; }} disabled={isExtracting} />
        
        {isExtracting ? (
          <div className="flex flex-col items-center gap-4">
            <M3LoadingIndicator size={64} color="#6366f1" />
            <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide animate-pulse">Extracting...</p>
          </div>
        ) : selectedFile && hasText ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="p-5 rounded-[24px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <RiFileTextLine size={48} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 max-w-sm truncate">{selectedFile.name}</p>
              <p className="text-zinc-500 mt-1 font-medium">{wordCount.toLocaleString()} words</p>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="px-6 py-3 m3-shape-full m3-secondary font-bold">Change</button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setExtractedText(""); tts.stop(); }} className="px-6 py-3 m3-shape-full m3-surface-low border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 font-bold transition-colors">Clear</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-zinc-500 dark:text-zinc-400">
            <RiUploadCloud2Line size={56} className="text-indigo-400" />
            <p className="text-xl font-bold text-zinc-700 dark:text-zinc-300">Drop document or browse</p>
            <div className="flex gap-2">
              {["PDF", "DOCX", "TXT"].map(ext => (
                <span key={ext} className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-zinc-200 dark:bg-zinc-800">{ext}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TTS Controls & Preview */}
      {hasText && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="m3-shape-xl m3-surface-high p-8 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold tracking-tight">Playback</h2>
              <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-full ${tts.status === 'playing' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {tts.status}
              </span>
            </div>

            <div className="flex gap-4 flex-wrap">
              {(tts.status === 'idle' || tts.status === 'error' || tts.status === 'done') && (
                <button onClick={() => tts.speak(extractedText)} className="flex-1 m3-primary m3-shape-full py-4 flex items-center justify-center gap-2 font-bold text-lg">
                  <RiPlayFill size={24} /> Play
                </button>
              )}
              {tts.status === 'playing' && (
                <button onClick={tts.pause} className="flex-1 m3-secondary m3-shape-full py-4 flex items-center justify-center gap-2 font-bold text-lg">
                  <RiPauseFill size={24} /> Pause
                </button>
              )}
              {tts.status === 'paused' && (
                <button onClick={tts.resume} className="flex-1 m3-primary m3-shape-full py-4 flex items-center justify-center gap-2 font-bold text-lg">
                  <RiPlayFill size={24} /> Resume
                </button>
              )}
              {(tts.status === 'playing' || tts.status === 'paused') && (
                <button onClick={tts.stop} className="px-6 m3-surface-low border border-zinc-200 dark:border-zinc-700 m3-shape-full flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                  <RiStopFill size={24} className="text-rose-500" />
                </button>
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  <span>Speed</span>
                  <span className="text-indigo-500">{tts.rate.toFixed(1)}x</span>
                </div>
                <input type="range" min={0.5} max={2} step={0.1} value={tts.rate} onChange={(e) => tts.setRate(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  <span>Pitch</span>
                  <span className="text-indigo-500">{tts.pitch.toFixed(1)}</span>
                </div>
                <input type="range" min={0.5} max={2} step={0.1} value={tts.pitch} onChange={(e) => tts.setPitch(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            </div>

            {/* Voice Select */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Voice</label>
              <select value={tts.selectedVoiceURI} onChange={(e) => tts.setSelectedVoiceURI(e.target.value)} className="m3-shape-lg bg-zinc-100 dark:bg-zinc-800 p-4 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow">
                {tts.voices.length === 0 ? <option value="">System Default</option> : tts.voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
              </select>
            </div>
          </div>

          {/* Text Preview */}
          <div className="m3-shape-xl m3-surface-high p-8 flex flex-col max-h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight">Text</h2>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors" title="Copy">
                  {copied ? <RiCheckLine className="text-emerald-500" /> : <RiFileCopyLine />}
                </button>
                <button onClick={handleDownload} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors" title="Download">
                  <RiDownloadLine />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium p-4 bg-zinc-50 dark:bg-zinc-900/50 m3-shape-lg flex-1 whitespace-pre-wrap">
              {extractedText}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
