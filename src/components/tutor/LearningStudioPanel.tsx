import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  ListChecks,
  Loader2,
  NotebookPen,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  SourceCitation,
  TutorClassLevel,
  TutorLanguage,
  TutorLearningTool,
  TutorMode,
  TutorSubject,
} from '../../types/aissee';

interface LearningStudioPanelProps {
  classLevel: TutorClassLevel;
  subject: TutorSubject;
  chapter: string;
  language: TutorLanguage;
  mode: TutorMode;
  onDiscussInChat: (prompt: string) => void;
}

interface GuidePayload {
  title: string;
  overview: string;
  sections: Array<{ heading: string; points: string[] }>;
  everydayExample: string;
  commonMistake: string;
}

interface QuizPayload {
  title: string;
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

interface FlashcardsPayload {
  title: string;
  cards: Array<{ front: string; hint: string; back: string }>;
}

interface ImportantQuestionsPayload {
  title: string;
  items: Array<{ question: string; marks: string; answer: string }>;
}

const TOOL_ITEMS: Array<{
  id: TutorLearningTool;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    id: 'summary',
    label: 'Chapter Summary',
    desc: 'Core overview + everyday analogy',
    icon: BookOpen,
    accent: 'text-sky-400 border-sky-500/35',
  },
  {
    id: 'step-by-step',
    label: 'Step-by-Step Guide',
    desc: 'Concept breakdown from basics',
    icon: Layers,
    accent: 'text-cyan-400 border-cyan-500/35',
  },
  {
    id: 'mcq',
    label: 'MCQ Quiz Generator',
    desc: '5 interactive practice MCQs',
    icon: ListChecks,
    accent: 'text-violet-400 border-violet-500/35',
  },
  {
    id: 'practice-test',
    label: 'Practice Test',
    desc: 'Timed 6-Q test with score review',
    icon: Clock,
    accent: 'text-rose-400 border-rose-500/35',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    desc: '8 active-recall flip cards',
    icon: RefreshCw,
    accent: 'text-emerald-400 border-emerald-500/35',
  },
  {
    id: 'important-questions',
    label: 'Important Questions',
    desc: 'Exam questions + model answers',
    icon: HelpCircle,
    accent: 'text-amber-400 border-amber-500/35',
  },
  {
    id: 'revision-notes',
    label: 'Revision Notes',
    desc: 'Formulas, rules & mistake alerts',
    icon: NotebookPen,
    accent: 'text-fuchsia-400 border-fuchsia-500/35',
  },
  {
    id: 'examples',
    label: 'Math & Science Examples',
    desc: 'Worked problems & daily examples',
    icon: Calculator,
    accent: 'text-teal-400 border-teal-500/35',
  },
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const LearningStudioPanel: React.FC<LearningStudioPanelProps> = ({
  classLevel,
  subject,
  chapter,
  language,
  mode,
  onDiscussInChat,
}) => {
  const [activeTool, setActiveTool] = useState<TutorLearningTool>('summary');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultData, setResultData] = useState<unknown>(null);
  const [resultTool, setResultTool] = useState<TutorLearningTool | null>(null);
  const [citations, setCitations] = useState<SourceCitation[]>([]);

  // Quiz & Practice Test interactive state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [testSecondsLeft, setTestSecondsLeft] = useState(0);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Important questions reveal state
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (resultTool !== 'practice-test' || practiceSubmitted || testSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setTestSecondsLeft((prev) => {
        if (prev <= 1) {
          setPracticeSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [resultTool, practiceSubmitted, testSecondsLeft]);

  const runTool = async (toolId: TutorLearningTool) => {
    setActiveTool(toolId);
    setLoading(true);
    setErrorMsg(null);
    setQuizAnswers({});
    setPracticeSubmitted(false);
    setCardIndex(0);
    setCardFlipped(false);
    setShowHint(false);
    setRevealedAnswers({});

    try {
      const res = await fetch('/api/tutor/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: toolId,
          classLevel,
          subject,
          chapter: chapter || subject,
          language,
          mode,
        }),
      });
      const json = (await res.json()) as {
        tool?: TutorLearningTool;
        data?: unknown;
        citations?: SourceCitation[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || `Tool failed (${res.status})`);
      }
      setResultTool(toolId);
      setResultData(json.data);
      setCitations(Array.isArray(json.citations) ? json.citations : []);
      if (toolId === 'practice-test') {
        setTestSecondsLeft(360); // 6 minutes for 6-Q practice test
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to generate study resource.');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (loading) {
      return (
        <div className="rounded-xl bg-[#081020] border border-slate-800 p-10 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-400 mx-auto" />
          <div className="text-sm font-semibold text-white">
            Building your {TOOL_ITEMS.find((t) => t.id === activeTool)?.label} in {language}...
          </div>
          <div className="text-xs text-slate-400">
            Class {classLevel} · {subject} · {chapter || subject}
          </div>
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="rounded-xl bg-rose-950/50 border border-rose-500/60 p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => void runTool(activeTool)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    if (!resultData || !resultTool) {
      return (
        <div className="rounded-xl bg-[#081020] border border-slate-800 p-8 text-center space-y-3">
          <Sparkles className="h-6 w-6 text-cyan-400 mx-auto" />
          <div className="text-sm font-semibold text-white">
            Choose any Learning Tool above to generate tailored Class {classLevel} study material
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Every summary, quiz, flashcard deck, and revision note adapts to your selected Class ({classLevel}), Subject ({subject}), Language ({language}), and AI Mode ({mode.toUpperCase()}).
          </p>
        </div>
      );
    }

    // MCQ Quiz OR Practice Test
    if (resultTool === 'mcq' || resultTool === 'practice-test') {
      const payload = resultData as QuizPayload;
      const questions = Array.isArray(payload?.questions) ? payload.questions : [];
      const isPracticeTest = resultTool === 'practice-test';
      const showAnswers = !isPracticeTest || practiceSubmitted;
      const totalAnswered = Object.keys(quizAnswers).length;
      const correctCount = questions.filter((q, idx) => quizAnswers[idx] === q.correctIndex).length;

      return (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#081020] border border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-display text-base font-bold text-white">{payload.title}</h4>
              <div className="text-xs text-slate-400">
                Class {classLevel} · {subject} · {questions.length} Questions
              </div>
            </div>

            {isPracticeTest && !practiceSubmitted ? (
              <div className="flex items-center gap-3">
                <div className="font-mono tabular-nums text-xs font-semibold text-amber-400 inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {String(Math.floor(testSecondsLeft / 60)).padStart(2, '0')}:
                    {String(testSecondsLeft % 60).padStart(2, '0')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPracticeSubmitted(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-semibold"
                >
                  Submit Test ({totalAnswered}/{questions.length})
                </button>
              </div>
            ) : (
              <div className="font-mono tabular-nums text-xs font-semibold text-emerald-400">
                Score: {correctCount}/{questions.length} (
                {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%)
              </div>
            )}
          </div>

          {questions.map((q, qIdx) => {
            const chosen = quizAnswers[qIdx];
            const isAnswered = chosen !== undefined;
            const reveal = isPracticeTest ? practiceSubmitted : isAnswered;

            return (
              <div
                key={`studio-q-${qIdx}`}
                className="rounded-xl bg-[#081020] border border-slate-800 p-5 space-y-3"
              >
                <div className="text-sm font-semibold text-white leading-relaxed">
                  <span className="font-mono text-cyan-400 mr-2">Q{qIdx + 1}.</span>
                  {q.question}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = chosen === oIdx;
                    const isRight = q.correctIndex === oIdx;
                    let cls = 'bg-[#070D1A] border-slate-800 text-slate-200 hover:border-cyan-500/60';
                    if (reveal) {
                      if (isRight) cls = 'bg-emerald-950/50 border-emerald-500/80 text-emerald-100';
                      else if (isSelected) cls = 'bg-rose-950/50 border-rose-500/80 text-rose-100';
                      else cls = 'bg-[#070D1A]/60 border-slate-800/50 text-slate-400';
                    } else if (isSelected) {
                      cls = 'bg-blue-600/20 border-blue-500 text-white';
                    }

                    return (
                      <button
                        key={`sq-${qIdx}-${oIdx}`}
                        type="button"
                        disabled={!isPracticeTest && isAnswered}
                        onClick={() => {
                          if (isPracticeTest && practiceSubmitted) return;
                          setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
                        }}
                        className={`text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors ${cls}`}
                      >
                        <span className="font-mono text-xs font-bold h-5 w-5 rounded bg-slate-800 flex items-center justify-center shrink-0">
                          {OPTION_LETTERS[oIdx]}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {reveal && (
                  <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      {chosen === q.correctIndex ? (
                        <span className="text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="text-rose-400 inline-flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> Correct Option: {OPTION_LETTERS[q.correctIndex]}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Flashcards
    if (resultTool === 'flashcards') {
      const payload = resultData as FlashcardsPayload;
      const cards = Array.isArray(payload?.cards) ? payload.cards : [];
      const card = cards[cardIndex];
      if (!card) return null;

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base font-bold text-white">{payload.title}</h4>
            <span className="font-mono tabular-nums text-xs text-emerald-400">
              Card {cardIndex + 1} / {cards.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCardFlipped((f) => !f)}
            className="w-full text-left rounded-xl bg-[#081020] border border-emerald-500/35 hover:border-emerald-400/70 p-8 min-h-[210px] flex flex-col justify-between transition-all"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {cardFlipped ? 'Answer / Concept' : 'Question / Prompt (Click to flip)'}
            </div>
            <div className="font-display text-lg sm:text-xl font-semibold text-white leading-relaxed py-4">
              {cardFlipped ? card.back : card.front}
            </div>
            <div className="text-xs text-slate-400">
              {showHint && !cardFlipped ? `Hint: ${card.hint}` : 'Click card to flip'}
            </div>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={cardIndex === 0}
                onClick={() => {
                  setCardIndex((i) => Math.max(0, i - 1));
                  setCardFlipped(false);
                  setShowHint(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={cardIndex >= cards.length - 1}
                onClick={() => {
                  setCardIndex((i) => Math.min(cards.length - 1, i + 1));
                  setCardFlipped(false);
                  setShowHint(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-semibold text-white"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Important Questions
    if (resultTool === 'important-questions') {
      const payload = resultData as ImportantQuestionsPayload;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      return (
        <div className="space-y-4">
          <h4 className="font-display text-base font-bold text-white">{payload.title}</h4>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={`imp-${idx}`}
                className="rounded-xl bg-[#081020] border border-slate-800 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-white leading-relaxed">
                    <span className="font-mono text-amber-400 mr-2">Q{idx + 1}.</span>
                    {item.question}
                  </div>
                  <span className="font-mono text-xs text-amber-300 shrink-0">{item.marks}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }))
                  }
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  {revealedAnswers[idx] ? 'Hide Model Answer' : 'View Step-by-Step Model Answer'}
                </button>
                {revealedAnswers[idx] && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80 whitespace-pre-line">
                    {item.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Guide formats: summary, step-by-step, revision-notes, examples
    const guide = resultData as GuidePayload;
    return (
      <div className="rounded-xl bg-[#081020] border border-slate-800 p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-display text-lg font-bold text-white">{guide.title}</h4>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">{guide.overview}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onDiscussInChat(
                `I just reviewed "${guide.title}" for Class ${classLevel} ${subject}. Can you test me with a quick follow-up question?`
              )
            }
            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
          >
            Discuss in Chat
          </button>
        </div>

        <div className="space-y-4">
          {(guide.sections ?? []).map((sec, i) => (
            <div key={`gsec-${i}`} className="space-y-2">
              <h5 className="font-display text-sm font-bold text-sky-300">{sec.heading}</h5>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                {(sec.points ?? []).map((pt, j) => (
                  <li key={`gpt-${i}-${j}`} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="rounded-lg bg-[#070D1A] border border-emerald-500/30 p-3.5 space-y-1">
            <div className="font-semibold text-emerald-400">Everyday-Life Example</div>
            <p className="text-slate-300 leading-relaxed">{guide.everydayExample}</p>
          </div>
          <div className="rounded-lg bg-[#070D1A] border border-amber-500/30 p-3.5 space-y-1">
            <div className="font-semibold text-amber-400">Common Mistake to Avoid</div>
            <p className="text-slate-300 leading-relaxed">{guide.commonMistake}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Learning Feature Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TOOL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTool === item.id && resultTool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() => void runTool(item.id)}
              className={`text-left rounded-xl border p-3 transition-all disabled:opacity-50 ${
                isActive
                  ? `bg-[#081020] ${item.accent} ring-1 ring-cyan-400/50`
                  : 'bg-[#081020]/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Icon className={`h-4 w-4 shrink-0 ${item.accent.split(' ')[0]}`} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">{item.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Rendered Output */}
      {renderResult()}

      {/* Retrieved Sources Strip (if any) */}
      {citations.length > 0 && !loading && (
        <div className="rounded-xl bg-[#081020] border border-emerald-500/25 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <FileText className="h-3.5 w-3.5" />
            <span>Grounded Study Sources Used ({citations.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {citations.slice(0, 4).map((c, idx) => (
              <div key={`${c.materialId}-${idx}`} className="text-[11px] text-slate-300">
                <span className="font-semibold text-white">{c.title}</span>
                <span aria-hidden="true" className="mx-1">·</span>
                <span className="text-emerald-400">{c.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
