
export const LANGUAGE_CONFIG = [
  { name: "English", code: "en-US" },
  { name: "Mandarin Chinese", code: "zh-CN" },
  { name: "Hindi", code: "hi-IN" },
  { name: "Spanish", code: "es-ES" },
  { name: "French", code: "fr-FR" },
  { name: "Arabic", code: "ar-SA" },
  { name: "Bengali", code: "bn-IN" },
  { name: "Portuguese", code: "pt-PT" },
  { name: "Russian", code: "ru-RU" },
  { name: "German", code: "de-DE" }
];

export const SUPPORTED_LANGUAGES = LANGUAGE_CONFIG.map(l => l.name);

export const LOCAL_STORAGE_KEY = 'lingua_gemini_flashcards';
