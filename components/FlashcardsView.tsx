import React, { useState, useMemo } from 'react';
import type { Flashcard, SrsRating } from '../types';
import { LANGUAGE_CONFIG } from '../constants';
import { Trash2, RotateCw, ChevronLeft, ChevronRight, GraduationCap, Download, Search, X } from 'lucide-react';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onDeleteFlashcard: (id: string) => void;
  onRateFlashcard: (id: string, rating: SrsRating) => void;
}

const ALL = 'All';
const ALL_LANGUAGES = [ALL, ...LANGUAGE_CONFIG.map(l => l.name)];


const RATING_BUTTONS: { rating: SrsRating; label: string; style: string }[] = [
  { rating: 'again', label: 'Again', style: 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30' },
  { rating: 'hard',  label: 'Hard',  style: 'bg-orange-600/20 text-orange-400 border border-orange-600/30 hover:bg-orange-600/30' },
  { rating: 'good',  label: 'Good',  style: 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/30' },
  { rating: 'easy',  label: 'Easy',  style: 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30' },
];

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards, onDeleteFlashcard, onRateFlashcard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState(ALL);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return flashcards.filter(card => {
      const matchesSearch =
        !q ||
        card.original.toLowerCase().includes(q) ||
        card.translated.toLowerCase().includes(q);
      const matchesLang =
        langFilter === ALL ||
        card.targetLang === langFilter ||
        card.sourceLang === langFilter;
      return matchesSearch && matchesLang;
    });
  }, [flashcards, search, langFilter]);

  const currentCard = filtered[Math.min(currentIndex, filtered.length - 1)];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % filtered.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + filtered.length) % filtered.length);
  };

  const handleDelete = () => {
    if (!currentCard) return;
    onDeleteFlashcard(currentCard.id);
    setIsFlipped(false);
    if (filtered.length === 1) return;
    if (currentIndex >= filtered.length - 1) setCurrentIndex(0);
  };

  const handleRate = (rating: SrsRating) => {
    if (!currentCard) return;
    onRateFlashcard(currentCard.id, rating);
    setRatedIds(prev => new Set(prev).add(currentCard.id));
    setTimeout(() => {
      setIsFlipped(false);
      handleNext();
    }, 300);
  };

  const handleExport = () => {
    const header = 'Original,Translated,Source Language,Target Language,Date';
    const rows = flashcards.map(c =>
      [
        `"${c.original.replace(/"/g, '""')}"`,
        `"${c.translated.replace(/"/g, '""')}"`,
        `"${c.sourceLang || 'Auto'}"`,
        `"${c.targetLang}"`,
        new Date(c.timestamp).toLocaleDateString(),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'translatesafe-flashcards.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const dueCount = flashcards.filter(c => c.nextReview <= Date.now()).length;

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

  return (
    <div className="flex flex-col items-center h-full max-w-4xl mx-auto p-4 md:p-6 gap-4">

      {/* Toolbar */}
      <div className="w-full flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentIndex(0); }}
            placeholder="Search cards..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button onClick={() => { setSearch(''); setCurrentIndex(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={langFilter}
          onChange={e => { setLangFilter(e.target.value); setCurrentIndex(0); }}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
        >
          {ALL_LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors font-medium shrink-0"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="w-full flex justify-between items-center px-1">
        <div className="text-slate-400 text-sm font-medium">
          {filtered.length === 0 ? 'No cards match' : `Card ${Math.min(currentIndex + 1, filtered.length)} of ${filtered.length}`}
        </div>
        <div className="flex items-center gap-3">
          {dueCount > 0 && (
            <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-700/30 px-2 py-1 rounded-full">
              {dueCount} due for review
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={!currentCard}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-30"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">No cards match your filters.</div>
      ) : (
        <>
          {/* Card */}
          <div className="relative w-full max-w-2xl aspect-[3/2] [perspective:1000px]">
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
                {currentCard.nextReview > 0 && (
                  <p className="mt-6 text-xs text-slate-500">
                    Next review: {currentCard.nextReview <= Date.now()
                      ? 'Due now'
                      : new Date(currentCard.nextReview).toLocaleDateString()}
                  </p>
                )}
                <p className="mt-4 text-slate-500 text-sm">Click to flip</p>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-900 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/30 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/20">
                  {currentCard.targetLang}
                </span>
                <p className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  {currentCard.translated}
                </p>
                <p className="mt-6 text-indigo-300/50 text-sm">Rate your recall below</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          {isFlipped ? (
            /* SRS rating buttons — shown after flip */
            <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
              <p className="text-xs text-slate-500 uppercase tracking-wider">How well did you remember?</p>
              <div className="grid grid-cols-4 gap-3 w-full">
                {RATING_BUTTONS.map(({ rating, label, style }) => (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${style}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Navigation */
            <div className="flex gap-6 items-center">
              <button
                onClick={handlePrev}
                className="p-4 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-200 transition-all shadow-lg active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsFlipped(true)}
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
          )}
        </>
      )}
    </div>
  );
};

export default FlashcardsView;
