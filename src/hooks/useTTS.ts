import { useState, useCallback, useRef, useEffect } from 'react';

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'done' | 'error';

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

export function useTTS() {
  // Bug 1 fix: isSupported computed client-side only, starts false to match SSR
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [progress, setProgress] = useState(0);

  // Bug 3 fix: track whether default voice has been set, avoids dep cycle
  const defaultVoiceSetRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Bug 1 & 2 fix: all window access inside useEffect (client only)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setIsSupported(true);

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length === 0) return;

      const mapped: TTSVoice[] = available.map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
      }));
      setVoices(mapped);

      // Set default to first English voice, but only once
      if (!defaultVoiceSetRef.current) {
        defaultVoiceSetRef.current = true;
        const english = mapped.find((v) => v.lang.startsWith('en'));
        if (english) setSelectedVoiceURI(english.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []); // stable: no external deps needed

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const allVoices = window.speechSynthesis.getVoices();
      const voice = allVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setStatus('playing');
      utterance.onend = () => {
        setStatus('done');
        setProgress(100);
      };
      utterance.onerror = (e) => {
        // 'interrupted' fires on cancel() — not a real error
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          setStatus('error');
        }
      };
      utterance.onboundary = (e) => {
        if (e.name === 'word' && text.length > 0) {
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

  // Bug 4 note: Android Chrome pause() is often a no-op — best-effort
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

  return {
    isSupported,
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
  };
}
