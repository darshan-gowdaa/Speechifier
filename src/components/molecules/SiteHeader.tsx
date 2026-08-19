import { RiSpeakFill, RiGithubFill } from "@remixicon/react";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

interface Props {
  hasFile?: boolean;
  viewMode?: "simple" | "detailed";
  onToggleView?: (v: "simple" | "detailed") => void;
}

export function SiteHeader({ hasFile, viewMode = "simple", onToggleView }: Props) {
  return (
    <header className={`fixed inset-x-0 top-0 z-[200] flex items-center justify-between px-4 sm:px-6 transition-all duration-300 h-16 ${viewMode === "detailed" ? "bg-black/60 backdrop-blur-xl border-b border-white/10" : "bg-transparent pointer-events-none"}`}>
      <div className={`logo appear appear--scale drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${viewMode === "simple" ? "pointer-events-auto" : ""}`} aria-label="Speechifier" style={{ "--d": "0.08s" } as React.CSSProperties}>
        <RiSpeakFill className="drop-shadow-lg" />
        <span className={`hidden sm:inline ${instrument.className} text-[1.2em] font-normal tracking-wide`}>Speechifier</span>
      </div>

      <nav aria-label="Primary" className={`flex items-center ${viewMode === "simple" ? "pointer-events-auto" : ""}`}>
        {hasFile && onToggleView ? (
          <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => onToggleView("simple")}
              className={`px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-md transition-all duration-300 ${viewMode === "simple" ? "bg-white/20 text-white shadow-sm cursor-default" : "text-white/70 hover:text-white cursor-pointer"}`}
            >
              Simple
            </button>
            <button
              onClick={() => onToggleView("detailed")}
              className={`px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-md transition-all duration-300 ${viewMode === "detailed" ? "bg-white/20 text-white shadow-sm cursor-default" : "text-white/70 hover:text-white cursor-pointer"}`}
            >
              Detailed
            </button>
          </div>
        ) : (
          <a href="https://github.com/darshan-gowdaa" target="_blank" rel="noopener noreferrer" className="nav-link appear appear--scale !px-3 sm:!px-4" style={{ "--d": "0.2s" } as React.CSSProperties}>
            <RiGithubFill size={18} className="sm:mr-2" />
            <span className="hidden sm:inline">By @darshan-gowdaa</span>
          </a>
        )}
      </nav>
    </header>
  );
}
