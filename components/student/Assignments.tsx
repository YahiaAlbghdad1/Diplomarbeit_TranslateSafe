import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { AssignmentWithContent } from '../../types/database';
import SetPractice from './SetPractice';
import ExerciseTaker from './ExerciseTaker';
import { BookCopy, Dumbbell, CalendarClock, Loader2, Play } from 'lucide-react';

interface Props {
  userId: string;
}

type ActiveContent = { type: 'set'; id: string } | { type: 'exercise'; id: string } | null;

const Assignments: React.FC<Props> = ({ userId }) => {
  const [assignments, setAssignments] = useState<AssignmentWithContent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [active, setActive]           = useState<ActiveContent>(null);

  useEffect(() => { load(); }, [userId]);

  const load = async () => {
    setLoading(true);
    // Get all classes the student is in, then fetch their assignments
    const { data: memberships } = await supabase
      .from('class_memberships')
      .select('class_id')
      .eq('student_id', userId);

    const classIds = (memberships ?? []).map((m: any) => m.class_id);
    if (classIds.length === 0) { setAssignments([]); setLoading(false); return; }

    const { data } = await supabase
      .from('assignments')
      .select('*, flashcard_sets(id, title, description), exercises(id, title, type)')
      .in('class_id', classIds)
      .order('assigned_at', { ascending: false });

    setAssignments((data ?? []) as unknown as AssignmentWithContent[]);
    setLoading(false);
  };

  if (active?.type === 'set')      return <SetPractice  setId={active.id}      onBack={() => setActive(null)} />;
  if (active?.type === 'exercise') return <ExerciseTaker exerciseId={active.id} onBack={() => setActive(null)} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Dumbbell className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="text-sm">No assignments yet. Join a class to see content.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assignments.map(a => {
        const isSet = !!a.flashcard_set_id;
        const title = isSet ? a.flashcard_sets?.title : a.exercises?.title;
        const subLabel = isSet ? 'Flashcard Set' : `Exercise · ${(a.exercises as any)?.type?.replace('_', ' ')}`;
        const overdue  = a.due_date && new Date(a.due_date) < new Date();
        const id       = isSet ? a.flashcard_set_id! : a.exercise_id!;

        return (
          <div key={a.id} className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg shrink-0 ${isSet ? 'bg-purple-600/20' : 'bg-emerald-600/20'}`}>
                {isSet
                  ? <BookCopy className="w-4 h-4 text-purple-400" />
                  : <Dumbbell className="w-4 h-4 text-emerald-400" />
                }
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-100 truncate">{title ?? '—'}</p>
                <p className="text-xs text-slate-500 capitalize">{subLabel}</p>
                {a.due_date && (
                  <div className={`flex items-center gap-1 text-xs mt-0.5 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                    <CalendarClock className="w-3 h-3" />
                    {overdue ? 'Overdue · ' : 'Due '}
                    {new Date(a.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setActive({ type: isSet ? 'set' : 'exercise', id })}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 shrink-0"
            >
              <Play className="w-4 h-4" /> Start
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Assignments;
