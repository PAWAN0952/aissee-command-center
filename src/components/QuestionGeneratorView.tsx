import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  Bot,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { NDA_SUBJECTS, NdaSectionId } from '../data/ndaSyllabus';
import { SUBJECTS, SUBJECT_MAP } from '../data/syllabus';
import { Difficulty, ExamTrack, Question, SubjectId, TutorContext } from '../types/aissee';
import { SUBJECT_COLORS } from '../utils/theme';

interface QuestionGeneratorViewProps {
  initialTrack?: ExamTrack;
  initialSubjectKey?: string;
  initialChapter?: string;
  onSaveGeneratedQuestions: (questions: Question[]) => void;
  onRecordAttempt: (attempt: {
    questionId: string;
    subject: SubjectId;
    chapter: string;
    difficulty: Difficulty;
    selectedIndex: number;
    isCorrect: boolean;
    source: 'ai_generated';
  }) => void;
  onAskTutor: (prompt: string, context: TutorContext) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
const GENERATABLE_NDA = NDA_SUBJECTS.filter((s) => s.generatable);

export const QuestionGeneratorView: React.FC<QuestionGeneratorViewProps> = ({
  initialTrack,
  initialSubjectKey,
  initialChapter,
  onSaveGeneratedQuestions,
  onRecordAttempt,
  onAskTutor,
}) => {
  const [examTrack, setExamTrack] = useState<ExamTrack>(initialTrack ?? 'aissee');
  const [subject, setSubject] = useState<SubjectId>('mathematics');
  const [ndaSection, setNdaSection] = useState<NdaSectionId>('nda-math');
  const [chapter, setChapter] = useState<string>(SUBJECTS[0].chapters[0].title);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [count, setCount] = useState<number>(5);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!initialTrack) return;
    setExamTrack(initialTrack);
    if (initialTrack === 'nda') {
      const targetNda =
        GENERATABLE_NDA.find((s) => s.id === initialSubjectKey) ?? GENERATABLE_NDA[0];
      setNdaSection(targetNda.id);
      setChapter(initialChapter || targetNda.chapters[0]?.title || '');
    } else {
      const targetSub =
        SUBJECTS.find((s) => s.id === initialSubjectKey)?.id ?? 'mathematics';
      setSubject(targetSub);
      setChapter(initialChapter || SUBJECT_MAP[targetSub].chapters[0]?.title || '');
    }
  }, [initialTrack, initialSubjectKey, initialChapter]);

  const activeNdaMeta = useMemo(
    () => GENERATABLE_NDA.find((s) => s.id === ndaSection) ?? GENERATABLE_NDA[0],
    [ndaSection]
  );

  const chaptersForSelection = useMemo(() => {
    if (examTrack === 'nda') {
      return activeNdaMeta.chapters;
    }
    return SUBJECT_MAP[subject].chapters;
  }, [examTrack, subject, activeNdaMeta]);

  const handleTrackChange = (nextTrack: ExamTrack) => {
    setExamTrack(nextTrack);
    if (nextTrack === 'nda') {
      setChapter(activeNdaMeta.chapters[0]?.title ?? '');
    } else {
      setChapter(SUBJECT_MAP[subject].chapters[0]?.title ?? '');
    }
  };

  const handleSubjectChange = (nextKey: string) => {
    if (examTrack === 'nda') {
      const id = nextKey as NdaSectionId;
      setNdaSection(id);
      const found = GENERATABLE_NDA.find((s) => s.id === id);
      setChapter(found?.chapters[0]?.title ?? '');
    } else {
      const id = nextKey as SubjectId;
      setSubject(id);
      setChapter(SUBJECT_MAP[id].chapters[0]?.title ?? '');
    }
  };

  const activeSubjectDisplayName =
    examTrack === 'nda' ? activeNdaMeta.name : SUBJECT_MAP[subject].name;
  const activeMappedSubjectId: SubjectId =
    examTrack === 'nda' ? activeNdaMeta.mappedSubjectId : subject;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSavedNotice(false);

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTrack,
          subject: activeSubjectDisplayName,
          chapter,
          difficulty,
          count,
        }),
      });

      const data = (await res.json()) as {
        questions?: Array<{
          id: string;
          chapter: string;
          difficulty: Difficulty;
          question: string;
          options: [string, string, string, string];
          correctIndex: 0 | 1 | 2 | 3;
          explanation: string;
          conceptTag?: string;
          createdAt?: string;
        }>;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || `Generation failed (${res.status})`);
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions were returned. Please try again.');
      }

      const mapped: Question[] = data.questions.map((q) => ({
        id: q.id,
        examTrack,
        subject: activeMappedSubjectId,
        chapter: q.chapter || chapter,
        difficulty,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        conceptTag: q.conceptTag,
        source: 'ai_generated',
        createdAt: q.createdAt,
      }));

      setGenerated(mapped);
      setSelectedAnswers({});
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to generate questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (q: Question, optIdx: number) => {
    if (selectedAnswers[q.id] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    onRecordAttempt({
      questionId: q.id,
      subject: q.subject,
      chapter: q.chapter,
      difficulty: q.difficulty,
      selectedIndex: optIdx,
      isCorrect: optIdx === q.correctIndex,
      source: 'ai_generated',
    });
  };

  const handleSaveAll = () => {
    if (generated.length === 0) return;
    onSaveGeneratedQuestions(generated);
    setSavedNotice(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Generator Configuration Panel */}
      <section className="rounded-xl bg-[#0D1629] border border-amber-500/30 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500" />
        <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Generate Original AISSEE &amp; UPSC NDA Practice Questions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your exam track, syllabus chapter, and difficulty to build a custom quiz with step-by-step solutions.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 shrink-0">
            <Info className="h-3.5 w-3.5" />
            <span>AI-Generated Practice · Distinct from official past papers</span>
          </div>
        </div>

        {/* Exam Track Segmented Switch */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070D1A] border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => handleTrackChange('aissee')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              examTrack === 'aissee'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            AISSEE Class 9
          </button>
          <button
            type="button"
            onClick={() => handleTrackChange('nda')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              examTrack === 'nda'
                ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            UPSC NDA &amp; NA
          </button>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3">
            <label className="block text-xs text-slate-400 mb-1.5">
              {examTrack === 'nda' ? 'NDA Paper / Section' : 'Subject'}
            </label>
            <select
              value={examTrack === 'nda' ? ndaSection : subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {examTrack === 'nda'
                ? GENERATABLE_NDA.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.shortName}
                    </option>
                  ))
                : SUBJECTS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.sectionCode}. {sub.name}
                    </option>
                  ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-xs text-slate-400 mb-1.5">Chapter / Topic</label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {chaptersForSelection.map((ch) => (
                <option key={ch.id} value={ch.title}>
                  {ch.title}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-400 mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-xs text-slate-400 mb-1.5">Count</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 disabled:opacity-50 text-white text-sm font-semibold transition-all whitespace-nowrap shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate MCQs</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="rounded-xl bg-rose-950/50 border border-rose-500/60 p-4 flex items-start gap-2.5 text-xs sm:text-sm text-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        </div>
      </section>

      {/* Loading Skeleton State */}
      {isLoading && (
        <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-8 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-400 mx-auto" />
          <div className="font-display text-base font-semibold text-white">
            Crafting {count} original {difficulty}{' '}
            {examTrack === 'nda' ? 'UPSC NDA' : 'AISSEE Class 9'} questions on {chapter}...
          </div>
          <p className="text-xs text-slate-400">
            Verifying curriculum accuracy and generating step-by-step explanations.
          </p>
        </section>
      )}

      {/* Generated Interactive Questions */}
      {!isLoading && generated.length > 0 && (
        <section className="space-y-4">
          <div className="rounded-xl bg-[#0B1324] border border-slate-800/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <strong className="text-white">
                {generated.length} AI-Generated {examTrack === 'nda' ? 'UPSC NDA' : 'AISSEE'} Practice Questions
              </strong>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>{activeSubjectDisplayName}</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>{chapter}</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span className="text-amber-400">Not official past papers</span>
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savedNotice}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                savedNotice
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {savedNotice ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved to Practice Bank</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  <span>Save All to Practice Bank</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {generated.map((q, qIdx) => {
              const selected = selectedAnswers[q.id];
              const isAnswered = selected !== undefined;
              const cardTheme = SUBJECT_COLORS[q.subject];

              return (
                <article
                  key={q.id}
                  className={`rounded-xl bg-[#0D1629] border ${cardTheme.border} p-6 space-y-4`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      <span className={`font-mono tabular-nums font-semibold ${cardTheme.text}`}>
                        Q.{qIdx + 1}
                      </span>
                      <span aria-hidden="true" className="mx-2">·</span>
                      <span className="text-slate-200">{q.conceptTag || q.chapter}</span>
                      <span aria-hidden="true" className="mx-2">·</span>
                      <span
                        className={
                          q.difficulty === 'Hard'
                            ? 'text-rose-400 font-medium'
                            : q.difficulty === 'Medium'
                            ? 'text-amber-400 font-medium'
                            : 'text-emerald-400 font-medium'
                        }
                      >
                        {q.difficulty}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      AI-Generated {q.examTrack === 'nda' ? 'NDA' : 'AISSEE'} Original
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-white leading-relaxed">
                    {q.question}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      const isChosen = selected === oIdx;

                      let cls =
                        'bg-[#081020] border-slate-800 text-slate-200 hover:border-blue-500/70';
                      if (isAnswered) {
                        if (isCorrect) {
                          cls = 'bg-emerald-950/50 border-emerald-500/80 text-emerald-100';
                        } else if (isChosen && !isCorrect) {
                          cls = 'bg-rose-950/50 border-rose-500/80 text-rose-100';
                        } else {
                          cls = 'bg-[#081020]/50 border-slate-800/60 text-slate-400';
                        }
                      }

                      return (
                        <button
                          key={`${q.id}-o-${oIdx}`}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => handleAnswer(q, oIdx)}
                          className={`text-left flex items-center gap-3 px-3.5 py-3 rounded-lg border text-sm transition-colors ${cls}`}
                        >
                          <span className="font-mono text-xs font-bold h-6 w-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                            {OPTION_LETTERS[oIdx]}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {selected === q.correctIndex ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-400">
                              Correct (Option {OPTION_LETTERS[q.correctIndex]})
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-rose-400" />
                            <span className="text-rose-400">
                              Incorrect · Correct Option: {OPTION_LETTERS[q.correctIndex]}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onAskTutor(
                            `Can you walk me through this AI-generated practice question in simpler steps?\n\n${q.question}`,
                            {
                              examTrack,
                              subject: activeSubjectDisplayName,
                              chapter: q.chapter,
                              questionText: q.question,
                              options: q.options,
                              correctAnswer: `${OPTION_LETTERS[q.correctIndex]}. ${q.options[q.correctIndex]}`,
                              explanation: q.explanation,
                            }
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 pt-1"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        <span>Explain Further with AI Tutor</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
};
