import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Flag,
  Play,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { QUESTIONS_BY_SUBJECT } from '../data/questions';
import { SUBJECTS, SUBJECT_MAP } from '../data/syllabus';
import {
  MockSectionScore,
  MockTestAnswerRecord,
  MockTestResult,
  Question,
  SubjectId,
  TutorContext,
} from '../types/aissee';
import { SUBJECT_COLORS } from '../utils/theme';

interface MockTestViewProps {
  onSubmitMockTest: (result: MockTestResult) => void;
  onAskTutor: (prompt: string, context: TutorContext) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatTimer(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export const MockTestView: React.FC<MockTestViewProps> = ({
  onSubmitMockTest,
  onAskTutor,
}) => {
  const [phase, setPhase] = useState<'hub' | 'active' | 'result'>('hub');
  const [selectedSectionalSubject, setSelectedSectionalSubject] = useState<SubjectId>('mathematics');

  // Active exam state
  const [examTitle, setExamTitle] = useState('');
  const [examMode, setExamMode] = useState<'full' | 'diagnostic' | 'sectional'>('full');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number | null>>({});
  const [markedReview, setMarkedReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalDurationSec, setTotalDurationSec] = useState(180 * 60);
  const [secondsLeft, setSecondsLeft] = useState(180 * 60);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Result state
  const [lastResult, setLastResult] = useState<MockTestResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'marked' | 'unattempted'>('all');

  const startTest = (mode: 'full' | 'diagnostic' | 'sectional') => {
    let selected: Question[] = [];
    let title = '';
    let durationSec = 180 * 60;

    if (mode === 'full') {
      // Official 150 Qs distribution: 50 Math, 25 Intel, 25 Eng, 25 Sci, 25 Soc
      selected = [
        ...shuffleArray(QUESTIONS_BY_SUBJECT.mathematics).slice(0, 50),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.intelligence).slice(0, 25),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.english).slice(0, 25),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.science).slice(0, 25),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.social).slice(0, 25),
      ];
      title = 'AISSEE Class 9 Full Simulation (150 Qs · 400 Marks)';
      durationSec = 180 * 60;
    } else if (mode === 'diagnostic') {
      selected = [
        ...shuffleArray(QUESTIONS_BY_SUBJECT.mathematics).slice(0, 5),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.intelligence).slice(0, 5),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.english).slice(0, 5),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.science).slice(0, 5),
        ...shuffleArray(QUESTIONS_BY_SUBJECT.social).slice(0, 5),
      ];
      title = 'Quick 5-Section Diagnostic Test (25 Qs · 60 Marks)';
      durationSec = 30 * 60;
    } else {
      const subMeta = SUBJECT_MAP[selectedSectionalSubject];
      const pool = shuffleArray(QUESTIONS_BY_SUBJECT[selectedSectionalSubject]);
      selected = pool.slice(0, subMeta.questionCount);
      title = `Section ${subMeta.sectionCode}: ${subMeta.name} Timed Test (${selected.length} Qs · ${subMeta.totalMarks} Marks)`;
      durationSec = selectedSectionalSubject === 'mathematics' ? 60 * 60 : 30 * 60;
    }

    const initialVisited: Record<string, boolean> = {};
    if (selected[0]) {
      initialVisited[selected[0].id] = true;
    }

    setExamMode(mode);
    setExamTitle(title);
    setExamQuestions(selected);
    setResponses({});
    setMarkedReview({});
    setVisited(initialVisited);
    setCurrentIdx(0);
    setTotalDurationSec(durationSec);
    setSecondsLeft(durationSec);
    setConfirmSubmitOpen(false);
    setPhase('active');
  };

  const finalizeTest = () => {
    const timeTakenSeconds = Math.max(1, totalDurationSec - secondsLeft);

    const subjectOrder: SubjectId[] = Array.from(
      new Set(examQuestions.map((q) => q.subject))
    );

    const sections: MockSectionScore[] = subjectOrder.map((subId) => {
      const subMeta = SUBJECT_MAP[subId];
      const subQs = examQuestions.filter((q) => q.subject === subId);
      let attempted = 0;
      let correct = 0;
      for (const q of subQs) {
        const sel = responses[q.id] ?? null;
        if (sel !== null) {
          attempted += 1;
          if (sel === q.correctIndex) correct += 1;
        }
      }
      const maxMarks = subQs.length * subMeta.marksPerQuestion;
      const scoredMarks = correct * subMeta.marksPerQuestion;
      const percentage = maxMarks > 0 ? Math.round((scoredMarks / maxMarks) * 100) : 0;

      return {
        subject: subId,
        name: subMeta.name,
        totalQuestions: subQs.length,
        attempted,
        correct,
        marksPerQuestion: subMeta.marksPerQuestion,
        scoredMarks,
        maxMarks,
        percentage,
        qualifiedSection: percentage >= 25,
      };
    });

    const totalMarks = sections.reduce((sum, s) => sum + s.scoredMarks, 0);
    const maxMarks = sections.reduce((sum, s) => sum + s.maxMarks, 0);
    const attemptedCount = sections.reduce((sum, s) => sum + s.attempted, 0);
    const correctCount = sections.reduce((sum, s) => sum + s.correct, 0);
    const overallPercentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const allSectionsQualified = sections.every((s) => s.qualifiedSection);
    const qualifiedOverall = allSectionsQualified && overallPercentage >= 40;

    const answers: MockTestAnswerRecord[] = examQuestions.map((q) => ({
      questionId: q.id,
      subject: q.subject,
      chapter: q.chapter,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex: responses[q.id] ?? null,
      markedForReview: Boolean(markedReview[q.id]),
      explanation: q.explanation,
      source: q.source,
    }));

    const result: MockTestResult = {
      id: `mock-${Date.now()}`,
      title: examTitle,
      mode: examMode,
      date: new Date().toISOString(),
      durationSeconds: totalDurationSec,
      timeTakenSeconds,
      totalQuestions: examQuestions.length,
      attemptedCount,
      correctCount,
      totalMarks,
      maxMarks,
      percentage: overallPercentage,
      qualifiedOverall,
      sections,
      answers,
    };

    onSubmitMockTest(result);
    setLastResult(result);
    setReviewFilter('all');
    setConfirmSubmitOpen(false);
    setPhase('result');
  };

  // Countdown timer effect
  useEffect(() => {
    if (phase !== 'active') return;
    if (secondsLeft <= 0) {
      finalizeTest();
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, secondsLeft]);

  const jumpToQuestion = (index: number) => {
    const q = examQuestions[index];
    if (!q) return;
    setCurrentIdx(index);
    setVisited((prev) => ({ ...prev, [q.id]: true }));
  };

  const activeSectionsInExam = useMemo(() => {
    const map = new Map<SubjectId, number>();
    examQuestions.forEach((q, idx) => {
      if (!map.has(q.subject)) map.set(q.subject, idx);
    });
    return Array.from(map.entries()).map(([subjectId, firstIdx]) => ({
      subjectId,
      name: SUBJECT_MAP[subjectId].shortName,
      firstIdx,
    }));
  }, [examQuestions]);

  // HUB VIEW
  if (phase === 'hub') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Main Full Exam Simulation Hero */}
        <section className="rounded-xl bg-[#0D1629] border border-rose-500/35 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-medium text-rose-400">
                Official NTA AISSEE Class 9 Blueprint · Original Curated Simulation
              </div>
              <h2 className="font-display text-2xl font-bold text-white">
                Full 150-Question Examination Simulation
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Experience the exact 3-hour (180-minute) AISSEE Class 9 paper structure: Mathematics (50 Qs × 4 marks) plus Intelligence, English, General Science, and Social Science (25 Qs × 2 marks each). Zero negative marking. Evaluates NTA’s 25% subject cutoff and 40% aggregate rule automatically.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span><strong className="font-mono tabular-nums text-sky-400">150</strong> Unique Questions</span>
                <span aria-hidden="true">·</span>
                <span><strong className="font-mono tabular-nums text-emerald-400">400</strong> Total Marks</span>
                <span aria-hidden="true">·</span>
                <span><strong className="font-mono tabular-nums text-amber-400">180</strong> Minutes Timer</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startTest('full')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:brightness-110 text-white text-sm font-semibold transition-all whitespace-nowrap shrink-0 shadow-sm"
            >
              <Play className="h-4 w-4" />
              <span>Start Full 150-Q Mock</span>
            </button>
          </div>
        </section>

        {/* Secondary Modes: Quick Diagnostic & Sectional Timed Drill */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-xl bg-[#0D1629] border border-emerald-500/30 p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
            <div className="space-y-2">
              <div className="text-xs text-emerald-400 font-medium">30 Minutes · 25 Questions · 60 Marks</div>
              <h3 className="font-display text-lg font-bold text-white">
                Quick 5-Section Diagnostic Test
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                A balanced mini-exam sampling 5 questions from each of the 5 AISSEE subjects. Ideal for a rapid readiness check on busy school days.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startTest('diagnostic')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-semibold transition-all self-start"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start 30-Min Diagnostic</span>
            </button>
          </section>

          <section className="rounded-xl bg-[#0D1629] border border-violet-500/30 p-6 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-400" />
            <div className="space-y-3">
              <div className="text-xs text-violet-400 font-medium">Focused Subject Simulation</div>
              <h3 className="font-display text-lg font-bold text-white">
                Single-Subject Timed Paper
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Practice the complete official question count for any single section under timed exam pressure.
              </p>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Choose Section</label>
                <select
                  value={selectedSectionalSubject}
                  onChange={(e) => setSelectedSectionalSubject(e.target.value as SubjectId)}
                  className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  {SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      Section {sub.sectionCode}: {sub.name} ({sub.questionCount} Qs · {sub.totalMarks} Marks)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startTest('sectional')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:brightness-110 text-white text-xs font-semibold transition-all self-start"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Start Sectional Test</span>
            </button>
          </section>
        </div>

        <p className="text-xs text-slate-400">
          Note: All mock tests draw from our original NCERT Class 8 aligned practice bank and are not official NTA previous-year question papers.
        </p>
      </motion.div>
    );
  }

  // ACTIVE EXAM INTERFACE
  if (phase === 'active') {
    const q = examQuestions[currentIdx];
    if (!q) return null;

    const selectedOpt = responses[q.id] ?? null;
    const isMarked = Boolean(markedReview[q.id]);
    const answeredTotal = examQuestions.filter((item) => responses[item.id] != null).length;
    const markedTotal = examQuestions.filter((item) => markedReview[item.id]).length;
    const urgentTime = secondsLeft < 300;

    return (
      <div className="space-y-5">
        {/* Top Exam Status Bar */}
        <div className="rounded-xl bg-[#0D1629] border border-slate-800/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-display text-sm font-semibold text-white truncate">{examTitle}</div>
            <div className="text-xs text-slate-400">
              Answered: <span className="font-mono tabular-nums text-emerald-400">{answeredTotal}</span>/{examQuestions.length}
              <span aria-hidden="true" className="mx-2">·</span>
              Marked for Review: <span className="font-mono tabular-nums text-amber-400">{markedTotal}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border font-mono tabular-nums text-sm font-bold ${
                urgentTime
                  ? 'bg-rose-950/60 border-rose-500/70 text-rose-300'
                  : 'bg-[#080F1F] border-slate-700 text-sky-400'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        {activeSectionsInExam.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1324] border border-slate-800/90">
            {activeSectionsInExam.map((sec) => {
              const isCurrentSection = q.subject === sec.subjectId;
              const secTheme = SUBJECT_COLORS[sec.subjectId];
              return (
                <button
                  key={sec.subjectId}
                  type="button"
                  onClick={() => jumpToQuestion(sec.firstIdx)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isCurrentSection
                      ? secTheme.activeTab
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {sec.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Exam Split Grid: Question Area + Question Navigator Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Question Canvas */}
          <section className={`lg:col-span-8 rounded-xl bg-[#0D1629] border ${SUBJECT_COLORS[q.subject].border} overflow-hidden`}>
            <div className={`h-1 w-full ${SUBJECT_COLORS[q.subject].bar}`} />
            <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/80 text-xs text-slate-400">
              <div>
                <span className={`font-mono tabular-nums font-semibold ${SUBJECT_COLORS[q.subject].text}`}>
                  Q.{currentIdx + 1}
                </span>
                <span aria-hidden="true" className="mx-2">·</span>
                <span className={`font-semibold ${SUBJECT_COLORS[q.subject].text}`}>
                  {SUBJECT_MAP[q.subject].name}
                </span>
                <span aria-hidden="true" className="mx-2">·</span>
                <span>{q.chapter}</span>
              </div>
              <div className="font-mono tabular-nums text-emerald-400 font-medium">
                +{SUBJECT_MAP[q.subject].marksPerQuestion} Marks · No Negative
              </div>
            </div>

            <h3 className="font-display text-base sm:text-lg font-semibold text-white leading-relaxed">
              {q.question}
            </h3>

            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={`${q.id}-mock-opt-${idx}`}
                    type="button"
                    onClick={() =>
                      setResponses((prev) => ({
                        ...prev,
                        [q.id]: idx,
                      }))
                    }
                    className={`w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#081020] border-slate-800 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className={`font-mono text-xs font-bold h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="text-sm sm:text-base">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMarkedReview((prev) => ({
                      ...prev,
                      [q.id]: !prev[q.id],
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    isMarked
                      ? 'bg-amber-600/20 border-amber-500/70 text-amber-300'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setResponses((prev) => ({
                      ...prev,
                      [q.id]: null,
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  <span>Clear Response</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => jumpToQuestion(currentIdx - 1)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-medium"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={currentIdx >= examQuestions.length - 1}
                  onClick={() => jumpToQuestion(currentIdx + 1)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold"
                >
                  <span>Save &amp; Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            </div>
          </section>

          {/* Right: Question Navigator Palette */}
          <aside className="lg:col-span-4 rounded-xl bg-[#0D1629] border border-slate-800/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-white">Question Navigator</h4>
              <span className="font-mono tabular-nums text-xs text-slate-400">
                {examQuestions.length} Qs
              </span>
            </div>

            {/* Palette Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-emerald-600 inline-block shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-amber-500 inline-block shrink-0" />
                <span>Marked Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-slate-700 inline-block shrink-0" />
                <span>Visited / Blank</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-xs bg-[#081020] border border-slate-700 inline-block shrink-0" />
                <span>Not Visited</span>
              </div>
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {examQuestions.map((item, idx) => {
                const isAns = responses[item.id] != null;
                const isRev = Boolean(markedReview[item.id]);
                const isVis = Boolean(visited[item.id]);
                const isCurr = idx === currentIdx;

                let btnStyle = 'bg-[#081020] border-slate-800 text-slate-400';
                if (isRev && isAns) {
                  btnStyle = 'bg-amber-600/30 border-amber-400 text-amber-200';
                } else if (isRev) {
                  btnStyle = 'bg-amber-600/20 border-amber-500 text-amber-300';
                } else if (isAns) {
                  btnStyle = 'bg-emerald-600/25 border-emerald-500 text-emerald-200';
                } else if (isVis) {
                  btnStyle = 'bg-slate-800 border-slate-700 text-slate-200';
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToQuestion(idx)}
                    className={`h-9 rounded-lg border font-mono tabular-nums text-xs font-semibold transition-colors ${btnStyle} ${
                      isCurr ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#0D1629]' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        {/* In-App Confirmation Modal (no window.confirm) */}
        {confirmSubmitOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-xl bg-[#0D1629] border border-slate-700 p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-white font-display text-lg font-bold">
                <Flag className="h-5 w-5 text-blue-400" />
                <span>Submit Examination?</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                You have answered{' '}
                <strong className="font-mono tabular-nums text-white">{answeredTotal}</strong> out of{' '}
                <strong className="font-mono tabular-nums text-white">{examQuestions.length}</strong> questions
                {markedTotal > 0 ? ` (${markedTotal} marked for review)` : ''}. There is no negative marking in AISSEE.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmSubmitOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  onClick={finalizeTest}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Confirm &amp; Evaluate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DETAILED RESULTS VIEW
  if (phase === 'result' && lastResult) {
    const filteredAnswers = lastResult.answers.filter((ans) => {
      if (reviewFilter === 'incorrect') {
        return ans.selectedIndex !== null && ans.selectedIndex !== ans.correctIndex;
      }
      if (reviewFilter === 'marked') return ans.markedForReview;
      if (reviewFilter === 'unattempted') return ans.selectedIndex === null;
      return true;
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Scorecard Summary Header */}
        <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-sky-400 font-medium">Evaluation Complete</div>
              <h2 className="font-display text-xl font-bold text-white mt-0.5">
                {lastResult.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPhase('hub')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Back to Mock Test Hub
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg bg-[#080F1F] border border-slate-800 p-4">
              <div className="text-xs text-slate-400">Total Score</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-white mt-1">
                {lastResult.totalMarks} / {lastResult.maxMarks}
              </div>
              <div className="font-mono tabular-nums text-xs text-sky-400 mt-0.5">
                {lastResult.percentage}% Aggregate
              </div>
            </div>

            <div className="rounded-lg bg-[#080F1F] border border-slate-800 p-4">
              <div className="text-xs text-slate-400">NTA Qualifying Check</div>
              <div
                className={`mt-1 flex items-center gap-1.5 text-base font-bold ${
                  lastResult.qualifiedOverall ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {lastResult.qualifiedOverall ? (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    <span>Qualified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    <span>Below Cutoff</span>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Req: ≥25% each section &amp; ≥40% total
              </div>
            </div>

            <div className="rounded-lg bg-[#080F1F] border border-slate-800 p-4">
              <div className="text-xs text-slate-400">Accuracy</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-white mt-1">
                {lastResult.attemptedCount > 0
                  ? `${Math.round((lastResult.correctCount / lastResult.attemptedCount) * 100)}%`
                  : '0%'}
              </div>
              <div className="font-mono tabular-nums text-xs text-slate-400 mt-0.5">
                {lastResult.correctCount} correct · {lastResult.attemptedCount} attempted
              </div>
            </div>

            <div className="rounded-lg bg-[#080F1F] border border-slate-800 p-4">
              <div className="text-xs text-slate-400">Time Taken</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-white mt-1">
                {formatTimer(lastResult.timeTakenSeconds)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                of {formatTimer(lastResult.durationSeconds)} allotted
              </div>
            </div>
          </div>

          {/* Section-Wise Cutoff Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Section</th>
                  <th className="py-2.5 px-4 font-medium text-right">Attempted</th>
                  <th className="py-2.5 px-4 font-medium text-right">Correct</th>
                  <th className="py-2.5 px-4 font-medium text-right">Marks</th>
                  <th className="py-2.5 px-4 font-medium text-right">Score %</th>
                  <th className="py-2.5 pl-4 font-medium text-right">25% Cutoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {lastResult.sections.map((sec) => {
                  const secTheme = SUBJECT_COLORS[sec.subject];
                  return (
                    <tr key={sec.subject}>
                      <td className={`py-2.5 pr-4 font-semibold ${secTheme.text}`}>{sec.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {sec.attempted}/{sec.totalQuestions}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">
                        {sec.correct}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                        {sec.scoredMarks}/{sec.maxMarks}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold ${secTheme.text}`}>
                        {sec.percentage}%
                      </td>
                      <td className="py-2.5 pl-4 text-right text-xs font-semibold">
                        {sec.qualifiedSection ? (
                          <span className="text-emerald-400">Cleared</span>
                        ) : (
                          <span className="text-rose-400">Below 25%</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detailed Question-by-Question Review */}
        <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-semibold text-white">
              Answer Key &amp; Detailed Explanations
            </h3>
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#080F1F] border border-slate-800">
              {(
                [
                  { id: 'all', label: `All (${lastResult.answers.length})` },
                  {
                    id: 'incorrect',
                    label: `Incorrect (${
                      lastResult.answers.filter(
                        (a) => a.selectedIndex !== null && a.selectedIndex !== a.correctIndex
                      ).length
                    })`,
                  },
                  {
                    id: 'unattempted',
                    label: `Skipped (${
                      lastResult.answers.filter((a) => a.selectedIndex === null).length
                    })`,
                  },
                  {
                    id: 'marked',
                    label: `Marked (${
                      lastResult.answers.filter((a) => a.markedForReview).length
                    })`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReviewFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    reviewFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {filteredAnswers.length === 0 ? (
              <p className="py-6 text-sm text-slate-400 text-center">
                No questions in this filter category.
              </p>
            ) : (
              filteredAnswers.map((ans, idx) => {
                const isCorrect = ans.selectedIndex === ans.correctIndex;
                const isSkipped = ans.selectedIndex === null;

                return (
                  <div key={`${ans.questionId}-${idx}`} className="py-5 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-slate-400">
                        <span className="font-semibold text-slate-200">
                          {SUBJECT_MAP[ans.subject].name}
                        </span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span>{ans.chapter}</span>
                      </div>
                      <div className="font-semibold inline-flex items-center gap-1">
                        {isSkipped ? (
                          <span className="text-slate-400">Unattempted</span>
                        ) : isCorrect ? (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="text-rose-400 inline-flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-white">{ans.question}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-[#081020] border border-slate-800 px-3 py-2 text-slate-300">
                        Your Answer:{' '}
                        <strong className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                          {ans.selectedIndex !== null
                            ? `${OPTION_LETTERS[ans.selectedIndex]}. ${ans.options[ans.selectedIndex]}`
                            : 'Skipped'}
                        </strong>
                      </div>
                      <div className="rounded-lg bg-[#081020] border border-emerald-900/60 px-3 py-2 text-slate-300">
                        Correct Answer:{' '}
                        <strong className="text-emerald-400">
                          {OPTION_LETTERS[ans.correctIndex]}. {ans.options[ans.correctIndex]}
                        </strong>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <span className="text-slate-100 font-medium">Explanation: </span>
                      {ans.explanation}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onAskTutor(
                          `Please help me understand this mock test question step-by-step:\n\n${ans.question}`,
                          {
                            subject: SUBJECT_MAP[ans.subject].name,
                            chapter: ans.chapter,
                            questionText: ans.question,
                            options: ans.options,
                            correctAnswer: `${OPTION_LETTERS[ans.correctIndex]}. ${ans.options[ans.correctIndex]}`,
                            explanation: ans.explanation,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Discuss with AI Tutor</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </motion.div>
    );
  }

  return null;
};
