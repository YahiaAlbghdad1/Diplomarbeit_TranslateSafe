import React, { useState, useEffect } from 'react';
import { AppTab, type Flashcard } from './types';
import { LOCAL_STORAGE_KEY, SUPPORTED_LANGUAGES } from './constants';
import { validateApiKey } from './services/geminiService';
import TranslationView from './components/TranslationView';
import FlashcardsView from './components/FlashcardsView';
import { Sparkles, Library, Globe2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TRANSLATE);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(SUPPORTED_LANGUAGES[0]);

  // @ts-ignore
  const envApiKey = process.env.API_KEY;

  useEffect(() => {
    // Check for API key on mount
    const isValid = validateApiKey();
    setHasApiKey(isValid);
    
    // Load saved cards
    loadCards();

    // 1. Listen for Save events from Extension
    const handleExternalUpdate = () => {
        loadCards();
        setNotification("Flashcards synced from Extension!");
        setTimeout(() => setNotification(null), 3000);
    };

    // 2. Listen for Language changes from Extension
    const handleConfigUpdate = (e: CustomEvent) => {
        if (e.detail?.targetLang) {
            setTargetLang(e.detail.targetLang);
        }
    };

    window.addEventListener('lingua-gemini-update', handleExternalUpdate);
    window.addEventListener('lingua-gemini-config-update', handleConfigUpdate as EventListener);

    return () => {
        window.removeEventListener('lingua-gemini-update', handleExternalUpdate);
        window.removeEventListener('lingua-gemini-config-update', handleConfigUpdate as EventListener);
    };
  }, []);

  const loadCards = () => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setFlashcards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load flashcards", e);
      }
    }
  };

  const saveFlashcard = (cardData: Omit<Flashcard, 'id' | 'timestamp'>) => {
    const newCard: Flashcard = {
      ...cardData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const updated = [newCard, ...flashcards];
    setFlashcards(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteFlashcard = (id: string) => {
    const updated = flashcards.filter(c => c.id !== id);
    setFlashcards(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
        
      {/* Hidden Bridge for Extension to Scrape/Inject Data */}
      {hasApiKey && (
          <div 
            id="lingua-gemini-bridge" 
            data-api-key={envApiKey}
            data-target-lang={targetLang}
            style={{ display: 'none' }} 
            aria-hidden="true" 
          />
      )}

      <div className="w-full min-h-screen flex flex-col bg-slate-900">
        
        {/* Navbar */}
        <header className="flex flex-col border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          {!hasApiKey && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-xs md:text-sm text-red-400 flex items-center justify-center gap-2">
               <AlertTriangle className="w-4 h-4" />
               <span>API Key missing. Create a <b>.env</b> file with <code>API_KEY=AIza...</code> in the project root.</span>
            </div>
          )}
          {notification && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-2 text-center text-sm text-emerald-400 animate-in fade-in slide-in-from-top-2">
                {notification}
            </div>
          )}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 hidden sm:block">TranslateSafe</h1>
            </div>

            <div className="flex bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
                <button
                    onClick={() => setActiveTab(AppTab.TRANSLATE)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === AppTab.TRANSLATE 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Globe2 className="w-4 h-4" />
                    Translate
                </button>
                <button
                    onClick={() => setActiveTab(AppTab.FLASHCARDS)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === AppTab.FLASHCARDS 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Library className="w-4 h-4" />
                    Flashcards
                    <span className="ml-1 bg-slate-900 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                        {flashcards.length}
                    </span>
                </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === AppTab.TRANSLATE ? (
            <TranslationView 
                onSaveFlashcard={saveFlashcard} 
                targetLang={targetLang}
                setTargetLang={setTargetLang}
            />
          ) : (
            <FlashcardsView flashcards={flashcards} onDeleteFlashcard={deleteFlashcard} />
          )}
        </main>
      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  );
};

export default App;