import React, { useState } from 'react';
import { School, BookCopy, Dumbbell } from 'lucide-react';
import ClassManager from './ClassManager';
import SetManager from './SetManager';
import ExerciseManager from './ExerciseManager';

type TeacherTab = 'classes' | 'sets' | 'exercises';

interface Props {
  userId: string;
}

const TABS: { id: TeacherTab; label: string; icon: React.ReactNode }[] = [
  { id: 'classes',   label: 'Classes',   icon: <School    className="w-4 h-4" /> },
  { id: 'sets',      label: 'Sets',      icon: <BookCopy  className="w-4 h-4" /> },
  { id: 'exercises', label: 'Exercises', icon: <Dumbbell  className="w-4 h-4" /> },
];

const TeacherView: React.FC<Props> = ({ userId }) => {
  const [tab, setTab] = useState<TeacherTab>('classes');

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20">
          <School className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Teacher Dashboard</h2>
          <p className="text-xs text-slate-500">Manage your classes, flashcard sets, and exercises</p>
        </div>
      </div>

      <div className="flex bg-slate-800/80 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === id
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'classes'   && <ClassManager   userId={userId} />}
        {tab === 'sets'      && <SetManager     userId={userId} />}
        {tab === 'exercises' && <ExerciseManager userId={userId} />}
      </div>
    </div>
  );
};

export default TeacherView;
