import { useState, useCallback } from 'react';
import { LANGUAGE_CONFIG } from '../constants';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = 'speechSynthesis' in window;

  const speak = useCallback((text: string, langName: string) => {
    if (!isSupported || !text) return;

    window.speechSynthesis.cancel();

    const langCode = LANGUAGE_CONFIG.find(l => l.name === langName)?.code || 'en';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isSupported };
};
