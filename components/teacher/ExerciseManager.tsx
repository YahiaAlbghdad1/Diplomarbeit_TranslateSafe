import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type {
  ExerciseWithQuestions, FlashcardSet, FlashcardSetItem,
  ExerciseType, InsertExerciseQuestion,
} from '../../types/database';
import { Plus, Trash2, ChevronDown, ChevronUp, Dumbbell, Loader2, X, Zap } from 'lucide-react';

interface Props {
  userId: string;
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  fill_gap:        'Fill in the Gap',
  multiple_choice: 'Multiple Choice',
  matching:        'Matching',
};

const ExerciseManager: React.FC<Props> = ({ userId }) => {
  const [exercises, setExercises]   = useState<ExerciseWithQuestions[]>([]);
  const [sets, setSets]             = useState<FlashcardSet[]>([]);
  const [setItems, setSetItems]     = useState<Record<string, FlashcardSetItem[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // new exercise form
  const [creating, setCreating]         = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newType, setNewType]           = useState<ExerciseType>('fill_gap');
  const [newSetId, setNewSetId]         = useState('');

  // new question form (per exercise)
  const [addingQTo, setAddingQTo]       = useState<string | null>(null);
  const [qSentence, setQSentence]       = useState('');
  const [qAnswer, setQAnswer]           = useState('');

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    const [{ data: exData }, { data: setData }] = await Promise.all([
      supabase
        .from('exercises')
        .select('*, exercise_questions(*)')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('flashcard_sets')
        .select('*')
        .eq('teacher_id', userId),
    ]);
    setExercises((exData ?? []) as unknown as ExerciseWithQuestions[]);
    setSets(setData ?? []);
    setLoading(false);
  };

  const loadSetItems = async (setId: string) => {
    if (setItems[setId]) return;
    const { data } = await supabase
      .from('flashcard_set_items')
      .select('*')
      .eq('set_id', setId)
      .order('position');
    setSetItems(prev => ({ ...prev, [setId]: data ?? [] }));
  };

  const createExercise = async () => {
    if (!newTitle.trim() || !newSetId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('exercises')
      .insert({ teacher_id: userId, set_id: newSetId, title: newTitle.trim(), type: newType })
      .select()
      .single();
    if (!error && data) {
      const base: ExerciseWithQuestions = { ...data, exercise_questions: [] };
      if (newType === 'matching') {
        // Auto-generate matching questions from all set items
        const items = setItems[newSetId] ?? [];
        if (items.length > 0) {
          const rows: InsertExerciseQuestion[] = items.map((item, i) => ({
            exercise_id:    data.id,
            position:       i,
            sentence:       item.word,
            correct_answer: item.translation,
            options:        null,
          }));
          const { data: qData } = await supabase
            .from('exercise_questions')
            .insert(rows)
            .select();
          base.exercise_questions = qData ?? [];
        }
      }
      setExercises(prev => [base, ...prev]);
      setNewTitle('');
      setNewType('fill_gap');
      setNewSetId('');
      setCreating(false);
    }
    setSaving(false);
  };

  const deleteExercise = async (id: string) => {
    await supabase.from('exercises').delete().eq('id', id);
    setExercises(prev => prev.filter(e => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const addQuestion = async (ex: ExerciseWithQuestions) => {
    if (!qSentence.trim() || !qAnswer.trim()) return;
    const items = setItems[ex.set_id] ?? [];
    let options: string[] | null = null;
    if (ex.type === 'multiple_choice') {
      const distractors = items
        .map(i => i.translation)
        .filter(t => t !== qAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      options = [...distractors, qAnswer].sort(() => Math.random() - 0.5);
    }
    const row: InsertExerciseQuestion = {
      exercise_id:    ex.id,
      position:       ex.exercise_questions.length,
      sentence:       qSentence.trim(),
      correct_answer: qAnswer.trim(),
      options,
    };
    setSaving(true);
    const { data, error } = await supabase.from('exercise_questions').insert(row).select().single();
    setSaving(false);
    if (!error && data) {
      setExercises(prev => prev.map(e =>
        e.id === ex.id ? { ...e, exercise_questions: [...e.exercise_questions, data] } : e
      ));
      setQSentence('');
      setQAnswer('');
    }
  };

  const deleteQuestion = async (exerciseId: string, questionId: string) => {
    await supabase.from('exercise_questions').delete().eq('id', questionId);
    setExercises(prev => prev.map(e =>
      e.id === exerciseId
        ? { ...e, exercise_questions: e.exercise_questions.filter(q => q.id !== questionId) }
        : e
    ));
  };

  const toggleExpand = async (ex: ExerciseWithQuestions) => {
    if (expandedId === ex.id) {
      setExpandedId(null);
    } else {
      setExpandedId(ex.id);
      await loadSetItems(ex.set_id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 w-fit px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Exercise
        </button>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-200">New Exercise</p>
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Exercise title…"
            className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(TYPE_LABELS) as ExerciseType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  newType === t
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                    : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <select
            value={newSetId}
            onChange={async e => { setNewSetId(e.target.value); if (e.target.value) await loadSetItems(e.target.value); }}
            className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors"
          >
            <option value="">Link to a flashcard set…</option>
            {sets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              onClick={createExercise}
              disabled={saving || !newTitle.trim() || !newSetId}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {exercises.length === 0 && !creating && (
        <div className="text-center py-16 text-slate-500">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-sm">No exercises yet. Create your first one above.</p>
        </div>
      )}

      {exercises.map(ex => {
        const items = setItems[ex.set_id] ?? [];
        return (
          <div key={ex.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <button
                onClick={() => toggleExpand(ex)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{ex.title}</p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABELS[ex.type]} · {ex.exercise_questions.length} question{ex.exercise_questions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {expandedId === ex.id ? <ChevronUp className="w-4 h-4 text-slate-500 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />}
              </button>
              <button
                onClick={() => deleteExercise(ex.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {expandedId === ex.id && (
              <div className="border-t border-slate-700 px-5 py-4 flex flex-col gap-3">
                {ex.exercise_questions
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map(q => (
                    <div key={q.id} className="flex items-start gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3">
                      <div className="flex-1">
                        <p className="text-sm text-slate-200">{q.sentence}</p>
                        <p className="text-xs text-emerald-400 mt-1">Answer: {q.correct_answer}</p>
                        {q.options && (
                          <p className="text-xs text-slate-500 mt-0.5">Options: {q.options.join(', ')}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteQuestion(ex.id, q.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                }

                {ex.type !== 'matching' && (
                  addingQTo === ex.id ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <input
                        autoFocus
                        type="text"
                        value={qSentence}
                        onChange={e => setQSentence(e.target.value)}
                        placeholder={`Sentence with ___ for the blank`}
                        className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                      />
                      <select
                        value={qAnswer}
                        onChange={e => setQAnswer(e.target.value)}
                        className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none transition-colors"
                      >
                        <option value="">Correct answer (from set)…</option>
                        {items.map(i => (
                          <option key={i.id} value={i.translation}>{i.word} → {i.translation}</option>
                        ))}
                      </select>
                      {ex.type === 'multiple_choice' && (
                        <p className="text-xs text-slate-500">3 random distractors will be added from the set automatically.</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => addQuestion(ex)}
                          disabled={saving || !qSentence.trim() || !qAnswer}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Question'}
                        </button>
                        <button
                          onClick={() => { setAddingQTo(null); setQSentence(''); setQAnswer(''); }}
                          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingQTo(ex.id)}
                      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-1 w-fit"
                    >
                      <Plus className="w-4 h-4" /> Add question
                    </button>
                  )
                )}

                {ex.type === 'matching' && (
                  <p className="text-xs text-slate-500">Matching questions are auto-generated from the linked set's cards.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseManager;
