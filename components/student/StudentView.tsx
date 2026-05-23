import React, { useState } from 'react';
import { GraduationCap, Users, ClipboardList } from 'lucide-react';
import MyClasses from './MyClasses';
import Assignments from './Assignments';

type StudentTab = 'classes' | 'assignments';

interface Props {
  userId: string;
}

const TABS: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
  { id: 'classes',     label: 'My Classes',  icon: <Users         className="w-4 h-4" /> },
  { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
];

const StudentView: React.FC<Props> = ({ userId }) => {
  const [tab, setTab] = useState<StudentTab>('assignments');

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 md:p-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/20">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Student Dashboard</h2>
          <p className="text-xs text-slate-500">Practice assigned content and manage your classes</p>
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
        {tab === 'classes'     && <MyClasses  userId={userId} />}
        {tab === 'assignments' && <Assignments userId={userId} />}
      </div>
    </div>
  );
};

export default StudentView;
