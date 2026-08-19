import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

interface Props {
  isHidden: boolean;
}

export function HeroBanner({ isHidden }: Props) {
  return (
    <div
      className={`v-hero w-full transition-all ease-out text-center flex flex-col items-center ${isHidden ? "max-h-0 opacity-0 duration-300 overflow-hidden" : "max-h-[1000px] opacity-100 duration-500 delay-100 !overflow-visible"}`}
      aria-hidden={isHidden}
    >
      <div className="badge appear appear--pop mb-6" style={{ "--d": "0.22s" } as React.CSSProperties}>
        Offline Text to Speech
      </div>

      <h1>
        <span className="headline-line">
          <span className="appear appear--mask" style={{ "--d": "0.42s" } as React.CSSProperties}>
            Listen to any <em className={`appear ${instrument.className}`} style={{ "--d": "0.72s" } as React.CSSProperties}>document</em>
          </span>
        </span>
        <span className="headline-line">
          <span className="appear appear--mask" style={{ "--d": "0.62s" } as React.CSSProperties}>
            offline in seconds.
          </span>
        </span>
      </h1>

      <p className="lede appear appear--soft mt-6 text-white/70 text-lg leading-relaxed [text-shadow:_0_2px_10px_rgb(0_0_0_/_80%)] mx-auto text-center" style={{ "--d": "0.82s", animationDuration: "1.25s" } as React.CSSProperties}>
        Drop your PDF, DOCX, MD, or TXT files and immediately turn them into natural-sounding speech right in your browser.
      </p>
    </div>
  );
}
