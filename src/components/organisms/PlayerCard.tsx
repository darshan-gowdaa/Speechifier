import { StrandsVisualizer } from "@/components/atoms/Visualizer";
import {
  RiPlayLine, RiPauseLine, RiStopLine,
  RiSpeedUpLine, RiVoiceprintLine, RiVoiceRecognitionLine, RiTimerLine
} from "@remixicon/react";

interface TTSProps {
  status: string;
  currentWord: string;
  progress: number;
  rate: number;
  pitch: number;
  voices: { name: string; lang: string; voiceURI: string }[];
  selectedVoiceURI: string;
  setSelectedVoiceURI: (v: string) => void;
  setRate: (r: number) => void;
  setPitch: (p: number) => void;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (pct: number) => void;
}

interface Props {
  selectedFile: File;
  extractedText: string;
  isExtracting: boolean;
  extractStatus: string;
  extractError: string;
  tts: TTSProps;
  onClear: () => void;
}

export function PlayerCard({
  selectedFile, extractedText, isExtracting, extractStatus, extractError, tts, onClear
}: Props) {
  const hasText = extractedText.length > 0;

  return (
    <div className="w-full bg-black/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-6 md:p-8 flex flex-col relative shadow-2xl">
      <div className="flex justify-between items-center gap-4 mb-5 text-left">
        <div className="overflow-hidden">
          <div className="font-semibold text-white text-xl whitespace-nowrap overflow-hidden text-ellipsis">{selectedFile.name}</div>
          <div className="text-white/60 text-[15px] mt-1.5 flex items-center gap-2">
            {isExtracting ? "Reading file..." : tts.status === "playing" ? "Playing" : tts.status} (Space to pause)
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button onClick={onClear} className="v-btn btn-ghost-hero h-9 px-4 text-[14px]">Clear</button>
        </div>
      </div>

      {isExtracting ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <span className="appear text-white/60 text-lg flex items-center gap-2">
            <RiTimerLine size={20} className="animate-spin" /> Extracting text...
          </span>
        </div>
      ) : extractStatus === "error" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[200px]">
          <span className="text-red-400 font-medium text-lg">{extractError || "Failed to extract text."}</span>
        </div>
      ) : hasText ? (
        <div className="flex flex-col flex-1 gap-5">
          <StrandsVisualizer
            isActive={tts.status === "playing"}
            currentWord={tts.currentWord}
            pitch={tts.pitch}
            rate={tts.rate}
          />
          <div className="flex flex-wrap gap-3">
            {tts.status === "playing" ? (
              <button onClick={tts.pause} className="v-btn bg-white text-black hover:bg-gray-200 transition-colors flex-[1_1_120px] h-12 text-[16px] flex items-center justify-center gap-2">
                <RiPauseLine size={20} /> Pause
              </button>
            ) : (
              <button onClick={() => tts.status === "paused" ? tts.resume() : tts.speak(extractedText)} className="v-btn bg-white text-black hover:bg-gray-200 transition-colors flex-[1_1_120px] h-12 text-[16px] flex items-center justify-center gap-2">
                <RiPlayLine size={20} /> Play
              </button>
            )}
            <button onClick={tts.stop} className="v-btn bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 flex-[1_1_120px] h-12 text-[16px] flex items-center justify-center gap-2">
              <RiStopLine size={20} /> Stop
            </button>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between text-[13px] text-white/60 mb-3 uppercase tracking-wide font-medium">
                <span className="flex items-center gap-1.5"><RiTimerLine size={16} /> Progress</span>
                <span>{Math.round(tts.progress)}%</span>
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
                {tts.voices.map((v) => <option key={v.voiceURI} value={v.voiceURI} className="bg-[#111]">{v.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
