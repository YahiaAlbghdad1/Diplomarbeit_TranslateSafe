import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Class, FlashcardSet, Exercise, Assignment } from '../../types/database';
import {
  Plus, ChevronDown, ChevronUp, Copy, Check, Trash2,
  Users, CalendarClock, Loader2, X
} from 'lucide-react';

interface ClassRow extends Class {
  member_count: number;
}

interface AssignmentRow extends Assignment {
  flashcard_sets: { title: string } | null;
  exercises:      { title: string } | null;
}

interface Props {
  userId: string;
}

const ClassManager: React.FC<Props> = ({ userId }) => {
  const [classes, setClasses]           = useState<ClassRow[]>([]);
  const [sets, setSets]                 = useState<FlashcardSet[]>([]);
  const [exercises, setExercises]       = useState<Exercise[]>([]);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [assignments, setAssignments]   = useState<Record<string, AssignmentRow[]>>({});
  const [members, setMembers]           = useState<Record<string, { id: string; display_name: string | null }[]>>({});
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [creating, setCreating]         = useState(false);
  const [newName, setNewName]           = useState('');
  const [assigning, setAssigning]       = useState<string | null>(null);
  const [assignType, setAssignType]     = useState<'set' | 'exercise'>('set');
  const [assignTargetId, setAssignTargetId] = useState('');
  const [assignDueDate, setAssignDueDate]   = useState('');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    const { data: classRows } = await supabase
      .from('classes')
      .select('*, class_memberships(count)')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false });

    const { data: setRows }  = await supabase.from('flashcard_sets').select('*').eq('teacher_id', userId);
    const { data: exRows }   = await supabase.from('exercises').select('*').eq('teacher_id', userId);

    setClasses((classRows ?? []).map((c: any) => ({
      ...c,
      member_count: c.class_memberships?.[0]?.count ?? 0,
    })));
    setSets(setRows ?? []);
    setExercises(exRows ?? []);
    setLoading(false);
  };

  const loadExpanded = async (classId: string) => {
    const [{ data: asgn }, { data: mems }] = await Promise.all([
      supabase
        .from('assignments')
        .select('*, flashcard_sets(title), exercises(title)')
        .eq('class_id', classId)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('class_memberships')
        .select('student_id, profiles(id, display_name)')
        .eq('class_id', classId),
    ]);

    setAssignments(prev => ({ ...prev, [classId]: (asgn ?? []) as unknown as AssignmentRow[] }));
    setMembers(prev => ({
      ...prev,
      [classId]: (mems ?? []).map((m: any) => m.profiles).filter(Boolean),
    }));
  };

  const toggleExpand = (classId: string) => {
    if (expandedId === classId) {
      setExpandedId(null);
    } else {
      setExpandedId(classId);
      loadExpanded(classId);
    }
  };

  const createClass = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('classes')
      .insert({ teacher_id: userId, name: newName.trim() })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setClasses(prev => [{ ...data, member_count: 0 }, ...prev]);
      setNewName('');
      setCreating(false);
    }
  };

  const deleteClass = async (classId: string) => {
    await supabase.from('classes').delete().eq('id', classId);
    setClasses(prev => prev.filter(c => c.id !== classId));
    if (expandedId === classId) setExpandedId(null);
  };

  const addAssignment = async (classId: string) => {
    if (!assignTargetId) return;
    setSaving(true);
    const row = {
      class_id:         classId,
      assigned_by:      userId,
      flashcard_set_id: assignType === 'set'      ? assignTargetId : null,
      exercise_id:      assignType === 'exercise' ? assignTargetId : null,
      due_date:         assignDueDate || null,
    };
    const { error } = await supabase.from('assignments').insert(row);
    setSaving(false);
    if (!error) {
      setAssigning(null);
      setAssignTargetId('');
      setAssignDueDate('');
      loadExpanded(classId);
    }
  };

  const removeAssignment = async (assignmentId: string, classId: string) => {
    await supabase.from('assignments').delete().eq('id', assignmentId);
    loadExpanded(classId);
  };

  const copyCode = (code: string, classId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(classId);
    setTimeout(() => setCopiedId(null), 2000);
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
      {/* Create button */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 w-fit px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Class
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createClass(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Class name…"
            className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
          />
          <button
            onClick={createClass}
            disabled={saving}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </button>
          <button onClick={() => setCreating(false)} className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {classes.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-sm">No classes yet. Create your first one above.</p>
        </div>
      )}

      {/* Class list */}
      {classes.map(cls => (
        <div key={cls.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Class header */}
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={() => toggleExpand(cls.id)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <div className="p-2 bg-indigo-600/20 rounded-lg">
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">{cls.name}</p>
                <p className="text-xs text-slate-500">{cls.member_count} student{cls.member_count !== 1 ? 's' : ''}</p>
              </div>
              {expandedId === cls.id ? <ChevronUp className="w-4 h-4 text-slate-500 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />}
            </button>

            {/* Invite code */}
            <button
              onClick={() => copyCode(cls.invite_code, cls.id)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors mr-3"
              title="Copy invite code"
            >
              {copiedId === cls.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="font-mono tracking-wider">{cls.invite_code}</span>
            </button>

            <button
              onClick={() => deleteClass(cls.id)}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded panel */}
          {expandedId === cls.id && (
            <div className="border-t border-slate-700 px-5 py-4 flex flex-col gap-5">
              {/* Members */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Students</p>
                {(members[cls.id] ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No students yet. Share the invite code: <span className="font-mono text-indigo-400">{cls.invite_code}</span></p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(members[cls.id] ?? []).map(m => (
                      <span key={m.id} className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                        {m.display_name ?? m.id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned Content</p>
                  <button
                    onClick={() => setAssigning(assigning === cls.id ? null : cls.id)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign
                  </button>
                </div>

                {assigning === cls.id && (
                  <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-3 flex flex-col gap-3">
                    <div className="flex gap-2">
                      {(['set', 'exercise'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => { setAssignType(t); setAssignTargetId(''); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            assignType === t ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {t === 'set' ? 'Flashcard Set' : 'Exercise'}
                        </button>
                      ))}
                    </div>
                    <select
                      value={assignTargetId}
                      onChange={e => setAssignTargetId(e.target.value)}
                      className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none transition-colors"
                    >
                      <option value="">Select {assignType === 'set' ? 'a set' : 'an exercise'}…</option>
                      {(assignType === 'set' ? sets : exercises).map(item => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-slate-500 shrink-0" />
                      <input
                        type="datetime-local"
                        value={assignDueDate}
                        onChange={e => setAssignDueDate(e.target.value)}
                        className="bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none transition-colors flex-1"
                      />
                      <span className="text-xs text-slate-500">optional due date</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addAssignment(cls.id)}
                        disabled={!assignTargetId || saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                      </button>
                      <button onClick={() => setAssigning(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {(assignments[cls.id] ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing assigned yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(assignments[cls.id] ?? []).map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-700 rounded-xl px-4 py-2.5">
                        <div>
                          <p className="text-sm text-slate-200 font-medium">
                            {a.flashcard_sets?.title ?? a.exercises?.title ?? '—'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {a.exercise_id ? 'Exercise' : 'Flashcard Set'}
                            {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString()}`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAssignment(a.id, cls.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ClassManager;
