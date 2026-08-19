"use client";

import { Inter, Instrument_Serif } from "next/font/google";
import { DetailedReader } from "@/components/organisms/DetailedReader";
import { PDFViewer } from "@/components/organisms/PDFViewer";
import { SiteHeader } from "@/components/molecules/SiteHeader";
import { HeroBanner } from "@/components/molecules/HeroBanner";
import { HeroVideo } from "@/components/molecules/HeroVideo";
import { PlayerCard } from "@/components/organisms/PlayerCard";
import { HomeUploader } from "@/components/organisms/HomeUploader";
import { useHomeLogic } from "@/hooks/useHomeLogic";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic" });

export default function Home() {
  const {
    mounted,
    selectedFile,
    extractedText,
    isDragging,
    setIsDragging,
    showReader,
    setShowReader,
    showUploader,
    setShowUploader,
    extractStatus,
    extractError,
    isExtracting,
    tts,
    handleFile,
    handleClear,
    handlePasteText,
  } = useHomeLogic();

  if (!mounted) return null;

  const fileExt = selectedFile?.name.split(".").pop()?.toLowerCase() as "pdf" | "docx" | "txt" | "md" | undefined;

  return (
    <div
      className={`vesper-root ${inter.className}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
    >
      <div className="grain"></div>
      
      <HeroVideo isDragging={isDragging} />

      <div className="page flex flex-col min-h-screen">
        <div className="menu-backdrop"></div>
        <SiteHeader
          hasFile={!!selectedFile}
          viewMode={showReader ? "detailed" : "simple"}
          onToggleView={(mode) => setShowReader(mode === "detailed")}
        />

        <main className="flex-1 flex w-full relative z-10 pt-16">
          {showReader && selectedFile ? (
            fileExt === "pdf" ? (
              <PDFViewer
                file={selectedFile}
                extractedText={extractedText}
                tts={tts}
                onClose={() => setShowReader(false)}
              />
            ) : (
              <DetailedReader
                text={extractedText}
                fileName={selectedFile.name}
                fileType={fileExt}
                tts={tts}
                onClose={() => setShowReader(false)}
              />
            )
          ) : (
            <div className="w-full flex flex-col items-center justify-center px-6 md:px-12 py-12">
              <div className="max-w-[800px] w-full mx-auto flex flex-col items-center justify-center">
                
                <div className={`flex flex-col items-center justify-center w-full ${selectedFile ? "hidden" : "block"}`}>
                  <HeroBanner isHidden={false} />
                  
                  <button 
                    onClick={() => setShowUploader(true)} 
                    className={`v-btn bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:scale-[1.02] hover:border-white/20 transition-all !h-[76px] w-full !max-w-[320px] rounded-[24px] !text-[36px] mt-16 shadow-[0_8px_32px_rgba(0,0,0,0.5)] appear appear--soft`}
                    style={{ "--d": "0.1s" } as React.CSSProperties}
                  >
                    <em className={instrument.className} style={{ fontStyle: "italic", letterSpacing: "-0.03em", fontWeight: 400 }}>Start</em>
                  </button>
                </div>

                <div className={`w-full relative z-50 mx-auto ${selectedFile ? "max-w-[860px] opacity-100 -translate-y-6" : "max-w-[500px] hidden"}`}>
                  {!tts.isSupported ? (
                    <div className="p-6 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                      TTS is not supported in this browser. Please use Chrome, Edge, or Safari.
                    </div>
                  ) : (
                    <>
                      {selectedFile && (
                        <PlayerCard
                          selectedFile={selectedFile}
                          extractedText={extractedText}
                          isExtracting={isExtracting}
                          extractStatus={extractStatus}
                          extractError={extractError}
                          tts={tts}
                          onClear={handleClear}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showUploader && !selectedFile && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={(e) => { if(e.target === e.currentTarget) setShowUploader(false); }}>
          <div className="w-full max-w-[640px] animate-in fade-in zoom-in-95 duration-300 ease-out">
            <HomeUploader
              isDragging={isDragging}
              isExtracting={isExtracting}
              onFileSelect={(f) => { handleFile(f); setShowUploader(false); }}
              onPasteText={handlePasteText}
            />
          </div>
        </div>
      )}
    </div>
  );
}