import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { NavSection } from '../types/aissee';

type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

interface CompletedStudySession {
  id: string;
  activity: string;
  note: string;
  minutes: number;
  completedAt: string;
}

interface StoredPomodoroState {
  dateKey: string;
  sessionsToday: number;
  minutesToday: number;
  cycleCount: number;
  focusMinutes: number;
  soundEnabled: boolean;
  history: CompletedStudySession[];
}

interface PomodoroTimerProps {
  activeNav: NavSection;
}

const STORAGE_KEY = 'aissee_pomodoro_v1';
const FOCUS_PRESETS = [15, 25, 45] as const;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

const NAV_ACTIVITY_LABELS: Record<NavSection, string> = {
  dashboard: 'General Study',
  subjects: 'Syllabus Study',
  practice: 'Question Practice',
  'mock-test': 'Mock Test Prep',
  'ai-tutor': 'AI Tutor Session',
  'ai-generator': 'AI Practice Set',
  progress: 'Performance Review',
};

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadStoredState(): StoredPomodoroState {
  const today = getTodayKey();
  const fallback: StoredPomodoroState = {
    dateKey: today,
    sessionsToday: 0,
    minutesToday: 0,
    cycleCount: 0,
    focusMinutes: 25,
    soundEnabled: true,
    history: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredPomodoroState>;
    const validFocus =
      typeof parsed.focusMinutes === 'number' && [15, 25, 45].includes(parsed.focusMinutes)
        ? parsed.focusMinutes
        : 25;
    const soundEnabled = typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true;

    if (parsed.dateKey !== today) {
      return {
        ...fallback,
        focusMinutes: validFocus,
        soundEnabled,
      };
    }

    return {
      dateKey: today,
      sessionsToday: typeof parsed.sessionsToday === 'number' ? parsed.sessionsToday : 0,
      minutesToday: typeof parsed.minutesToday === 'number' ? parsed.minutesToday : 0,
      cycleCount: typeof parsed.cycleCount === 'number' ? parsed.cycleCount : 0,
      focusMinutes: validFocus,
      soundEnabled,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 12) : [],
    };
  } catch {
    return fallback;
  }
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 soft triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.48);
    });
  } catch {
    // Ignore audio context restrictions
  }
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ activeNav }) => {
  const [stored, setStored] = useState<StoredPomodoroState>(() => loadStoredState());
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(() => loadStoredState().focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetEndRef = useRef<number | null>(null);

  const phaseTotalSeconds = useMemo(() => {
    if (phase === 'focus') return stored.focusMinutes * 60;
    if (phase === 'shortBreak') return SHORT_BREAK_MINUTES * 60;
    return LONG_BREAK_MINUTES * 60;
  }, [phase, stored.focusMinutes]);

  // Persist stats & preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // ignore storage quota errors
    }
  }, [stored]);

  // Keep page title updated while timer runs
  useEffect(() => {
    const baseTitle = 'AISSEE Command Center — Class 9 Entrance Preparation';
    if (isRunning) {
      const label = phase === 'focus' ? 'Focus' : 'Break';
      document.title = `(${formatClock(secondsLeft)} ${label}) AISSEE Command`;
    } else {
      document.title = baseTitle;
    }
    return () => {
      document.title = baseTitle;
    };
  }, [isRunning, secondsLeft, phase]);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!panelOpen) return;
    const handlePointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [panelOpen]);

  const completePhase = (finishedPhase: PomodoroPhase) => {
    setIsRunning(false);
    targetEndRef.current = null;

    if (stored.soundEnabled) {
      playSoftChime();
    }

    if (finishedPhase === 'focus') {
      const today = getTodayKey();
      const nextCycle = stored.cycleCount + 1;
      const activity = NAV_ACTIVITY_LABELS[activeNav];
      const entry: CompletedStudySession = {
        id: `pom-${Date.now()}`,
        activity,
        note: sessionNote.trim() || activity,
        minutes: stored.focusMinutes,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setStored((prev) => {
        const sameDay = prev.dateKey === today;
        return {
          ...prev,
          dateKey: today,
          sessionsToday: (sameDay ? prev.sessionsToday : 0) + 1,
          minutesToday: (sameDay ? prev.minutesToday : 0) + prev.focusMinutes,
          cycleCount: nextCycle,
          history: [entry, ...(sameDay ? prev.history : [])].slice(0, 12),
        };
      });

      const nextPhase: PomodoroPhase = nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak';
      const nextDuration = (nextPhase === 'longBreak' ? LONG_BREAK_MINUTES : SHORT_BREAK_MINUTES) * 60;
      setPhase(nextPhase);
      setSecondsLeft(nextDuration);
      setCompletionBanner(
        nextPhase === 'longBreak'
          ? `4 focus cycles done! Take a ${LONG_BREAK_MINUTES}-minute long break.`
          : `Focus session logged (${stored.focusMinutes}m)! Ready for a ${SHORT_BREAK_MINUTES}-minute break.`
      );
    } else {
      setPhase('focus');
      setSecondsLeft(stored.focusMinutes * 60);
      setCompletionBanner('Break complete! Ready for your next focused study block.');
    }
  };

  const latestCompleteRef = useRef(completePhase);
  latestCompleteRef.current = completePhase;

  // Wall-clock accurate countdown loop
  useEffect(() => {
    if (!isRunning) {
      targetEndRef.current = null;
      return;
    }

    if (targetEndRef.current === null) {
      targetEndRef.current = Date.now() + secondsLeft * 1000;
    }

    const tick = () => {
      if (targetEndRef.current === null) return;
      const remaining = Math.ceil((targetEndRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        latestCompleteRef.current(phase);
      } else {
        setSecondsLeft(remaining);
      }
    };

    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [isRunning, phase]);

  const handleToggleRun = () => {
    setCompletionBanner(null);
    if (isRunning) {
      setIsRunning(false);
      targetEndRef.current = null;
    } else {
      targetEndRef.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    targetEndRef.current = null;
    setCompletionBanner(null);
    setSecondsLeft(phaseTotalSeconds);
  };

  const handleSwitchPhase = (nextPhase: PomodoroPhase) => {
    setIsRunning(false);
    targetEndRef.current = null;
    setCompletionBanner(null);
    setPhase(nextPhase);
    if (nextPhase === 'focus') setSecondsLeft(stored.focusMinutes * 60);
    else if (nextPhase === 'shortBreak') setSecondsLeft(SHORT_BREAK_MINUTES * 60);
    else setSecondsLeft(LONG_BREAK_MINUTES * 60);
  };

  const handleFocusPresetChange = (mins: number) => {
    setStored((prev) => ({ ...prev, focusMinutes: mins }));
    if (phase === 'focus') {
      setIsRunning(false);
      targetEndRef.current = null;
      setSecondsLeft(mins * 60);
    }
  };

  const handleSkipPhase = () => {
    setIsRunning(false);
    targetEndRef.current = null;
    setCompletionBanner(null);
    if (phase === 'focus') {
      const nextPhase: PomodoroPhase = (stored.cycleCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      handleSwitchPhase(nextPhase);
    } else {
      handleSwitchPhase('focus');
    }
  };

  const progressRatio = Math.min(
    1,
    Math.max(0, 1 - secondsLeft / Math.max(1, phaseTotalSeconds))
  );
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressRatio);

  const isFocus = phase === 'focus';
  const currentActivity = NAV_ACTIVITY_LABELS[activeNav];

  return (
    <div ref={containerRef} className="relative">
      {/* Compact Single-Line Header Trigger */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          aria-label="Open study Pomodoro timer"
          className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border text-xs font-medium transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            isRunning
              ? isFocus
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-200'
                : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-200'
              : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          {isFocus ? (
            <Timer className={`h-3.5 w-3.5 shrink-0 ${isRunning ? 'text-rose-400' : 'text-sky-400'}`} />
          ) : (
            <Coffee className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          )}
          <span className="font-mono tabular-nums font-semibold">
            {formatClock(secondsLeft)}
          </span>
          <span className="hidden md:inline text-slate-400">
            {isFocus ? 'Focus' : 'Break'}
          </span>
        </button>
      </div>

      {/* Anchored Pomodoro Study Tracker Popover */}
      {panelOpen && (
        <div
          role="dialog"
          aria-label="Pomodoro Study Timer"
          className="absolute right-0 mt-2.5 w-[350px] max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-[#0B1324] border border-slate-200 dark:border-slate-700/90 shadow-2xl z-50 overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" />

          <div className="p-4 space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
                  Study Focus Timer
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Tracking: {currentActivity} · Cycle {(stored.cycleCount % 4) + 1} of 4
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setStored((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  aria-label={stored.soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
                  title={stored.soundEnabled ? 'Chime On' : 'Chime Muted'}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {stored.soundEnabled ? (
                    <Bell className="h-4 w-4 text-amber-500" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close Pomodoro timer"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Phase Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#070D1A] border border-slate-200 dark:border-slate-800">
              {(
                [
                  { id: 'focus', label: 'Focus' },
                  { id: 'shortBreak', label: 'Short Break' },
                  { id: 'longBreak', label: 'Long Break' },
                ] as const
              ).map((item) => {
                const active = phase === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSwitchPhase(item.id)}
                    className={`py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? item.id === 'focus'
                          ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Completion Notice */}
            {completionBanner && (
              <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/35 px-3 py-2 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{completionBanner}</span>
              </div>
            )}

            {/* Circular Timer Ring & Controls */}
            <div className="flex items-center gap-5 py-1">
              <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 108 108" aria-hidden="true">
                  <circle
                    cx="54"
                    cy="54"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <circle
                    cx="54"
                    cy="54"
                    r={ringRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className={`transition-all duration-300 ${
                      isFocus ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
                    {formatClock(secondsLeft)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {isFocus ? 'Study' : 'Rest'}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Focus Duration Presets */}
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Focus Length
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {FOCUS_PRESETS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleFocusPresetChange(mins)}
                        className={`py-1 rounded-md text-xs font-mono font-semibold border transition-colors ${
                          stored.focusMinutes === mins
                            ? 'bg-sky-500/15 border-sky-500/50 text-sky-700 dark:text-sky-300'
                            : 'bg-slate-50 dark:bg-[#070D1A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleRun}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all whitespace-nowrap ${
                      isFocus
                        ? 'bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-110'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    aria-label="Reset timer"
                    title="Reset timer"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipPhase}
                    aria-label="Skip to next phase"
                    title="Skip to next phase"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Study Session Note */}
            <div>
              <label htmlFor="pomodoro-topic-input" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Study Session Goal (Optional)
              </label>
              <input
                id="pomodoro-topic-input"
                type="text"
                maxLength={60}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder={`e.g., ${currentActivity} — Mensuration`}
                className="w-full rounded-lg bg-slate-50 dark:bg-[#070D1A] border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Today's Tracked Study Stats */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>Today&apos;s Study Log</span>
                </span>
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  {stored.sessionsToday} sessions · {stored.minutesToday} min
                </span>
              </div>

              {stored.history.length > 0 ? (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {stored.history.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300"
                    >
                      <span className="truncate">{item.note}</span>
                      <span className="font-mono tabular-nums text-slate-400 shrink-0">
                        {item.minutes}m · {item.completedAt}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setStored((prev) => ({
                          ...prev,
                          sessionsToday: 0,
                          minutesToday: 0,
                          cycleCount: 0,
                          history: [],
                        }))
                      }
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear today</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Start a timer while practicing MCQs or using the AI Tutor to log your focused study blocks.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
