import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { ExerciseWithQuestions, AnswerRecord } from '../../types/database';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Loader2 } from 'lucide-react';

interface Props {
  exerciseId: string;
  onBack:     () => void;
}

// ---- Fill in the Gap -------------------------------------------------------
const FillGap: React.FC<{
  sentence: string;
  value:    string;
  onChange: (v: string) => void;
  submitted: boolean;
  correct:   boolean;
  answer:    string;
}> = ({ sentence, value, onChange, submitted, correct, answer }) => {
  const parts = sentence.split('___');
  return (
    <div className="text-slate-200 text-lg leading-relaxed">
      {parts[0]}
      {submitted ? (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold mx-1 ${correct ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {value || '—'}
          {correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </span>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="inline-block bg-slate-700 border-b-2 border-indigo-400 focus:border-indigo-300 outline-none px-2 py-0.5 text-indigo-200 font-semibold mx-1 rounded-t-md w-32 text-center transition-colors"
        />
      )}
      {parts[1]}
      {submitted && !correct && (
        <p className="text-sm text-slate-400 mt-2">Correct answer: <span className="text-emerald-400 font-medium">{answer}</span></p>
      )}
    </div>
  );
};

// ---- Multiple Choice -------------------------------------------------------
const MultipleChoice: React.FC<{
  sentence: string;
  options:  string[];
  value:    string;
  onChange: (v: string) => void;
  submitted: boolean;
  correct:   boolean;
  answer:    string;
}> = ({ sentence, options, value, onChange, submitted, correct, answer }) => {
  const parts = sentence.split('___');
  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-200 text-lg leading-relaxed">
        {parts[0]}<span className="inline-block bg-slate-700 border-b-2 border-indigo-400 px-4 py-0.5 mx-1 rounded-t-md text-indigo-200 font-semibold">{value || '___'}</span>{parts[1]}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          let style = 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700';
          if (submitted) {
            if (opt === answer)  style = 'bg-emerald-600/20 border-emerald-500 text-emerald-300';
            else if (opt === value && !correct) style = 'bg-red-600/20 border-red-500 text-red-300';
            else style = 'bg-slate-800 border-slate-700 text-slate-500';
          } else if (opt === value) {
            style = 'bg-indigo-600/20 border-indigo-500 text-indigo-300';
          }
          return (
            <button
              key={opt}
              disabled={submitted}
              onClick={() => onChange(opt)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---- Matching --------------------------------------------------------------
const Matching: React.FC<{
  questions:  { id: string; sentence: string; correct_answer: string }[];
  matches:    Record<string, string>;
  onMatch:    (leftId: string, right: string) => void;
  submitted:  boolean;
}> = ({ questions, matches, onMatch, submitted }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const shuffledRight = useMemo(
    () => [...questions].sort(() => Math.random() - 0.5),
    [questions]
  );
  const usedRight = new Set(Object.values(matches));

  const handleRight = (right: string) => {
    if (submitted || !selectedLeft) return;
    onMatch(selectedLeft, right);
    setSelectedLeft(null);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Words</p>
        {questions.map(q => {
          const matched = matches[q.id];
          const isCorrect = submitted && matched === q.correct_answer;
          const isWrong   = submitted && matched && matched !== q.correct_answer;
          return (
            <button
              key={q.id}
              disabled={submitted}
              onClick={() => setSelectedLeft(q.id)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                selectedLeft === q.id  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' :
                isCorrect              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' :
                isWrong                ? 'bg-red-600/20 border-red-500 text-red-300' :
                matched                ? 'bg-slate-700 border-slate-600 text-slate-300' :
                'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {q.sentence}
              {matched && <span className="ml-2 text-xs text-slate-500">→ {matched}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Translations</p>
        {shuffledRight.map(q => {
          const used = usedRight.has(q.correct_answer);
          return (
            <button
              key={q.id}
              disabled={submitted || (used && !selectedLeft)}
              onClick={() => handleRight(q.correct_answer)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                used
                  ? 'bg-slate-700 border-slate-600 text-slate-500 cursor-default'
                  : selectedLeft
                    ? 'bg-slate-800 border-indigo-500/50 text-slate-200 hover:bg-indigo-600/10 hover:border-indigo-500'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {q.correct_answer}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Main ExerciseTaker
// ============================================================================
const ExerciseTaker: React.FC<Props> = ({ exerciseId, onBack }) => {
  const [exercise, setExercise] = useState<ExerciseWithQuestions | null>(null);
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const [matches, setMatches]   = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [userId, setUserId]     = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    load();
  }, [exerciseId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*, exercise_questions(*)')
      .eq('id', exerciseId)
      .single();
    if (data) {
      const ex = data as unknown as ExerciseWithQuestions;
      ex.exercise_questions.sort((a, b) => a.position - b.position);
      setExercise(ex);
    }
    setLoading(false);
  };

  const submit = async () => {
    if (!exercise || !userId) return;
    const questions = exercise.exercise_questions;
    let correct = 0;
    const records: AnswerRecord[] = questions.map(q => {
      const given = exercise.type === 'matching' ? (matches[q.id] ?? '') : (answers[q.id] ?? '');
      const ok = given.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      if (ok) correct++;
      return { question_id: q.id, given, correct: q.correct_answer, ok };
    });

    setScore(correct);
    setSubmitted(true);

    await supabase.from('student_results').insert({
      student_id:  userId,
      exercise_id: exerciseId,
      score:       correct,
      total:       questions.length,
      answers:     records,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }
  if (!exercise) return null;

  const questions = exercise.exercise_questions;
  const allAnswered = exercise.type === 'matching'
    ? Object.keys(matches).length === questions.length
    : questions.every(q => answers[q.id]?.trim());

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="font-semibold text-slate-100">{exercise.title}</p>
          <p className="text-xs text-slate-500 capitalize">{exercise.type.replace('_', ' ')} · {questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Result banner */}
      {submitted && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${
          score === questions.length
            ? 'bg-emerald-600/10 border-emerald-500/30'
            : score >= questions.length / 2
              ? 'bg-indigo-600/10 border-indigo-500/30'
              : 'bg-red-600/10 border-red-500/30'
        }`}>
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <p className="font-semibold text-slate-100">{score} / {questions.length} correct</p>
            <p className="text-xs text-slate-400">
              {score === questions.length ? 'Perfect! Well done.' : score >= questions.length / 2 ? 'Good effort!' : 'Keep practising!'}
            </p>
          </div>
        </div>
      )}

      {/* Questions */}
      {exercise.type === 'matching' ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <Matching
            questions={questions}
            matches={matches}
            onMatch={(leftId, right) => setMatches(prev => ({ ...prev, [leftId]: right }))}
            submitted={submitted}
          />
        </div>
      ) : (
        questions.map((q, i) => {
          const given   = answers[q.id] ?? '';
          const isRight = submitted && given.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
          return (
            <div key={q.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Question {i + 1}</p>
              {exercise.type === 'fill_gap' ? (
                <FillGap
                  sentence={q.sentence}
                  value={given}
                  onChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                  submitted={submitted}
                  correct={isRight}
                  answer={q.correct_answer}
                />
              ) : (
                <MultipleChoice
                  sentence={q.sentence}
                  options={q.options ?? []}
                  value={given}
                  onChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                  submitted={submitted}
                  correct={isRight}
                  answer={q.correct_answer}
                />
              )}
            </div>
          );
        })
      )}

      {!submitted && (
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
        >
          Submit Answers
        </button>
      )}

      {submitted && (
        <button
          onClick={onBack}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all"
        >
          Back to Assignments
        </button>
      )}
    </div>
  );
};

export default ExerciseTaker;
