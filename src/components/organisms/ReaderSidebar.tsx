import {
  RiPlayLine, RiPauseLine, RiStopLine,
  RiSpeedUpLine, RiVoiceprintLine, RiVoiceRecognitionLine,
  RiZoomInLine, RiZoomOutLine,
  RiArrowLeftSLine, RiArrowRightSLine,
  RiLayoutLine
} from "@remixicon/react";

interface TTSProps {
  status: string;
  rate: number;
  pitch: number;
  setRate: (r: number) => void;
  setPitch: (p: number) => void;
  voices: { name: string; lang: string; voiceURI: string }[];
  selectedVoiceURI: string;
  setSelectedVoiceURI: (v: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  speak: (text: string) => void;
}

interface Props {
  tts: TTSProps;
  textToSpeak: string;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  zoomStep: number;
  minZoom: number;
  maxZoom: number;
  // Optional pagination props for PDFViewer
  currentPage?: number;
  totalPages?: number;
  goToPage?: (n: number) => void;
}

export function ReaderSidebar({
  tts,
  textToSpeak,
  zoom,
  setZoom,
  zoomStep,
  minZoom,
  maxZoom,
  currentPage,
  totalPages,
  goToPage
}: Props) {
  const isPlaying = tts.status === "playing";
  const isPaused = tts.status === "paused";

  return (
    <div className="reader-sidebar bg-black/40 backdrop-blur-md border-l border-white/10 w-full md:w-[320px] shrink-0 overflow-y-auto flex flex-col p-6 gap-8">
      
      <div className="flex flex-col gap-3">
        <h3 className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-1">Playback</h3>
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button onClick={tts.pause} className="flex-1 bg-white text-black hover:bg-gray-200 h-12 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-colors shadow-lg">
              <RiPauseLine size={20} className="shrink-0" /> Pause
            </button>
          ) : (
            <button onClick={() => isPaused ? tts.resume() : tts.speak(textToSpeak)} className="flex-1 bg-white text-black hover:bg-gray-200 h-12 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-colors shadow-lg">
              <RiPlayLine size={20} className="shrink-0" /> Play
            </button>
          )}
          <button onClick={tts.stop} className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-12 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-colors shadow-lg">
            <RiStopLine size={20} className="shrink-0" /> Stop
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {goToPage && currentPage !== undefined && totalPages !== undefined && (
          <div>
            <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
              <span className="flex items-center gap-1.5"><RiLayoutLine size={16} /> Page</span>
            </div>
            <div className="flex items-center justify-between bg-black/40 border border-white/10 p-1.5 rounded-xl">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="flex items-center justify-center h-8 w-8 text-white hover:bg-white/10 rounded disabled:opacity-30 transition-colors"><RiArrowLeftSLine size={20} /></button>
              <span className="text-white text-[14px] font-medium tabular-nums">{currentPage} / {totalPages || "—"}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="flex items-center justify-center h-8 w-8 text-white hover:bg-white/10 rounded disabled:opacity-30 transition-colors"><RiArrowRightSLine size={20} /></button>
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
            <span className="flex items-center gap-1.5"><RiZoomInLine size={16} /> Zoom</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 p-1.5 rounded-xl">
            <button onClick={() => setZoom(z => Math.max(minZoom, parseFloat((z - zoomStep).toFixed(2))))} className="flex items-center justify-center h-8 w-8 text-white hover:bg-white/10 rounded transition-colors"><RiZoomOutLine size={20} /></button>
            <span className="text-white text-[14px] font-medium tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(maxZoom, parseFloat((z + zoomStep).toFixed(2))))} className="flex items-center justify-center h-8 w-8 text-white hover:bg-white/10 rounded transition-colors"><RiZoomInLine size={20} /></button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
            <span className="flex items-center gap-1.5"><RiSpeedUpLine size={16} /> Speed</span>
            <span>{tts.rate.toFixed(1)}x</span>
          </div>
          <input type="range" min="0.5" max="2" step="0.1" value={tts.rate} onChange={(e) => tts.setRate(Number(e.target.value))} className="w-full accent-white cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]" />
        </div>

        <div>
          <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
            <span className="flex items-center gap-1.5"><RiVoiceprintLine size={16} /> Pitch</span>
            <span>{tts.pitch.toFixed(1)}</span>
          </div>
          <input type="range" min="0.5" max="2" step="0.1" value={tts.pitch} onChange={(e) => tts.setPitch(Number(e.target.value))} className="w-full accent-white cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]" />
        </div>

        <div>
          <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
            <span className="flex items-center gap-1.5"><RiVoiceRecognitionLine size={16} /> Voice</span>
          </div>
          <select value={tts.selectedVoiceURI} onChange={(e) => tts.setSelectedVoiceURI(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white p-3.5 rounded-xl outline-none cursor-pointer hover:border-white/20 transition-colors text-[14px] shadow-inner">
            {tts.voices.map((v) => <option key={v.voiceURI} value={v.voiceURI} className="bg-[#111]">{v.name}</option>)}
          </select>
        </div>
      </div>
      
      <div className="flex-1" />
    </div>
  );
}
