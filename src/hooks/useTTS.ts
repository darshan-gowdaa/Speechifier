import { useState, useCallback, useRef, useEffect } from 'react';

export type TTSStatus = 'idle' | 'preparing' | 'playing' | 'paused' | 'done' | 'error';

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

// Module-level strong reference prevents Android GC bug that kills utterances
// eslint-disable-next-line prefer-const
let _currentUtterance: SpeechSynthesisUtterance | null = null;

/** Split text into chunks ≤ maxWords words so Android Chrome doesn't silently fail */
function chunkText(text: string, maxWords = 120): string[] {
  // Split on sentence boundaries first for natural pauses
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const prospective = (current + sentence).trim();
    if (prospective.split(/\s+/).length > maxWords && current.trim()) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

export function useTTS() {
  const [isSupported, setIsSupported]         = useState(false);
  const [status, setStatus]                   = useState<TTSStatus>('idle');
  const [errorMsg, setErrorMsg]               = useState('');
  const [voices, setVoices]                   = useState<TTSVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [rate, setRate]                       = useState(1);
  const [pitch, setPitch]                     = useState(1);
  const [progress, setProgress]               = useState(0);

  const defaultVoiceSetRef  = useRef(false);
  const chunksRef           = useRef<string[]>([]);
  const chunkIndexRef       = useRef(0);
  const stoppedRef          = useRef(false); // user manually stopped — abort chain
  const rateRef             = useRef(rate);
  const pitchRef            = useRef(pitch);
  const voiceURIRef         = useRef(selectedVoiceURI);

  // Keep voice/rate/pitch refs current without re-creating speak()
  useEffect(() => { rateRef.current  = rate;            }, [rate]);
  useEffect(() => { pitchRef.current = pitch;           }, [pitch]);
  useEffect(() => { voiceURIRef.current = selectedVoiceURI; }, [selectedVoiceURI]);

  // ── Load voices ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setIsSupported(true);

    const load = () => {
      const available = window.speechSynthesis.getVoices();
      if (!available.length) return;
      const mapped = available.map((v) => ({
        name: v.name, lang: v.lang, voiceURI: v.voiceURI,
      }));
      setVoices(mapped);
      if (!defaultVoiceSetRef.current) {
        defaultVoiceSetRef.current = true;
        const eng = mapped.find((v) => v.lang.startsWith('en'));
        if (eng) setSelectedVoiceURI(eng.voiceURI);
      }
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
      _currentUtterance = null;
    };
  }, []);

  // ── Speak one chunk ───────────────────────────────────────────────────────
  const speakChunk = useCallback((index: number) => {
    if (stoppedRef.current) return;
    const chunks = chunksRef.current;
    if (index >= chunks.length) {
      setStatus('done');
      setProgress(100);
      _currentUtterance = null;
      return;
    }

    const text      = chunks[index];
    const utterance = new SpeechSynthesisUtterance(text);
    _currentUtterance = utterance; // strong module-level ref prevents GC

    utterance.rate  = rateRef.current;
    utterance.pitch = pitchRef.current;

    const allVoices = window.speechSynthesis.getVoices();
    const voice     = allVoices.find((v) => v.voiceURI === voiceURIRef.current);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (!stoppedRef.current) setStatus('playing');
    };

    utterance.onend = () => {
      if (stoppedRef.current) return;
      const pct = Math.round(((index + 1) / chunks.length) * 100);
      setProgress(pct);
      // Small gap between chunks (Android fix)
      setTimeout(() => speakChunk(index + 1), 50);
    };

    utterance.onerror = (e) => {
      if (stoppedRef.current) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      setStatus('error');
      setErrorMsg(`Speech error: ${e.error}. Try a shorter document or a different browser.`);
      _currentUtterance = null;
    };

    chunkIndexRef.current = index;
    window.speechSynthesis.speak(utterance);
  }, []); // stable — reads from refs

  // ── Public: speak ─────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setStatus('error');
      setErrorMsg('Speech synthesis is not supported in this browser.');
      return;
    }
    if (!text.trim()) {
      setStatus('error');
      setErrorMsg('No text to read.');
      return;
    }

    // Cancel any in-flight speech first
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    _currentUtterance  = null;

    setStatus('preparing');
    setProgress(0);
    setErrorMsg('');

    // Android fix: small delay after cancel() before speaking
    setTimeout(() => {
      stoppedRef.current    = false;
      const chunks          = chunkText(text, 120);
      chunksRef.current     = chunks;
      chunkIndexRef.current = 0;
      speakChunk(0);
    }, 150);
  }, [speakChunk]);

  // ── Pause ─────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setStatus('paused');
  }, []);

  // ── Resume ────────────────────────────────────────────────────────────────
  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setStatus('playing');
  }, []);

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    _currentUtterance  = null;
    setStatus('idle');
    setProgress(0);
    setErrorMsg('');
  }, []);

  return {
    isSupported,
    status,
    errorMsg,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    progress,
    speak,
    pause,
    resume,
    stop,
  };
}
