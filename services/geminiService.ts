import { GoogleGenAI, Type } from "@google/genai";
import type { TranslationResult } from "../types";

// Helper to check if key is valid for UI states
export const validateApiKey = (): boolean => {
  // Access process.env.API_KEY directly. Vite replaces this token with the string value.
  // We check if it exists and is not empty.
  // @ts-ignore
  const key = process.env.API_KEY;
  return !!key && key.length > 0;
};

const getAiClient = () => {
  // @ts-ignore
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please check your .env file.");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang: string = "Auto Detect"
): Promise<TranslationResult> => {
  const ai = getAiClient();

  // Construct source language instruction
  const sourceInstruction = sourceLang === "Auto Detect"
    ? "Identify the source language automatically."
    : `The source language is ${sourceLang}.`;

  const prompt = `Translate the following text to ${targetLang}. 
  ${sourceInstruction}
  Return a JSON object with:
  - originalText: the input text
  - translatedText: the translation
  - detectedSourceLanguage: the name of the source language (if auto-detected, otherwise use the provided source language)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt + `\n\nText: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            translatedText: { type: Type.STRING },
            detectedSourceLanguage: { type: Type.STRING },
          },
          required: ["originalText", "translatedText"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      originalText: result.originalText || text,
      translatedText: result.translatedText || '',
      detectedSourceLanguage: result.detectedSourceLanguage,
    };
  } catch (error) {
    console.error("Text translation error details:", error);
    throw error;
  }
};

export const translateImage = async (
  file: File,
  targetLang: string
): Promise<TranslationResult> => {
  const ai = getAiClient();

  const base64Data = await fileToGenerativePart(file);

  const prompt = `Identify the text in this image.
  1. Extract the text found in the image exactly.
  2. Translate that text to ${targetLang}.
  
  Return a JSON object with:
  - originalText: the extracted text
  - translatedText: the translation
  - detectedSourceLanguage: the detected language of the text
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             originalText: { type: Type.STRING },
             translatedText: { type: Type.STRING },
             detectedSourceLanguage: { type: Type.STRING },
          },
           required: ["originalText", "translatedText"],
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      originalText: result.originalText || "No text detected",
      translatedText: result.translatedText || "Translation failed",
      detectedSourceLanguage: result.detectedSourceLanguage || 'Image Text',
    };

  } catch (error) {
    console.error("Image translation error details:", error);
    throw error;
  }
};

const fileToGenerativePart = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
