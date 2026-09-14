import { useCallback } from 'react';

/**
 * Wraps the browser's Web Speech API so reminders can be spoken aloud -
 * "Time to take your medicine" - which matters most for low-literacy or
 * visually impaired patients. Falls back silently if unsupported.
 */
export function useVoiceReminder(language = 'en-US') {
  const speak = useCallback(
    (text) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); // don't stack overlapping announcements
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  return { speak };
}
