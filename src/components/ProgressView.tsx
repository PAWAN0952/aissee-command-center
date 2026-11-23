import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Download,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MockTestResult, SubjectId, TutorContext, UserProgress } from '../types/aissee';
import { computeOverallAnalytics, getAccuracyByDifficulty } from '../utils/analytics';
import { SUBJECT_COLORS } from '../utils/theme';

interface ProgressViewProps {
  progress: UserProgress;
  onPracticeChapter: (subject: SubjectId, chapter: string) => void;
  onAskTutor: (prompt: string, context?: TutorContext) => void;
  onResetProgress: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  onPracticeChapter,
  onAskTutor,
  onResetProgress,
}) => {
  const [selectedMock, setSelectedMock] = useState<MockTestResult | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const analytics = computeOverallAnalytics(progress);
  const difficultyBreakdown = getAccuracyByDifficulty(progress.attempts);
  const latestMock = progress.mockTests[0] ?? null;

  // Chronological mock trend (oldest -> newest)
  const chronologicalMocks = [...progress.mockTests].reverse();

  const triggerAiMockAnalysis = (mockToAnalyze: MockTestResult) => {
    const sortedSections = [...mockToAnalyze.sections].sort(
      (a, b) => a.percentage - b.percentage
    );
    const weakestSection = sortedSections[0];

    // Identify weak chapters directly from answers in this mock test
    const chapterStatsMap = new Map<
      string,
      { subjectName: string; chapter: string; total: number; correct: number; missed: number }
    >();

    for (const ans of mockToAnalyze.answers) {
      const secName =
        mockToAnalyze.sections.find((s) => s.subject === ans.subject)?.name ?? ans.subject;
      const key = `${ans.subject}::${ans.chapter}`;
      const prev = chapterStatsMap.get(key) ?? {
        subjectName: secName,
        chapter: ans.chapter,
        total: 0,
        correct: 0,
        missed: 0,
      };
      prev.total += 1;
      if (ans.selectedIndex === ans.correctIndex) {
        prev.correct += 1;
      } else {
        prev.missed += 1;
      }
      chapterStatsMap.set(key, prev);
    }

    const mockWeakChapters = Array.from(chapterStatsMap.values())
      .filter((c) => c.missed > 0)
      .sort((a, b) => {
        const accA = a.correct / Math.max(1, a.total);
        const accB = b.correct / Math.max(1, b.total);
        return accA - accB || b.missed - a.missed;
      })
      .slice(0, 6);

    const practiceWeakChapters = analytics.weakChapters
      .filter((wc) => !mockWeakChapters.some((mc) => mc.chapter === wc.chapter))
      .slice(0, 4);

    const sectionSummaryLines = sortedSections.map(
      (s) =>
        `- ${s.name}: ${s.scoredMarks}/${s.maxMarks} marks (${s.percentage}%, ${s.correct}/${s.totalQuestions} correct) — ${
          s.qualifiedSection ? 'Cleared 25% cutoff' : 'Below 25% section cutoff'
        }`
    );

    const mockWeakLines =
      mockWeakChapters.length > 0
        ? mockWeakChapters.map(
            (c) =>
              `- ${c.subjectName} — ${c.chapter}: ${c.correct}/${c.total} correct (${c.missed} wrong/unanswered)`
          )
        : ['- No incorrect answers recorded in this test.'];

    const practiceWeakLines =
      practiceWeakChapters.length > 0
        ? practiceWeakChapters.map(
            (c) => `- ${c.subjectName} — ${c.chapter}: ${c.accuracy}% (${c.correct}/${c.attempted})`
          )
        : [];

    const minutesTaken = Math.max(1, Math.round(mockToAnalyze.timeTakenSeconds / 60));

    const promptParts = [
      `Please evaluate my latest AISSEE mock test results and build a tailored study plan for my weak topics.`,
      ``,
      `Mock Test: ${mockToAnalyze.title}`,
      `Overall Score: ${mockToAnalyze.totalMarks}/${mockToAnalyze.maxMarks} (${mockToAnalyze.percentage}%) · ${mockToAnalyze.correctCount}/${mockToAnalyze.totalQuestions} correct · Time Taken: ${minutesTaken} min`,
      `Overall NTA Cutoff Status: ${
        mockToAnalyze.qualifiedOverall ? 'Qualified (40%+ aggregate)' : 'Below 40% aggregate cutoff'
      }`,
      ``,
      `Section-Wise Performance (weakest first):`,
      ...sectionSummaryLines,
      ``,
      `Weak Topics Missed in This Mock Test:`,
      ...mockWeakLines,
    ];

    if (practiceWeakLines.length > 0) {
      promptParts.push(``, `Additional Weak Chapters from Practice History:`, ...practiceWeakLines);
    }

    promptParts.push(
      ``,
      `Please give me:`,
      `1. A clear evaluation of my strengths, cutoff gaps, and highest-impact mark gainers.`,
      `2. Simple explanations and study tips for my top weak chapters.`,
      `3. A practical 7-day study & practice plan tailored to these weak topics.`,
      `4. One warm-up check question from my weakest topic so we can start improving right away.`
    );

    const prompt = promptParts.join('\n').slice(0, 3600);

    const topWeakChapter = mockWeakChapters[0]?.chapter || analytics.weakChapters[0]?.chapter;

    onAskTutor(prompt, {
      examTrack: 'aissee',
      classLevel: '8',
      subject: weakestSection?.name ?? 'Mathematics',
      chapter: topWeakChapter,
      mode: 'auto',
    });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aissee-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = chronologicalMocks.map((m, idx) => ({
    label: `T${idx + 1}`,
    title: m.title,
    dateLabel: new Date(m.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    }),
    percentage: m.percentage,
    totalMarks: m.totalMarks,
    maxMarks: m.maxMarks,
    qualifiedOverall: m.qualifiedOverall,
  }));

  const scoreDelta =
    chartData.length >= 2
      ? chartData[chartData.length - 1].percentage - chartData[0].percentage
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Persistent Study Log ·{' '}
          <span className="font-mono tabular-nums text-slate-200">{analytics.totalAttempted}</span> attempts ·{' '}
          <span className="font-mono tabular-nums text-slate-200">{progress.mockTests.length}</span> mock tests ·{' '}
          <span className="font-mono tabular-nums text-slate-200">{progress.aiQuestions.length}</span> saved AI questions
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!latestMock}
            onClick={() => latestMock && triggerAiMockAnalysis(latestMock)}
            title={
              latestMock
                ? `Analyze "${latestMock.title}" with AI Tutor`
                : 'Complete a mock test first to run AI Analysis'
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all whitespace-nowrap shadow-sm"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>AI Analysis</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/70 text-slate-300 hover:text-rose-200 text-xs font-medium transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Improvement Trend Chart */}
        <section className="lg:col-span-7 rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              <h3 className="font-display text-base font-semibold text-white">
                Mock Test Improvement Trend
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {scoreDelta !== null && (
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {scoreDelta >= 0 ? `+${scoreDelta}%` : `${scoreDelta}%`} vs T1
                </span>
              )}
              <span className="text-slate-400">40% NTA Qualifying Line</span>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm text-slate-300">No mock test history recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Complete at least one Mock Test to track your score progression over time.
              </p>
            </div>
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 14, right: 16, left: -12, bottom: 4 }}>
                  <defs>
                    <linearGradient id="rechartsMockTrendGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.16)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 40, 75, 100]}
                    tickFormatter={(val: number) => `${val}%`}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={40}
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    label={{
                      value: '40% Cutoff',
                      position: 'insideTopRight',
                      fill: '#10B981',
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const pt = payload[0]?.payload as (typeof chartData)[number] | undefined;
                      if (!pt) return null;
                      return (
                        <div className="rounded-lg bg-white dark:bg-[#081020] border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-lg text-xs space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {pt.label} · {pt.title}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {pt.dateLabel} ·{' '}
                            <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400 font-semibold">
                              {pt.percentage}%
                            </span>{' '}
                            ({pt.totalMarks}/{pt.maxMarks})
                          </div>
                          <div
                            className={`font-semibold ${
                              pt.qualifiedOverall
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {pt.qualifiedOverall ? 'Qualified (40%+)' : 'Below 40% Cutoff'}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Score %"
                    stroke="url(#rechartsMockTrendGrad)"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: '#0D1629',
                      stroke: '#38BDF8',
                      strokeWidth: 2.5,
                    }}
                    activeDot={{
                      r: 7,
                      fill: '#A78BFA',
                      stroke: '#FFFFFF',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Subject Accuracy & Difficulty Breakdown */}
        <section className="lg:col-span-5 rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              Subject &amp; Difficulty Accuracy
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accuracy across all 5 subjects and question difficulty tiers
            </p>
          </div>

          <div className="space-y-3">
            {analytics.subjectStats.map((sub) => {
              const theme = SUBJECT_COLORS[sub.subjectId];
              return (
                <div key={sub.subjectId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${theme.text}`}>{sub.name}</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {sub.attempted > 0 ? `${sub.accuracy}% (${sub.correct}/${sub.attempted})` : 'No attempts'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${theme.bar} transition-all duration-300`}
                      style={{ width: `${sub.attempted > 0 ? Math.max(sub.accuracy, 4) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
            {difficultyBreakdown.map((d) => {
              const diffStyle =
                d.difficulty === 'Easy'
                  ? 'border-emerald-500/35 text-emerald-400'
                  : d.difficulty === 'Medium'
                  ? 'border-amber-500/35 text-amber-400'
                  : 'border-rose-500/35 text-rose-400';
              return (
                <div
                  key={d.difficulty}
                  className={`rounded-lg bg-[#080F1F] border py-2.5 px-2 ${diffStyle.split(' ')[0]}`}
                >
                  <div className={`text-[11px] font-medium ${diffStyle.split(' ')[1]}`}>{d.difficulty}</div>
                  <div className="font-mono tabular-nums text-sm font-bold text-white mt-0.5">
                    {d.attempted > 0 ? `${d.accuracy}%` : '—'}
                  </div>
                  <div className="font-mono tabular-nums text-[10px] text-slate-500">
                    {d.correct}/{d.attempted}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Weak Chapters & Chapter Mastery Table */}
      <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-white">
            Chapter Mastery &amp; Weak Chapter Diagnostics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chapters are ordered by lowest attempted accuracy first so you can target weak areas immediately.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Chapter</th>
                <th className="py-2.5 px-4 font-medium">Subject</th>
                <th className="py-2.5 px-4 font-medium text-right">Attempted</th>
                <th className="py-2.5 px-4 font-medium text-right">Accuracy</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 pl-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {[...analytics.allChapterStats]
                .sort((a, b) => {
                  if (a.attempted === 0 && b.attempted > 0) return 1;
                  if (b.attempted === 0 && a.attempted > 0) return -1;
                  return a.accuracy - b.accuracy;
                })
                .slice(0, 14)
                .map((ch) => {
                  const statusText =
                    ch.attempted === 0
                      ? 'Untested'
                      : ch.accuracy < 60
                      ? 'Weak Chapter'
                      : ch.accuracy < 80
                      ? 'Moderate'
                      : 'Strong';
                  const statusColor =
                    ch.attempted === 0
                      ? 'text-slate-500'
                      : ch.accuracy < 60
                      ? 'text-rose-400'
                      : ch.accuracy < 80
                      ? 'text-amber-400'
                      : 'text-emerald-400';

                  return (
                    <tr key={`${ch.subjectId}-${ch.chapter}`} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pr-4 font-medium text-white">{ch.chapter}</td>
                      <td className={`py-2.5 px-4 text-xs font-medium ${SUBJECT_COLORS[ch.subjectId].text}`}>
                        {ch.subjectName}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {ch.correct}/{ch.attempted}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                        {ch.attempted > 0 ? `${ch.accuracy}%` : '—'}
                      </td>
                      <td className={`py-2.5 px-4 text-xs font-medium ${statusColor}`}>
                        {statusText}
                      </td>
                      <td className="py-2.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => onPracticeChapter(ch.subjectId, ch.chapter)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
                        >
                          <span>Practice</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mock Test History Table */}
      <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
        <h3 className="font-display text-base font-semibold text-white">Mock Test History</h3>

        {progress.mockTests.length === 0 ? (
          <p className="text-sm text-slate-400">
            No completed mock tests yet. Visit Mock Tests to take your first timed evaluation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Test Name</th>
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium text-right">Score</th>
                  <th className="py-2.5 px-4 font-medium text-right">Percentage</th>
                  <th className="py-2.5 px-4 font-medium">NTA Cutoff</th>
                  <th className="py-2.5 pl-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {progress.mockTests.map((mock) => (
                  <tr key={mock.id} className="hover:bg-slate-800/30">
                    <td className="py-3 pr-4 font-medium text-white">{mock.title}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 font-mono tabular-nums">
                      {new Date(mock.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-white">
                      {mock.totalMarks}/{mock.maxMarks}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-sky-400">
                      {mock.percentage}%
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      {mock.qualifiedOverall ? (
                        <span className="text-emerald-400">Qualified</span>
                      ) : (
                        <span className="text-amber-400">Below Cutoff</span>
                      )}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMock(mock)}
                        className="text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
                      >
                        Inspect Breakdown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Mock Test Section Breakdown Modal */}
      {selectedMock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-xl bg-[#0D1629] border border-slate-700 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-sky-400">Mock Test Breakdown</div>
                <h4 className="font-display text-lg font-bold text-white">{selectedMock.title}</h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedMock;
                    setSelectedMock(null);
                    triggerAiMockAnalysis(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-xs font-semibold text-white whitespace-nowrap"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI Analysis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMock(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 px-3 text-right">Correct</th>
                    <th className="py-2 px-3 text-right">Marks</th>
                    <th className="py-2 pl-3 text-right">25% Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {selectedMock.sections.map((s) => (
                    <tr key={s.subject}>
                      <td className="py-2.5 pr-3 text-white font-medium">{s.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        {s.correct}/{s.totalQuestions}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                        {s.scoredMarks}/{s.maxMarks} ({s.percentage}%)
                      </td>
                      <td className="py-2.5 pl-3 text-right text-xs font-semibold">
                        {s.qualifiedSection ? (
                          <span className="text-emerald-400">Cleared</span>
                        ) : (
                          <span className="text-rose-400">Below 25%</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0D1629] border border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-display text-lg font-bold">
              <ShieldAlert className="h-5 w-5" />
              <span>Reset All Study Progress?</span>
            </div>
            <p className="text-sm text-slate-300">
              This will permanently clear your practice attempts, mock test history, study streak, and saved AI questions from this browser.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
