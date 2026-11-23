import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Flame,
  Sparkles,
  Target,
} from 'lucide-react';
import { motion } from 'motion/react';
import { OFFICIAL_EXAM_PATTERN, SUBJECTS } from '../data/syllabus';
import { NavSection, SubjectId, UserProgress } from '../types/aissee';
import { computeOverallAnalytics } from '../utils/analytics';
import { SUBJECT_COLORS } from '../utils/theme';

interface DashboardViewProps {
  progress: UserProgress;
  onUpdateProfile: (updates: Partial<Pick<UserProgress, 'cadetName' | 'targetExamDate' | 'dailyGoal'>>) => void;
  onNavigate: (section: NavSection) => void;
  onPracticeSubject: (subject: SubjectId, chapter?: string) => void;
  onAskTutor: (prompt: string) => void;
}

function getCountdownParts(targetIso: string) {
  const targetMs = new Date(targetIso).getTime();
  const nowMs = Date.now();
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  onUpdateProfile,
  onNavigate,
  onPracticeSubject,
  onAskTutor,
}) => {
  const [countdown, setCountdown] = useState(() => getCountdownParts(progress.targetExamDate));
  const [editingDate, setEditingDate] = useState(false);
  const [draftDate, setDraftDate] = useState(progress.targetExamDate);
  const [draftName, setDraftName] = useState(progress.cadetName);

  useEffect(() => {
    setCountdown(getCountdownParts(progress.targetExamDate));
    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts(progress.targetExamDate));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [progress.targetExamDate]);

  const analytics = computeOverallAnalytics(progress);
  const recentMocks = progress.mockTests.slice(0, 4);
  const latestMock = progress.mockTests[0] ?? null;

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftDate) {
      onUpdateProfile({
        targetExamDate: draftDate,
        cadetName: draftName.trim() || 'Cadet Aspirant',
      });
    }
    setEditingDate(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Hero Readiness & Exam Countdown Split */}
      <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-violet-500 via-emerald-400 to-amber-400" />
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="text-sky-400">NTA AISSEE Class IX</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">150 MCQs · 400 Marks</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-amber-400">3 Hours · No Negative Marking</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
              Welcome back, {progress.cadetName}. Stay sharp for Sainik School Class 9.
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              To qualify under NTA guidelines, score at least 25% in every subject and 40% aggregate (160/400).
              Focus on Mathematics (200 marks) while keeping all four remaining sections above cutoff.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white text-sm font-semibold transition-all whitespace-nowrap shrink-0 shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start Chapter Practice</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ai-tutor')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-200 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Bot className="h-4 w-4 text-violet-400" />
                <span>Ask AI Teacher</span>
              </button>
            </div>
          </div>

          {/* Live Exam Countdown Panel */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-800/80 lg:pl-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>Exam Countdown</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftDate(progress.targetExamDate);
                  setDraftName(progress.cadetName);
                  setEditingDate((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium whitespace-nowrap"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{editingDate ? 'Cancel' : 'Edit Target'}</span>
              </button>
            </div>

            {editingDate ? (
              <form onSubmit={handleSaveTarget} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cadet Name</label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={40}
                    className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target AISSEE Exam Date & Time</label>
                  <input
                    type="datetime-local"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                >
                  Save Schedule
                </button>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2.5 text-center">
                  {[
                    { label: 'Days', value: countdown.days, color: 'text-sky-400 border-sky-500/30' },
                    { label: 'Hours', value: countdown.hours, color: 'text-violet-400 border-violet-500/30' },
                    { label: 'Mins', value: countdown.minutes, color: 'text-emerald-400 border-emerald-500/30' },
                    { label: 'Secs', value: countdown.seconds, color: 'text-amber-400 border-amber-500/30' },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className={`rounded-lg bg-[#080F1F] border py-3 px-2 ${unit.color.split(' ')[1]}`}
                    >
                      <div className={`font-mono tabular-nums text-2xl sm:text-3xl font-bold ${unit.color.split(' ')[0]}`}>
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{unit.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>
                    Target:{' '}
                    <span className="text-slate-200 font-medium">
                      {new Date(progress.targetExamDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                  <span className="text-slate-500">NTA January Window</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Primary KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#0D1629] border border-amber-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-400" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Study Streak</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-amber-300">
            {analytics.streak} {analytics.streak === 1 ? 'Day' : 'Days'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Today: <span className="font-mono tabular-nums text-slate-200">{analytics.todayCount}</span> /{' '}
            <span className="font-mono tabular-nums">{progress.dailyGoal}</span> Qs goal
          </div>
        </div>

        <div className="rounded-xl bg-[#0D1629] border border-sky-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-sky-400" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Questions Attempted</span>
            <CheckCircle2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-sky-300">
            {analytics.totalAttempted}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            <span className="font-mono tabular-nums text-emerald-400">{analytics.totalCorrect}</span> correct responses
          </div>
        </div>

        <div className="rounded-xl bg-[#0D1629] border border-emerald-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Accuracy</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-emerald-300">
            {analytics.totalAttempted > 0 ? `${analytics.accuracy}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {analytics.totalAttempted === 0
              ? 'Solve a question to measure'
              : analytics.accuracy >= 75
              ? 'Strong exam-ready accuracy'
              : analytics.accuracy >= 50
              ? 'Building momentum'
              : 'Focus on fundamentals'}
          </div>
        </div>

        <div className="rounded-xl bg-[#0D1629] border border-fuchsia-500/30 p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-rose-400" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Latest Mock Score</span>
            <ClipboardCheck className="h-4 w-4 text-fuchsia-400" />
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-fuchsia-300">
            {latestMock ? `${latestMock.totalMarks}/${latestMock.maxMarks}` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {latestMock
              ? `${latestMock.percentage}% · ${latestMock.qualifiedOverall ? 'Qualified' : 'Below Cutoff'}`
              : `${progress.mockTests.length} completed mocks`}
          </div>
        </div>
      </section>

      {/* Main Two-Column Grid: Subject Readiness + Weak Areas & Recent Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subject Performance Matrix */}
        <section className="lg:col-span-7 rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold text-white">
                Subject Readiness & Weightage
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official NTA AISSEE Class 9 marking distribution across 5 sections
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="text-xs font-medium text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>View Syllabus</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {analytics.subjectStats.map((sub) => {
              const theme = SUBJECT_COLORS[sub.subjectId];
              const statusLabel =
                sub.attempted === 0
                  ? 'Not Started'
                  : sub.accuracy >= 70
                  ? 'Strong'
                  : sub.accuracy >= 45
                  ? 'Developing'
                  : 'Needs Attention';

              const statusColor =
                sub.attempted === 0
                  ? 'text-slate-400'
                  : sub.accuracy >= 70
                  ? 'text-emerald-400'
                  : sub.accuracy >= 45
                  ? 'text-amber-400'
                  : 'text-rose-400';

              return (
                <div key={sub.subjectId} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <span className={`font-mono text-xs font-bold ${theme.text}`}>
                          Sec {sub.sectionCode}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{sub.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        <span className="font-mono tabular-nums">{sub.totalQuestionsInExam}</span> Qs
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums">{sub.totalMarksInExam}</span> Marks
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums">{sub.attempted}</span> attempted
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className={`font-mono tabular-nums text-sm font-semibold ${sub.attempted > 0 ? theme.text : 'text-white'}`}>
                          {sub.attempted > 0 ? `${sub.accuracy}%` : '—'}
                        </div>
                        <div className={`text-[11px] font-medium ${statusColor}`}>{statusLabel}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPracticeSubject(sub.subjectId)}
                        className={`px-3 py-1.5 rounded-lg border ${theme.softBg} ${theme.border} ${theme.text} hover:brightness-125 text-xs font-semibold transition-all whitespace-nowrap`}
                      >
                        Practice
                      </button>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sub.attempted === 0 ? 'bg-slate-700' : theme.bar
                      }`}
                      style={{ width: `${sub.attempted > 0 ? Math.max(sub.accuracy, 4) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Weak Areas + Recent Mock Tests */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weak Subjects & Chapters */}
          <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="font-display text-base font-semibold text-white">
                  Weak Subjects & Focus Areas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('progress')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium whitespace-nowrap"
              >
                Full Report
              </button>
            </div>

            {analytics.totalAttempted === 0 ? (
              <div className="py-4 space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  No practice attempts logged yet. Complete a 25-question Quick Diagnostic Mock or practice a few Mathematics problems to pinpoint weak chapters automatically.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPracticeSubject('mathematics')}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    Try Mathematics First
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('ai-generator')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                    <span>Generate Custom Quiz</span>
                  </button>
                </div>
              </div>
            ) : analytics.weakChapters.length === 0 && analytics.weakSubjects.length === 0 ? (
              <div className="py-3 space-y-2">
                <p className="text-sm text-emerald-400 font-medium">
                  All attempted chapters are currently at 70%+ accuracy.
                </p>
                <p className="text-xs text-slate-400">
                  Challenge yourself with Hard-level questions or a full 150-question NTA simulation to stress-test your speed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {(analytics.weakChapters.length > 0 ? analytics.weakChapters.slice(0, 4) : []).map(
                  (ch) => (
                    <div key={`${ch.subjectId}-${ch.chapter}`} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{ch.chapter}</div>
                        <div className="text-xs text-slate-400">
                          {ch.subjectName} · <span className="font-mono tabular-nums text-rose-400">{ch.accuracy}%</span> ({ch.correct}/{ch.attempted})
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onAskTutor(
                              `Explain the key concepts and common mistakes in "${ch.chapter}" (${ch.subjectName}) for AISSEE Class 9.`
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium whitespace-nowrap"
                        >
                          Tutor
                        </button>
                        <button
                          type="button"
                          onClick={() => onPracticeSubject(ch.subjectId, ch.chapter)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium whitespace-nowrap transition-colors"
                        >
                          Drill
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* Recent Test Results */}
          <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">
                Recent Test Results
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('mock-test')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
              >
                Take Mock Test
              </button>
            </div>

            {recentMocks.length === 0 ? (
              <div className="py-3 space-y-3">
                <p className="text-sm text-slate-400">
                  No mock tests submitted yet. Attempt the 25-question Quick Diagnostic or the full 150-question AISSEE Class 9 simulation.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('mock-test')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <ClipboardCheck className="h-3.5 w-3.5 text-blue-400" />
                  <span>Open Mock Test Center</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentMocks.map((mock) => (
                  <div key={mock.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{mock.title}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(mock.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className={mock.qualifiedOverall ? 'text-emerald-400' : 'text-amber-400'}>
                          {mock.qualifiedOverall ? 'Qualified' : 'Below Cutoff'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums text-sm font-semibold text-white">
                        {mock.totalMarks}/{mock.maxMarks}
                      </div>
                      <div className="font-mono tabular-nums text-xs text-sky-400">
                        {mock.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Official NTA Pattern Reference Footer Strip */}
      <section className="rounded-xl bg-[#0B1324] border border-slate-800/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-200">
            Official Examination Standard: {OFFICIAL_EXAM_PATTERN.examName} ({OFFICIAL_EXAM_PATTERN.targetClass})
          </div>
          <div className="text-xs text-slate-400">
            Conducted by {OFFICIAL_EXAM_PATTERN.conductingBody} · {OFFICIAL_EXAM_PATTERN.mode} · {OFFICIAL_EXAM_PATTERN.medium} · Qualifying: 25% per subject &amp; 40% aggregate.
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {SUBJECTS.reduce((s, x) => s + x.chapters.length, 0)} Official Units Loaded
          </span>
        </div>
      </section>
    </motion.div>
  );
};
