import React, { useState, useEffect, useRef } from 'react';
import type { TranslationResult, Flashcard } from '../types';
import { SUPPORTED_LANGUAGES, LANGUAGE_CONFIG } from '../constants';
import { translateText, translateImage } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Loader2, Mic, Image as ImageIcon, Copy, ArrowRight, Save, RotateCcw, X, Languages } from 'lucide-react';

interface TranslationViewProps {
  onSaveFlashcard: (card: Omit<Flashcard, 'id' | 'timestamp'>) => void;
  targetLang: string;
  setTargetLang: (lang: string) => void;
}

const TranslationView: React.FC<TranslationViewProps> = ({ onSaveFlashcard, targetLang, setTargetLang }) => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('Auto Detect');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Determine the language code for Speech Recognition
  const sttLangCode = LANGUAGE_CONFIG.find(l => l.name === sourceLang)?.code || 'en-US';
  
  const { isListening, transcript, startListening, stopListening, error: speechError, setTranscript } = useSpeechRecognition(sttLangCode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync speech transcript to input
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleTranslate = async () => {
    if ((!inputText && !selectedImage) || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      let translationResult: TranslationResult;

      if (selectedImage) {
        translationResult = await translateImage(selectedImage, targetLang);
      } else {
        translationResult = await translateText(inputText, targetLang, sourceLang);
      }

      setResult(translationResult);
    } catch (error) {
      console.error(error);
      alert("Translation failed. Please check your API key and connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear text input when image is selected to avoid confusion
      setInputText('');
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveToFlashcards = () => {
    if (result) {
      onSaveFlashcard({
        original: result.originalText,
        translated: result.translatedText,
        sourceLang: result.detectedSourceLanguage || sourceLang,
        targetLang: targetLang,
      });
      alert("Saved to Flashcards!");
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 gap-6">
      {/* Header / Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Languages className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-semibold text-slate-200">Target Language</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="flex-1 md:w-64 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <button
            onClick={handleTranslate}
            disabled={isLoading || (!inputText && !selectedImage)}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Translate"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Input Section */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-96 shadow-sm overflow-hidden relative">
            <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                 <span className="text-sm font-medium text-slate-400 uppercase tracking-wider hidden sm:block mr-2">Source</span>
                 <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                 >
                    <option value="Auto Detect">Auto Detect</option>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                 </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectedImage ? clearImage : () => { setInputText(''); setTranscript(''); }}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Clear"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              {selectedImage ? (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-slate-900/50 relative">
                  <img src={imagePreview!} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-slate-900/80 p-2 rounded-full hover:bg-red-500/80 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={sourceLang === 'Auto Detect' ? "Type text or use voice (English default)..." : `Type text or use voice (${sourceLang})...`}
                  className="w-full h-full bg-transparent p-4 resize-none outline-none text-lg text-slate-100 placeholder:text-slate-600"
                />
              )}
            </div>

            {/* Input Actions Toolbar */}
            <div className="p-3 bg-slate-800/80 border-t border-slate-700 flex gap-2 items-center">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-3 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/20' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={sourceLang === 'Auto Detect' ? "Voice Input (English)" : `Voice Input (${sourceLang})`}
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-full transition-all ${
                    selectedImage
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Upload Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              
              <div className="flex-1" />
              {speechError && <span className="text-xs text-red-400">{speechError}</span>}
              <div className="text-xs text-slate-500 px-2">
                {inputText.length} chars
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-96 shadow-sm overflow-hidden relative">
             <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Translation</span>
              {result && (
                <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">
                    {result.detectedSourceLanguage || 'Detected'} <ArrowRight className="w-3 h-3 inline mx-1" /> {targetLang}
                </span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-900/30">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="animate-pulse">Translating...</p>
                </div>
              ) : result ? (
                <div className="flex flex-col gap-6">
                  <div>
                     <p className="text-xl leading-relaxed text-slate-100 font-medium">{result.translatedText}</p>
                  </div>
                  {result.detectedSourceLanguage === 'Image Text' && (
                     <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1 uppercase">Original Text Detected</p>
                        <p className="text-sm text-slate-400 italic bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            {result.originalText}
                        </p>
                     </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
                  Translation will appear here
                </div>
              )}
            </div>

             <div className="p-3 bg-slate-800/80 border-t border-slate-700 flex gap-2 justify-end">
               {result && (
                 <>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(result.translatedText);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button
                        onClick={handleSaveToFlashcards}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" /> Save Flashcard
                    </button>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationView;
