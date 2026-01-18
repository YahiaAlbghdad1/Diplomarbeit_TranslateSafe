import React, { useState } from 'react';
import type { Flashcard } from '../types';
import { Trash2, RotateCw, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onDeleteFlashcard: (id: string) => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards, onDeleteFlashcard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <GraduationCap className="w-12 h-12 text-slate-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Flashcards Yet</h3>
        <p className="text-center max-w-md">Translate something and click "Save Flashcard" to build your deck.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleDelete = () => {
    onDeleteFlashcard(currentCard.id);
    if (flashcards.length === 1) {
        // We just deleted the last one
    } else if (currentIndex >= flashcards.length - 1) {
      setCurrentIndex(0);
    }
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto p-6">
      
      <div className="w-full flex justify-between items-center mb-8 px-4">
        <div className="text-slate-400 text-sm font-medium">
            Card {currentIndex + 1} of {flashcards.length}
        </div>
        <button 
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
            <Trash2 className="w-4 h-4" /> Delete Card
        </button>
      </div>

      <div className="relative w-full max-w-2xl aspect-[3/2] [perspective:1000px] group">
        <div 
            className={`relative w-full h-full duration-500 [transform-style:preserve-3d] cursor-pointer transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            {/* Front */}
            <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-xl border border-slate-600 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-500/20">
                    Original
                </span>
                <p className="text-3xl md:text-4xl font-bold text-slate-100 leading-tight">
                    {currentCard.original}
                </p>
                <p className="mt-8 text-slate-500 text-sm">Click to flip</p>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-900 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/30 flex flex-col items-center justify-center p-8 text-center">
                 <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/20">
                    {currentCard.targetLang}
                </span>
                <p className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {currentCard.translated}
                </p>
                 <p className="mt-8 text-indigo-300/50 text-sm">Click to flip back</p>
            </div>
        </div>
      </div>

      <div className="flex gap-6 mt-10 items-center">
        <button 
            onClick={handlePrev}
            className="p-4 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-200 transition-all shadow-lg active:scale-95"
        >
            <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
            <RotateCw className="w-5 h-5" /> Flip Card
        </button>

        <button 
            onClick={handleNext}
            className="p-4 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-200 transition-all shadow-lg active:scale-95"
        >
            <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardsView;