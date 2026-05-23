import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { FlashcardSetItemWithProgress, FlashcardSet } from '../../types/database';
import { ChevronLeft, ChevronRight, RotateCw, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  setId: string;
  onBack: () => void;
}

type SrsRating = 'again' | 'hard' | 'good' | 'easy';

const RATING_BUTTONS: { rating: SrsRating; label: string; style: string }[] = [
  { rating: 'again', label: 'Again', style: 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30' },
  { rating: 'hard',  label: 'Hard',  style: 'bg-orange-600/20 text-orange-400 border border-orange-600/30 hover:bg-orange-600/30' },
  { rating: 'good',  label: 'Good',  style: 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/30' },
  { rating: 'easy',  label: 'Easy',  style: 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30' },
];

const SetPractice: React.FC<Props> = ({ setId, onBack }) => {
  const [set, setSet]           = useState<FlashcardSet | null>(null);
  const [cards, setCards]       = useState<FlashcardSetItemWithProgress[]>([]);
  const [index, setIndex]       = useState(0);
  const [flipped, setFlipped]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [userId, setUserId]     = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); load(data.user.id); }
    });
  }, [setId]);

  const load = async (uid: string) => {
    setLoading(true);
    const [{ data: setData }, { data: items }, { data: progress }] = await Promise.all([
      supabase.from('flashcard_sets').select('*').eq('id', setId).single(),
      supabase.from('flashcard_set_items').select('*').eq('set_id', setId).order('position'),
      supabase.from('student_set_progress').select('*').eq('student_id', uid),
    ]);
    setSet(setData ?? null);
    const progressMap = new Map((progress ?? []).map((p: any) => [p.flashcard_set_item_id, p]));
    setCards((items ?? []).map(item => ({
      ...item,
      progress: progressMap.get(item.id) ?? null,
    })));
    setLoading(false);
  };

  const rate = async (rating: SrsRating) => {
    const card = cards[index];
    if (!card || !userId) return;

    const quality: Record<SrsRating, number> = { again: 0, hard: 2, good: 4, easy: 5 };
    const q = quality[rating];
    const prev = card.progress;
    const easeFactor = prev
      ? Math.max(1.3, prev.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      : 2.5;
    let intervalDays: number;
    const reps = prev ? (q < 3 ? 0 : (prev.interval_days === 1 ? 1 : prev.interval_days + 1)) : 0;
    if (q < 3)             intervalDays = 1;
    else if (!prev)        intervalDays = 1;
    else if (reps === 1)   intervalDays = 6;
    else                   intervalDays = Math.round(prev.interval_days * easeFactor);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + intervalDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const upsertRow = {
      student_id:            userId,
      flashcard_set_item_id: card.id,
      ease_factor:           easeFactor,
      interval_days:         intervalDays,
      due_date:              dueDateStr,
      last_reviewed:         new Date().toISOString(),
    };
    await supabase.from('student_set_progress').upsert(upsertRow, { onConflict: 'student_id,flashcard_set_item_id' });

    setCards(prev => prev.map(c =>
      c.id === card.id ? { ...c, progress: { ...upsertRow, id: c.progress?.id ?? '' } } : c
    ));
    setTimeout(() => { setFlipped(false); goNext(); }, 250);
  };

  const goNext = () => setIndex(i => (i + 1) % cards.length);
  const goPrev = () => { setFlipped(false); setIndex(i => (i - 1 + cards.length) % cards.length); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-slate-400">This set has no cards yet.</p>
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const card = cards[index];
  const dueCount = cards.filter(c => {
    if (!c.progress) return true;
    return new Date(c.progress.due_date) <= new Date();
  }).length;

  return (
    <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-200">{set?.title}</p>
          <p className="text-xs text-slate-500">Card {index + 1} of {cards.length}{dueCount > 0 && ` · ${dueCount} due`}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* Card */}
      <div className="relative w-full aspect-[3/2] [perspective:1000px]">
        <div
          className={`relative w-full h-full duration-500 [transform-style:preserve-3d] cursor-pointer transition-transform ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-xl border border-slate-600 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-500/20">
              Word
            </span>
            <p className="text-3xl md:text-4xl font-bold text-slate-100">{card.word}</p>
            <p className="mt-4 text-slate-500 text-sm">Click to flip</p>
          </div>
          <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-900 to-slate-800 rounded-2xl shadow-xl border border-indigo-500/30 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/20">
              Translation
            </span>
            <p className="text-3xl md:text-4xl font-bold text-white">{card.translation}</p>
            <p className="mt-4 text-indigo-300/50 text-sm">Rate your recall below</p>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="flex flex-col items-center gap-3 w-full">
          <p className="text-xs text-slate-500 uppercase tracking-wider">How well did you remember?</p>
          <div className="grid grid-cols-4 gap-3 w-full">
            {RATING_BUTTONS.map(({ rating, label, style }) => (
              <button key={rating} onClick={() => rate(rating)} className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${style}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-6 items-center">
          <button onClick={goPrev} className="p-4 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all shadow-lg active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => setFlipped(true)} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
            <RotateCw className="w-5 h-5" /> Flip Card
          </button>
          <button onClick={goNext} className="p-4 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all shadow-lg active:scale-95">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SetPractice;
