import { useState, useRef } from "react";
import { RiUploadCloud2Line, RiClipboardLine, RiLoader4Line } from "@remixicon/react";

interface Props {
  isDragging: boolean;
  isExtracting: boolean;
  onFileSelect: (file: File) => void;
  onPasteText: (text: string) => void;
}

const ACCEPTED = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export function HomeUploader({ isDragging, isExtracting, onFileSelect, onPasteText }: Props) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [pasteContent, setPasteContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (isExtracting) {
    return (
      <div className="w-full bg-black/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-8 flex flex-col items-center justify-center gap-4 min-h-[240px] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-[spin_3s_linear_infinite]" />
        <RiLoader4Line size={48} className="animate-spin text-white/80" />
        <span className="text-white/80 text-lg font-medium tracking-wide">Processing Document...</span>
      </div>
    );
  }

  return (
    <div className={`w-full bg-black/60 backdrop-blur-xl rounded-[28px] border border-white/10 p-2 flex flex-col shadow-2xl transition-all duration-300 ${isDragging ? "ring-2 ring-white/50 scale-[1.02]" : ""}`}>
      <div className="flex bg-black/40 rounded-[20px] p-1 mb-2">
        <button
          onClick={() => setMode("file")}
          className={`flex-1 h-10 rounded-[16px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2 ${mode === "file" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white hover:bg-white/5"}`}
        >
          <RiUploadCloud2Line size={16} /> Upload File
        </button>
        <button
          onClick={() => setMode("paste")}
          className={`flex-1 h-10 rounded-[16px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2 ${mode === "paste" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white hover:bg-white/5"}`}
        >
          <RiClipboardLine size={16} /> Paste Text
        </button>
      </div>

      <div className="p-4 md:p-8 min-h-[300px] flex flex-col">
        {mode === "file" ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelect(f);
                e.target.value = "";
              }}
            />
            <div
              onClick={() => inputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${isDragging ? "border-white/60 bg-white/5" : "border-white/20 bg-white/[0.02] hover:border-white/40 hover:bg-white/[0.04]"}`}
            >
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <RiUploadCloud2Line size={32} className="text-white/80" />
              </div>
              <div className="text-[17px] font-medium text-white mb-2">
                {isDragging ? "Drop it here!" : "Click to browse or drag file"}
              </div>
              <div className="text-[14px] text-white/40 text-center max-w-[300px]">
                Supports PDF, DOCX, TXT, and Markdown files up to 50MB
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your text here to read aloud..."
              className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white/90 text-[16px] outline-none focus:border-white/30 resize-none min-h-[220px]"
            />
            <div className="flex justify-end">
              <button
                disabled={!pasteContent.trim()}
                onClick={() => onPasteText(pasteContent)}
                className="v-btn bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed h-12 px-8 rounded-xl font-semibold text-[15px]"
              >
                Read Text
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
