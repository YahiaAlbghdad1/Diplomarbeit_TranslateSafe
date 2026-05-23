import React, { useState, useMemo } from 'react';
import type { HistoryEntry, Flashcard } from '../types';
import { LANGUAGE_CONFIG } from '../constants';
import { Search, Trash2, Save, Clock, ArrowRight, X } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onSaveAsFlashcard: (entry: Omit<Flashcard, 'id' | 'timestamp' | 'easiness' | 'interval' | 'repetitions' | 'nextReview'>) => void;
}

const ALL_LANGUAGES = ['All', ...LANGUAGE_CONFIG.map(l => l.name)];

const HistoryView: React.FC<HistoryViewProps> = ({ history, onDeleteEntry, onSaveAsFlashcard }) => {
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return history.filter(entry => {
      const matchesSearch =
        !q ||
        entry.original.toLowerCase().includes(q) ||
        entry.translated.toLowerCase().includes(q);
      const matchesLang =
        langFilter === 'All' ||
        entry.targetLang === langFilter ||
        entry.sourceLang === langFilter;
      return matchesSearch && matchesLang;
    });
  }, [history, search, langFilter]);

  const handleSave = (entry: HistoryEntry) => {
    onSaveAsFlashcard({
      original: entry.original,
      translated: entry.translated,
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
    });
    setSavedIds(prev => new Set(prev).add(entry.id));
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <Clock className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No History Yet</h3>
        <p className="text-center max-w-md">Every translation you make will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6 gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search translations..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={langFilter}
          onChange={e => setLangFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
        >
          {ALL_LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} of {history.length} entries</p>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No entries match your filters.</div>
        ) : (
          filtered.map(entry => (
            <div
              key={entry.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 font-medium truncate">{entry.original}</p>
                  <div className="flex items-center gap-1.5 my-1">
                    <span className="text-xs text-slate-500">{entry.sourceLang || 'Auto'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-xs text-indigo-400">{entry.targetLang}</span>
                  </div>
                  <p className="text-slate-400 text-sm truncate">{entry.translated}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-slate-600">
                    {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(entry)}
                      disabled={savedIds.has(entry.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                        savedIds.has(entry.id)
                          ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-700/30 cursor-default'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30'
                      }`}
                    >
                      <Save className="w-3 h-3" />
                      {savedIds.has(entry.id) ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryView;
