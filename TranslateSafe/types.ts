export enum AppTab {
  TRANSLATE = 'TRANSLATE',
  FLASHCARDS = 'FLASHCARDS',
}

export interface Flashcard {
  id: string;
  original: string;
  translated: string;
  sourceLang?: string;
  targetLang: string;
  timestamp: number;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedSourceLanguage?: string;
}

export enum TranslationMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
}
