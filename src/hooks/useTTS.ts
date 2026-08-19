import { useState, useCallback, useRef, useEffect } from 'react';

export type TTSStatus = 'idle' | 'preparing' | 'playing' | 'paused' | 'done' | 'error';

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

// clean up internet text and pdf artifacts so the native tts engine doesn't stutter
const ttsState = { currentUtterance: null as SpeechSynthesisUtterance | null };

function normalizeText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/g, ' ') // strip urls
    .replace(/\bDr\./gi, 'Doctor')
    .replace(/\bMr\./gi, 'Mister')
    .replace(/\bMrs\./gi, 'Missus')
    .replace(/\bMs\./gi, 'Miss')
    .replace(/\bProf\./gi, 'Professor')
    .replace(/&/g, ' and ')
    .replace(/[\u2018\u2019]/g, "'") // smart quotes
    .replace(/[\u201C\u201D]/g, '"') // smart quotes
    .replace(/[\u2013\u2014]/g, ' - ') // em dashes
    .replace(/[\r\n]+/g, ' ') // remove stray linebreaks
    .replace(/\s{2,}/g, ' ') // collapse whitespace
    .trim();
}

// detect language using lightweight n-gram stopword heuristic
function detectLanguage(text: string): string {
  const sample = text.slice(0, 1000).toLowerCase();
  const scores = {
    'en': (sample.match(/\b(the|is|in|and|of|to|a)\b/g) || []).length,
    'es': (sample.match(/\b(el|la|en|y|de|que|los)\b/g) || []).length,
    'fr': (sample.match(/\b(le|la|en|et|de|qui|les)\b/g) || []).length,
    'de': (sample.match(/\b(der|die|das|und|in|zu)\b/g) || []).length,
    'it': (sample.match(/\b(il|la|in|e|di|che|le)\b/g) || []).length,
  };
  
  let best = 'en';
  let max = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > max) { max = score; best = lang; }
  }
  return best;
}

// split text intelligently on natural prosody boundaries (commas, periods)
function chunkText(text: string, maxWords = 35): string[] {
  const clean = normalizeText(text);
  // split by strong punctuation first
  const sentences = clean.match(/[^.!?]+[.!?]*/g) ?? [clean];
  const chunks: string[] = [];
  
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length <= maxWords) {
      chunks.push(sentence.trim());
      continue;
    }
    
    // if sentence is too long, slice it beautifully by commas or conjunctions
    let currentChunk = [];
    for (const word of words) {
      currentChunk.push(word);
      if (currentChunk.length >= maxWords * 0.75 && (word.endsWith(',') || word.endsWith(';') || /^(and|but|or|so)$/i.test(word))) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      } else if (currentChunk.length >= maxWords) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }
    if (currentChunk.length) chunks.push(currentChunk.join(' '));
  }
  return chunks.filter(Boolean);
}

export function useTTS() {
  const [isSupported]                         = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [status, setStatus]                   = useState<TTSStatus>('idle');
  const [errorMsg, setErrorMsg]               = useState('');
  const [voices, setVoices]                   = useState<TTSVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [rate, setRate]                       = useState(1.15); // reading speed
  const [pitch, setPitch]                     = useState(0.7);
  const [progress, setProgress]               = useState(0);
  const [currentWord, setCurrentWord]         = useState('');

  const defaultVoiceSetRef  = useRef(false);
  const chunksRef           = useRef<string[]>([]);
  const chunkIndexRef       = useRef(0);
  const stoppedRef          = useRef(false);
  const rateRef             = useRef(rate);
  const pitchRef            = useRef(pitch);
  const voiceURIRef         = useRef(selectedVoiceURI);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef         = useRef<any>(null);
  const silentAudioRef      = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // silent audio for mobile background play
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audio.loop = true;
    audio.volume = 0.01;
    silentAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch {}
      wakeLockRef.current = null;
    }
    if (silentAudioRef.current) silentAudioRef.current.pause();
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!wakeLockRef.current && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch {}
    }
    if (silentAudioRef.current) {
      try { await silentAudioRef.current.play(); } catch {}
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restartTimeoutRef   = useRef<any>(null);
  const currentCharIndexRef = useRef(0);

  // play next part
  const speakChunk = useCallback(function speakChunk(index: number, offset: number = 0) {
    if (stoppedRef.current) return;
    const chunks = chunksRef.current;
    if (index >= chunks.length) {
      setStatus('done');
      setProgress(100);
      setCurrentWord('');
      ttsState.currentUtterance = null;
      releaseWakeLock();
      return;
    }

    const originalText = chunks[index];
    const text         = originalText.substring(offset);
    const utterance    = new SpeechSynthesisUtterance(text);
    ttsState.currentUtterance = utterance;

    utterance.rate  = rateRef.current;
    utterance.pitch = pitchRef.current;
    utterance.volume = 1.0;

    const allVoices = window.speechSynthesis.getVoices();
    const voice     = allVoices.find((v) => v.voiceURI === voiceURIRef.current);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (!stoppedRef.current) {
        setStatus('playing');
        requestWakeLock();
      }
    };

    utterance.onboundary = (e) => {
      if (stoppedRef.current) return;
      if (e.name === 'word') {
        const trueCharIndex = e.charIndex + offset;
        currentCharIndexRef.current = trueCharIndex;

        // track word progress
        const basePct = (index / chunks.length) * 100;
        const chunkPct = (trueCharIndex / originalText.length) * (100 / chunks.length);
        setProgress(Math.round(basePct + chunkPct));

        const substr = originalText.substring(trueCharIndex);
        const match = substr.match(/^[^\s.,!?]+/);
        if (match) setCurrentWord(match[0]);
      }
    };

    utterance.onend = () => {
      if (stoppedRef.current) return;
      const pct = Math.round(((index + 1) / chunks.length) * 100);
      setProgress(pct);
      currentCharIndexRef.current = 0;
      setTimeout(() => speakChunk(index + 1, 0), 30);
    };

    utterance.onerror = (e) => {
      if (stoppedRef.current) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      setStatus('error');
      setErrorMsg(`Speech error: ${e.error}. Try a shorter document or a different browser.`);
      ttsState.currentUtterance = null;
      releaseWakeLock();
    };

    chunkIndexRef.current = index;
    window.speechSynthesis.speak(utterance);
  }, [releaseWakeLock, requestWakeLock]);

  useEffect(() => {
    const changed = rateRef.current !== rate || pitchRef.current !== pitch || voiceURIRef.current !== selectedVoiceURI;
    rateRef.current  = rate;
    pitchRef.current = pitch;
    voiceURIRef.current = selectedVoiceURI;
    if (changed && window.speechSynthesis.speaking && !stoppedRef.current) {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        window.speechSynthesis.cancel();
        setTimeout(() => speakChunk(chunkIndexRef.current, currentCharIndexRef.current), 50);
      }, 400); // wait before restart
    }
  }, [rate, pitch, selectedVoiceURI, speakChunk]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const load = () => {
      const available = window.speechSynthesis.getVoices();
      if (!available.length) return false;
      const mapped = available.map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
      
      // put good voices first
      mapped.sort((a, b) => {
        const aEng = a.lang.startsWith('en') ? -1 : 1;
        const bEng = b.lang.startsWith('en') ? -1 : 1;
        if (aEng !== bEng) return aEng - bEng;
        
        // female voices first
        const isPremium = (name: string) => /female|woman|girl|samantha|zira|karen|siri|google|premium|natural/i.test(name) ? -1 : 1;
        const aPrem = isPremium(a.name);
        const bPrem = isPremium(b.name);
        if (aPrem !== bPrem) return aPrem - bPrem;

        return a.name.localeCompare(b.name);
      });
      
      setVoices(mapped);
      
      if (!defaultVoiceSetRef.current) {
        defaultVoiceSetRef.current = true;
        if (mapped[0]) setSelectedVoiceURI(mapped[0].voiceURI);
      }
      return true;
    };

    if (!load()) {
      const poll = setInterval(() => { if (load()) clearInterval(poll); }, 500);
      window.speechSynthesis.addEventListener('voiceschanged', load);
      return () => {
        clearInterval(poll);
        window.speechSynthesis.removeEventListener('voiceschanged', load);
        window.speechSynthesis.cancel();
        ttsState.currentUtterance = null;
      };
    }

    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
      ttsState.currentUtterance = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setStatus('error');
      setErrorMsg('Not supported.');
      return;
    }
    if (!text.trim()) return;

    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    ttsState.currentUtterance  = null;

    setStatus('preparing');
    setProgress(0);
    setErrorMsg('');

    setTimeout(() => {
      stoppedRef.current = false;
      
      const lang = detectLanguage(text);
      if (voices.length > 0) {
        const match = voices.find(v => v.lang.toLowerCase().startsWith(lang));
        if (match && !selectedVoiceURI.includes(match.voiceURI)) {
          setSelectedVoiceURI(match.voiceURI);
          voiceURIRef.current = match.voiceURI;
        }
      }

      chunksRef.current = chunkText(text, 35);
      chunkIndexRef.current = 0;
      speakChunk(0);
    }, 150);
  }, [speakChunk]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setStatus('paused');
    releaseWakeLock();
  }, [releaseWakeLock]);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setStatus('playing');
    requestWakeLock();
  }, [requestWakeLock]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    ttsState.currentUtterance  = null;
    setStatus('idle');
    setProgress(0);
    setErrorMsg('');
    releaseWakeLock();
  }, [releaseWakeLock]);

  const seek = useCallback((pct: number) => {
    if (!chunksRef.current.length) return;
    const targetIndex = Math.max(0, Math.min(chunksRef.current.length - 1, Math.floor((pct / 100) * chunksRef.current.length)));
    chunkIndexRef.current = targetIndex;
    setProgress(pct);
    
    if (status === 'playing' || status === 'paused') {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        window.speechSynthesis.cancel();
        ttsState.currentUtterance = null;
        stoppedRef.current = false;
        setTimeout(() => speakChunk(targetIndex), 50);
      }, 400); // wait for slider stop
    }
  }, [status, speakChunk]);

  // clear wakelock
  useEffect(() => { return () => { releaseWakeLock(); }; }, [releaseWakeLock]);

  return { isSupported, status, errorMsg, voices, selectedVoiceURI, setSelectedVoiceURI, rate, setRate, pitch, setPitch, progress, currentWord, speak, pause, resume, stop, seek };
}
