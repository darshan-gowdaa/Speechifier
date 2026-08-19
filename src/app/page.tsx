"use client";

import { useState, useEffect, useRef } from "react";
import { Inter, Instrument_Serif } from "next/font/google";
import { useDocumentExtractor } from "@/hooks/useDocumentExtractor";
import { useTTS } from "@/hooks/useTTS";
import { StrandsVisualizer } from "@/components/atoms/Visualizer";
import { RiGithubFill, RiSpeakFill, RiPlayLine, RiPauseLine, RiStopLine, RiSpeedUpLine, RiVoiceprintLine, RiVoiceRecognitionLine, RiTimerLine } from "@remixicon/react";


const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

const ACCEPTED = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { status: extractStatus, error: extractError, extract } = useDocumentExtractor();
  const tts = useTTS();
  const isExtracting = extractStatus === "extracting";
  const hasText = extractedText.length > 0;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (menuOpen) document.body.classList.add('menu-open');
    else document.body.classList.remove('menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const appears = document.querySelectorAll('.appear, .badge-star, h1 em');
    const handleEnd = (e: Event) => (e.target as Element).classList.add('is-in');
    appears.forEach(el => el.addEventListener('animationend', handleEnd, { once: true }));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const isRunning = Array.from(appears).some(el => el.getAnimations().some(a => a.playState === 'running' || a.playState === 'finished'));
        if (!isRunning) document.querySelectorAll('.appear, .hero-photo, .badge-star, h1 em').forEach(el => el.classList.add('is-in'));
      });
    });

    const handleResize = () => { if (window.innerWidth >= 901) setMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => {
      appears.forEach(el => el.removeEventListener('animationend', handleEnd));
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
      // play pause with spacebar
      if (e.key === ' ' && e.target === document.body && hasText) {
        e.preventDefault();
        if (tts.status === 'playing') tts.pause();
        else if (tts.status === 'paused') tts.resume();
        else if (tts.status === 'idle') tts.speak(extractedText);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuOpen, hasText, tts, extractedText]);

  const handleFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) return;
    tts.stop();
    setSelectedFile(file);
    setExtractedText("");
    try {
      const text = await extract(file);
      setExtractedText(text);
      tts.speak(text);
    } catch {}
  };

  if (!mounted) return null;

  return (
    <div
      className={`vesper-root ${inter.className}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if(f) handleFile(f); }}
    >
      <div className="grain"></div>
      <div className={`hero-video-wrapper transition-opacity duration-300 ${isDragging ? 'opacity-30' : 'opacity-100'}`}>
        <video className="hero-photo anim-fade-in" autoPlay loop muted playsInline>
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="page">
        <div className="menu-backdrop"></div>
        <header className="vesper-header">
          <div className="logo appear appear--scale" aria-label="Speechifier" style={{ "--d": "0.08s" } as React.CSSProperties}>
            <RiSpeakFill />
            <span>Speechifier</span>
          </div>

          <nav id="site-nav" aria-label="Primary">
            <a href="https://github.com/darshan-gowdaa" target="_blank" rel="noopener noreferrer" className="nav-link appear appear--scale" style={{ "--d": "0.2s" } as React.CSSProperties}>
              <RiGithubFill size={18} className="mr-2" />
              By @darshan-gowdaa
            </a>
          </nav>
        </header>

        <main className="v-hero" id="top">
          <div className="hero-copy">
            <div
              className={`w-full overflow-hidden transition-all ease-out ${selectedFile ? 'max-h-0 opacity-0 duration-300' : 'max-h-[420px] opacity-100 duration-500 delay-100'}`}
              aria-hidden={!!selectedFile}
            >
              <div className="badge appear appear--pop" style={{ "--d": "0.22s" } as React.CSSProperties}>
                Offline Text to Speech
              </div>

              <h1>
                <span className="headline-line"><span className="appear appear--mask" style={{ "--d": "0.42s" } as React.CSSProperties}>Listen to any <em className={`appear ${instrument.className}`} style={{ "--d": "0.72s" } as React.CSSProperties}>document</em></span></span>
                <span className="headline-line"><span className="appear appear--mask" style={{ "--d": "0.62s" } as React.CSSProperties}>offline in seconds.</span></span>
              </h1>

              <p className="lede appear appear--soft text-center mx-auto [text-shadow:_0_2px_10px_rgb(0_0_0_/_80%)]" style={{ "--d": "0.82s", animationDuration: "1.25s" } as React.CSSProperties}>
                Drop your PDF, DOCX, or TXT files and immediately turn them into natural-sounding speech right in your browser.
              </p>
            </div>

            <div className={`appear appear--soft w-full px-4 md:px-8 relative z-50 opacity-100 transition-all duration-500 mx-auto ${selectedFile ? 'max-w-[860px] mt-4' : 'max-w-[440px] mt-10'}`} style={{ "--d": "0.96s" } as React.CSSProperties}>
              {!tts.isSupported ? (
                <div className="p-6 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                  TTS is not supported in this browser. Please use Chrome, Edge, or Safari.
                </div>
              ) : (
                <>
                  <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleFile(f); e.target.value=""; }} disabled={isExtracting} />

                  {!selectedFile ? (
                <button
                  onClick={() => inputRef.current?.click()}
                  className={`v-btn w-full h-14 text-[15px] font-medium rounded-xl bg-white text-black z-50 shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:bg-gray-100 transition-colors ${isDragging ? 'border-2 border-dashed border-white' : ''}`}
                >
                  {isExtracting ? 'Extracting...' : isDragging ? 'Drop file here' : 'Upload Document'}
                </button>
              ) : (
                <div className="w-full bg-black/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-6 md:p-8 flex flex-col relative shadow-2xl">
                  <div className="flex justify-between items-center gap-4 mb-5 text-left">
                    <div className="overflow-hidden">
                      <div className="font-semibold text-white text-xl whitespace-nowrap overflow-hidden text-ellipsis">{selectedFile.name}</div>
                      <div className="text-white/60 text-[15px] mt-1.5 flex items-center gap-2">
                        {isExtracting ? 'Reading file...' : tts.status === 'playing' ? 'Playing' : tts.status} (Space to pause)
                      </div>
                    </div>
                    <button onClick={() => { setSelectedFile(null); setExtractedText(""); tts.stop(); }} className="v-btn btn-ghost-hero h-10 px-4 text-[15px] flex-shrink-0">Clear</button>
                  </div>

                  {isExtracting ? (
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <span className="appear text-white/60 text-lg flex items-center gap-2">
                        <RiTimerLine size={20} className="animate-spin" /> Extracting text...
                      </span>
                    </div>
                  ) : extractStatus === 'error' ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                      <span className="text-red-400 font-medium text-lg">{extractError || 'Failed to extract text. Please ensure it is a valid PDF or DOCX file.'}</span>
                    </div>
                  ) : hasText ? (
                    <div className="flex flex-col flex-1 gap-5">
                      <StrandsVisualizer
                        isActive={tts.status === 'playing'}
                        currentWord={tts.currentWord}
                        pitch={tts.pitch}
                        rate={tts.rate}
                      />
                      <div className="flex flex-wrap gap-3">
                        {tts.status === 'playing' ? (
                          <button onClick={tts.pause} className="v-btn bg-white text-black hover:bg-gray-200 transition-colors flex-[1_1_120px] h-12 text-[16px] flex items-center justify-center gap-2">
                            <RiPauseLine size={20} /> Pause
                          </button>
                        ) : (
                          <button onClick={() => tts.status === 'paused' ? tts.resume() : tts.speak(extractedText)} className="v-btn bg-white text-black hover:bg-gray-200 transition-colors flex-[1_1_120px] h-12 text-[16px] flex items-center justify-center gap-2">
                            <RiPlayLine size={20} /> Play
                          </button>
                        )}
                        <button onClick={tts.stop} className="v-btn btn-ghost-hero flex-[1_1_120px] h-12 text-[16px] flex items-center justify-center gap-2">
                          <RiStopLine size={20} /> Stop
                        </button>
                      </div>

                      <div className="flex flex-col gap-5">
                        <div>
                          <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
                            <span className="flex items-center gap-1.5"><RiTimerLine size={16} /> Progress</span>
                            <span>{tts.progress}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={tts.progress} onChange={(e) => tts.seek(Number(e.target.value))} className="w-full accent-white cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]" />
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-5">
                          <div className="flex-[1_1_140px]">
                            <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
                              <span className="flex items-center gap-1.5"><RiSpeedUpLine size={16} /> Speed</span>
                              <span>{tts.rate.toFixed(1)}x</span>
                            </div>
                            <input type="range" min="0.5" max="2" step="0.1" value={tts.rate} onChange={(e) => tts.setRate(Number(e.target.value))} className="w-full accent-white cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]" />
                          </div>
                          <div className="flex-[1_1_140px]">
                            <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
                              <span className="flex items-center gap-1.5"><RiVoiceprintLine size={16} /> Pitch</span>
                              <span>{tts.pitch.toFixed(1)}</span>
                            </div>
                            <input type="range" min="0.5" max="2" step="0.1" value={tts.pitch} onChange={(e) => tts.setPitch(Number(e.target.value))} className="w-full accent-white cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]" />
                          </div>
                        </div>

                        <div>
                           <div className="text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium text-left flex items-center gap-1.5">
                             <RiVoiceRecognitionLine size={16} /> Voice
                           </div>
                           <select value={tts.selectedVoiceURI} onChange={(e) => tts.setSelectedVoiceURI(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white p-3.5 rounded-xl outline-none cursor-pointer hover:border-white/20 transition-colors text-[15px] shadow-inner">
                             {tts.voices.map(v => <option key={v.voiceURI} value={v.voiceURI} className="bg-[#111]">{v.name}</option>)}
                           </select>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}