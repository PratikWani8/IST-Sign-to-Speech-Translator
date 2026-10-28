import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechSynthesis = (defaultLang = 'en-IN') => {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const utteranceRef = useRef(null);

  // Load available speech synthesis voices
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);

    if (availableVoices.length > 0 && !selectedVoice) {
      // Prefer Indian English or Indian Hindi if available, otherwise default
      const preferred =
        availableVoices.find((v) => v.lang === defaultLang) ||
        availableVoices.find((v) => v.lang.startsWith('en')) ||
        availableVoices[0];
      setSelectedVoice(preferred);
      if (preferred) setSelectedLang(preferred.lang);
    }
  }, [defaultLang, selectedVoice]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      loadVoices();

      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [loadVoices]);

  const speak = useCallback(
    (text) => {
      if (!isSupported || !text || text.trim() === '') return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.lang = selectedLang || 'en-IN';
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.warn('SpeechSynthesis error:', event);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, selectedVoice, selectedLang, rate, pitch]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    selectedLang,
    setSelectedLang,
    rate,
    setRate,
    pitch,
    setPitch,
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
  };
};
