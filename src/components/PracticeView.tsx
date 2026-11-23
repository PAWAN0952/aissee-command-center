import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Filter,
  Info,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CURATED_QUESTIONS } from '../data/questions';
import { SUBJECTS, SUBJECT_MAP } from '../data/syllabus';
import { Difficulty, Question, SubjectId, TutorContext } from '../types/aissee';
import { SUBJECT_COLORS } from '../utils/theme';

interface PracticeViewProps {
  initialSubject?: SubjectId;
  initialChapter?: string;
  aiQuestions: Question[];
  onRecordAttempt: (attempt: {
    questionId: string;
    subject: SubjectId;
    chapter: string;
    difficulty: Difficulty;
    selectedIndex: number;
    isCorrect: boolean;
    source: 'curated' | 'ai_generated';
  }) => void;
  onAskTutor: (prompt: string, context: TutorContext) => void;
  onNavigateGenerator: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const PracticeView: React.FC<PracticeViewProps> = ({
  initialSubject,
  initialChapter,
  aiQuestions,
  onRecordAttempt,
  onAskTutor,
  onNavigateGenerator,
}) => {
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>(initialSubject ?? 'mathematics');
  const [chapterFilter, setChapterFilter] = useState<string>(initialChapter ?? '');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'curated' | 'ai_generated'>('all');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });

  useEffect(() => {
    if (initialSubject) {
      setSubjectFilter(initialSubject);
    }
    if (initialChapter !== undefined) {
      setChapterFilter(initialChapter);
    }
    setCurrentIndex(0);
    setSelectedOption(null);
  }, [initialSubject, initialChapter]);

  const availableChapters = useMemo(() => {
    if (subjectFilter === 'all') {
      return Array.from(new Set([...CURATED_QUESTIONS, ...aiQuestions].map((q) => q.chapter)));
    }
    return SUBJECT_MAP[subjectFilter].chapters.map((c) => c.title);
  }, [subjectFilter, aiQuestions]);

  const filteredQuestions = useMemo(() => {
    const combined = [...CURATED_QUESTIONS, ...aiQuestions];
    return combined.filter((q) => {
      if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
      if (chapterFilter && q.chapter !== chapterFilter) return false;
      if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) return false;
      if (sourceFilter !== 'all' && q.source !== sourceFilter) return false;
      return true;
    });
  }, [subjectFilter, chapterFilter, difficultyFilter, sourceFilter, aiQuestions]);

  const activeQuestion = filteredQuestions[currentIndex] ?? null;

  const handleSelectOption = (idx: number) => {
    if (!activeQuestion || selectedOption !== null) return;
    setSelectedOption(idx);
    const isCorrect = idx === activeQuestion.correctIndex;
    setSessionStats((prev) => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
    onRecordAttempt({
      questionId: activeQuestion.id,
      subject: activeQuestion.subject,
      chapter: activeQuestion.chapter,
      difficulty: activeQuestion.difficulty,
      selectedIndex: idx,
      isCorrect,
      source: activeQuestion.source,
    });
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  const handleSubjectChange = (nextSub: SubjectId | 'all') => {
    setSubjectFilter(nextSub);
    setChapterFilter('');
    setCurrentIndex(0);
    setSelectedOption(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Filters Toolbar */}
      <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="h-4 w-4 text-violet-400" />
            <span>Practice Filters</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span>
              Matching Questions:{' '}
              <strong className="font-mono tabular-nums text-white">{filteredQuestions.length}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              Session Accuracy:{' '}
              <strong className="font-mono tabular-nums text-sky-400">
                {sessionStats.attempted > 0
                  ? `${Math.round((sessionStats.correct / sessionStats.attempted) * 100)}% (${sessionStats.correct}/${sessionStats.attempted})`
                  : '—'}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => handleSubjectChange(e.target.value as SubjectId | 'all')}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All 5 Subjects</option>
              {SUBJECTS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  Section {sub.sectionCode}: {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Chapter / Unit</label>
            <select
              value={chapterFilter}
              onChange={(e) => {
                setChapterFilter(e.target.value);
                setCurrentIndex(0);
                setSelectedOption(null);
              }}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Chapters</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#070D1A] border border-slate-700">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((level) => {
                const activeCls =
                  level === 'Easy'
                    ? 'bg-emerald-600 text-white'
                    : level === 'Medium'
                    ? 'bg-amber-600 text-white'
                    : level === 'Hard'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white';
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setDifficultyFilter(level);
                      setCurrentIndex(0);
                      setSelectedOption(null);
                    }}
                    className={`py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      difficultyFilter === level
                        ? activeCls
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Question Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value as 'all' | 'curated' | 'ai_generated');
                setCurrentIndex(0);
                setSelectedOption(null);
              }}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Practice Sets</option>
              <option value="curated">Curated Original Bank</option>
              <option value="ai_generated">AI-Generated Saved ({aiQuestions.length})</option>
            </select>
          </div>
        </div>
      </section>

      {/* Active Question Workspace or Empty State */}
      {!activeQuestion ? (
        <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-10 text-center space-y-4">
          <p className="text-base font-medium text-white">
            No questions match this exact filter combination.
          </p>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            You can broaden the difficulty or chapter filter, or generate fresh original practice MCQs for this exact chapter using the AI Question Generator.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setChapterFilter('');
                setDifficultyFilter('All');
                setSourceFilter('all');
                setCurrentIndex(0);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
            <button
              type="button"
              onClick={onNavigateGenerator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate AI Questions</span>
            </button>
          </div>
        </section>
      ) : (
        (() => {
          const qTheme = SUBJECT_COLORS[activeQuestion.subject];
          return (
            <section className={`rounded-xl bg-[#0D1629] border ${qTheme.border} overflow-hidden`}>
              <div className={`h-1 w-full ${qTheme.bar}`} />
              <div className="p-6 sm:p-8 space-y-6">
              {/* Question Metadata Strip (Unboxed, Zero-Pill) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className={`font-mono tabular-nums font-semibold ${qTheme.text}`}>
                    Question {currentIndex + 1} of {filteredQuestions.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={`${qTheme.text} font-semibold`}>
                    {SUBJECT_MAP[activeQuestion.subject].name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-200">{activeQuestion.chapter}</span>
                  <span aria-hidden="true">·</span>
              <span
                className={
                  activeQuestion.difficulty === 'Hard'
                    ? 'text-rose-400 font-medium'
                    : activeQuestion.difficulty === 'Medium'
                    ? 'text-amber-400 font-medium'
                    : 'text-emerald-400 font-medium'
                }
              >
                {activeQuestion.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>
                {activeQuestion.source === 'ai_generated'
                  ? `AI-Generated ${activeQuestion.examTrack === 'nda' ? 'UPSC NDA' : 'AISSEE'} Practice (Not an official past paper)`
                  : 'Original Curated Practice (Not an official NTA past paper)'}
              </span>
            </div>
          </div>

          {/* Question Stem */}
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white leading-relaxed">
            {activeQuestion.question}
          </h3>

          {/* Four Options */}
          <div className="space-y-3">
            {activeQuestion.options.map((option, idx) => {
              const isAnswered = selectedOption !== null;
              const isSelected = selectedOption === idx;
              const isCorrectOption = activeQuestion.correctIndex === idx;

              let optionClasses =
                'bg-[#081020] border-slate-800 text-slate-200 hover:border-blue-500/70 hover:bg-[#0C1730]';
              if (isAnswered) {
                if (isCorrectOption) {
                  optionClasses =
                    'bg-emerald-950/50 border-emerald-500/80 text-emerald-100';
                } else if (isSelected && !isCorrectOption) {
                  optionClasses = 'bg-rose-950/50 border-rose-500/80 text-rose-100';
                } else {
                  optionClasses = 'bg-[#081020]/60 border-slate-800/60 text-slate-400';
                }
              }

              return (
                <button
                  key={`${activeQuestion.id}-opt-${idx}`}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${optionClasses}`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span
                      className={`font-mono text-xs font-bold h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isAnswered && isCorrectOption
                          ? 'bg-emerald-600 text-white'
                          : isAnswered && isSelected && !isCorrectOption
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="text-sm sm:text-base leading-snug">{option}</span>
                  </div>

                  {isAnswered && isCorrectOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Correct</span>
                    </span>
                  )}
                  {isAnswered && isSelected && !isCorrectOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 shrink-0">
                      <XCircle className="h-4 w-4" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Evaluation & Explanation */}
          {selectedOption !== null && (
            <div className="pt-4 border-t border-slate-800/90 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {selectedOption === activeQuestion.correctIndex ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400">
                        Correct Answer — Option {OPTION_LETTERS[activeQuestion.correctIndex]}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-rose-400" />
                      <span className="text-rose-400">
                        Incorrect — Correct Option is {OPTION_LETTERS[activeQuestion.correctIndex]}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {activeQuestion.explanation}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onAskTutor(
                      `Can you explain this question step-by-step and give me a quick shortcut to solve similar ones?\n\nQuestion: ${activeQuestion.question}`,
                      {
                        subject: SUBJECT_MAP[activeQuestion.subject].name,
                        chapter: activeQuestion.chapter,
                        questionText: activeQuestion.question,
                        options: activeQuestion.options,
                        correctAnswer: `${OPTION_LETTERS[activeQuestion.correctIndex]}. ${activeQuestion.options[activeQuestion.correctIndex]}`,
                        explanation: activeQuestion.explanation,
                      }
                    )
                  }
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  <span>Ask AI Tutor to Explain More</span>
                </button>

                {currentIndex < filteredQuestions.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${qTheme.activeTab} hover:brightness-110 text-xs font-semibold transition-all`}
                  >
                    <span>Next Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <div className="text-xs text-slate-400 font-mono tabular-nums">
              {currentIndex + 1} / {filteredQuestions.length}
            </div>

            <button
              type="button"
              disabled={currentIndex >= filteredQuestions.length - 1}
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
              </div>
            </section>
          );
        })()
      )}
    </motion.div>
  );
};
