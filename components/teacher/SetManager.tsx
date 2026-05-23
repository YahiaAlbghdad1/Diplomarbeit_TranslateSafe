import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { FlashcardSetWithItems, InsertFlashcardSetItem } from '../../types/database';
import { Plus, Trash2, ChevronDown, ChevronUp, BookCopy, Loader2, X } from 'lucide-react';

interface Props {
  userId: string;
}

const SetManager: React.FC<Props> = ({ userId }) => {
  const [sets, setSets]             = useState<FlashcardSetWithItems[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // new set form
  const [creatingSet, setCreatingSet]     = useState(false);
  const [newTitle, setNewTitle]           = useState('');
  const [newDescription, setNewDescription] = useState('');

  // new item form (per set)
  const [addingItemTo, setAddingItemTo]   = useState<string | null>(null);
  const [newWord, setNewWord]             = useState('');
  const [newTranslation, setNewTranslation] = useState('');

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('flashcard_sets')
      .select('*, flashcard_set_items(*)')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false });
    setSets((data ?? []) as unknown as FlashcardSetWithItems[]);
    setLoading(false);
  };

  const createSet = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('flashcard_sets')
      .insert({ teacher_id: userId, title: newTitle.trim(), description: newDescription.trim() || null })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setSets(prev => [{ ...data, flashcard_set_items: [] }, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setCreatingSet(false);
    }
  };

  const deleteSet = async (setId: string) => {
    await supabase.from('flashcard_sets').delete().eq('id', setId);
    setSets(prev => prev.filter(s => s.id !== setId));
    if (expandedId === setId) setExpandedId(null);
  };

  const addItem = async (setId: string) => {
    if (!newWord.trim() || !newTranslation.trim()) return;
    const existing = sets.find(s => s.id === setId)?.flashcard_set_items ?? [];
    const row: InsertFlashcardSetItem = {
      set_id:      setId,
      word:        newWord.trim(),
      translation: newTranslation.trim(),
      position:    existing.length,
    };
    setSaving(true);
    const { data, error } = await supabase.from('flashcard_set_items').insert(row).select().single();
    setSaving(false);
    if (!error && data) {
      setSets(prev => prev.map(s =>
        s.id === setId
          ? { ...s, flashcard_set_items: [...s.flashcard_set_items, data] }
          : s
      ));
      setNewWord('');
      setNewTranslation('');
    }
  };

  const deleteItem = async (setId: string, itemId: string) => {
    await supabase.from('flashcard_set_items').delete().eq('id', itemId);
    setSets(prev => prev.map(s =>
      s.id === setId
        ? { ...s, flashcard_set_items: s.flashcard_set_items.filter(i => i.id !== itemId) }
        : s
    ));
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
      {!creatingSet ? (
        <button
          onClick={() => setCreatingSet(true)}
          className="flex items-center gap-2 w-fit px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Set
        </button>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-200">New Flashcard Set</p>
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title…"
            className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
          />
          <input
            type="text"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="Description (optional)…"
            className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={createSet}
              disabled={saving || !newTitle.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button onClick={() => setCreatingSet(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {sets.length === 0 && !creatingSet && (
        <div className="text-center py-16 text-slate-500">
          <BookCopy className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-sm">No sets yet. Create your first one above.</p>
        </div>
      )}

      {sets.map(set => (
        <div key={set.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Set header */}
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={() => setExpandedId(expandedId === set.id ? null : set.id)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <BookCopy className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{set.title}</p>
                <p className="text-xs text-slate-500">
                  {set.flashcard_set_items.length} card{set.flashcard_set_items.length !== 1 ? 's' : ''}
                  {set.description && ` · ${set.description}`}
                </p>
              </div>
              {expandedId === set.id ? <ChevronUp className="w-4 h-4 text-slate-500 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />}
            </button>
            <button
              onClick={() => deleteSet(set.id)}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {expandedId === set.id && (
            <div className="border-t border-slate-700 px-5 py-4 flex flex-col gap-3">
              {/* Item list */}
              {set.flashcard_set_items
                .slice()
                .sort((a, b) => a.position - b.position)
                .map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5">
                    <span className="flex-1 text-sm text-slate-200 font-medium">{item.word}</span>
                    <span className="text-slate-500 text-sm">→</span>
                    <span className="flex-1 text-sm text-slate-300">{item.translation}</span>
                    <button
                      onClick={() => deleteItem(set.id, item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              }

              {/* Add item */}
              {addingItemTo === set.id ? (
                <div className="flex gap-2 items-center mt-1">
                  <input
                    autoFocus
                    type="text"
                    value={newWord}
                    onChange={e => setNewWord(e.target.value)}
                    placeholder="Word…"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="text"
                    value={newTranslation}
                    onChange={e => setNewTranslation(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addItem(set.id); }}
                    placeholder="Translation…"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
                  />
                  <button
                    onClick={() => addItem(set.id)}
                    disabled={saving || !newWord.trim() || !newTranslation.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setAddingItemTo(null); setNewWord(''); setNewTranslation(''); }}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingItemTo(set.id)}
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-1 w-fit"
                >
                  <Plus className="w-4 h-4" /> Add card
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SetManager;
