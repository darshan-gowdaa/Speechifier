import { useState, useCallback, useRef, useEffect } from 'react';

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'done' | 'error';

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

export function useTTS() {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [progress, setProgress] = useState(0); // 0–100
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef('');
  const charIndexRef = useRef(0);

  // Load voices — browsers load them async
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        const mapped = available.map((v) => ({
          name: v.name,
          lang: v.lang,
          voiceURI: v.voiceURI,
        }));
        setVoices(mapped);
        // Default: first English voice
        const english = mapped.find((v) => v.lang.startsWith('en'));
        if (english && !selectedVoiceURI) setSelectedVoiceURI(english.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) {
        setStatus('error');
        return;
      }

      // Cancel any in-progress speech
      window.speechSynthesis.cancel();

      textRef.current = text;
      charIndexRef.current = 0;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Set selected voice
      const allVoices = window.speechSynthesis.getVoices();
      const voice = allVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setStatus('playing');
      utterance.onend = () => {
        setStatus('done');
        setProgress(100);
      };
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') setStatus('error');
      };
      utterance.onboundary = (e) => {
        if (e.name === 'word' && text.length > 0) {
          charIndexRef.current = e.charIndex;
          setProgress(Math.round((e.charIndex / text.length) * 100));
        }
      };

      utteranceRef.current = utterance;
      setStatus('playing');
      setProgress(0);
      window.speechSynthesis.speak(utterance);
    },
    [rate, pitch, selectedVoiceURI]
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setStatus('playing');
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus('idle');
    setProgress(0);
  }, []);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  return {
    status,
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
    isSupported,
  };
}
