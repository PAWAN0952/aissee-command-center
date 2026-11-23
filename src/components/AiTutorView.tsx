import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  Bot,
  Eraser,
  ExternalLink,
  FileText,
  Globe,
  History,
  Layers,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  CLASS_SUBJECT_CHAPTERS,
  getSuggestedQuestions,
  TUTOR_CLASSES,
  TUTOR_SUBJECT_COLORS,
  TUTOR_SUBJECTS,
} from '../data/tutorCurriculum';
import {
  SourceCitation,
  StudyMaterialMeta,
  TutorChatSession,
  TutorClassLevel,
  TutorContext,
  TutorLanguage,
  TutorMessage,
  TutorMode,
  TutorSubject,
  WebSource,
} from '../types/aissee';
import { LearningStudioPanel } from './tutor/LearningStudioPanel';
import { StudyMaterialsDrawer } from './tutor/StudyMaterialsDrawer';

interface AiTutorViewProps {
  initialPrompt?: string;
  initialContext?: TutorContext | null;
  onClearInitialTrigger: () => void;
}

const SESSIONS_STORAGE_KEY = 'aissee_ai_tutor_sessions_v1';

function mapIncomingSubject(raw?: string): TutorSubject {
  if (!raw) return 'Mathematics';
  const lower = raw.toLowerCase();
  if (lower.includes('math')) return 'Mathematics';
  if (lower.includes('sci') || lower.includes('phys') || lower.includes('chem') || lower.includes('bio')) {
    return 'Science';
  }
  if (lower.includes('social') || lower.includes('hist') || lower.includes('geo') || lower.includes('civics') || lower.includes('polity')) {
    return 'Social Studies';
  }
  if (lower.includes('telugu')) return 'Telugu';
  if (lower.includes('eng')) return 'English';
  if (lower.includes('intel') || lower.includes('gk') || lower.includes('general') || lower.includes('ssb')) {
    return 'General Knowledge';
  }
  return 'Mathematics';
}

function createWelcomeMessage(
  classLevel: TutorClassLevel,
  subject: TutorSubject,
  language: TutorLanguage
): TutorMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'model',
    text:
      language === 'Telugu'
        ? `నమస్తే విద్యార్థి! నేను మీ **AI TUTOR** ని.\n\nమీరు ప్రస్తుతం **Class ${classLevel} · ${subject}** ఎంచుకున్నారు. మీ సందేహాలు అడగండి—నేను సులభమైన ఉదాహరణలతో స్టెప్-బై-స్టెప్ వివరిస్తాను!`
        : `Hello! I am your **AI TUTOR** for Classes 6–10 & AISSEE Preparation.\n\nYou are set to **Class ${classLevel} · ${subject}**. Ask any question below, switch between **AUTO**, **TEXTBOOK**, or **GENERAL** modes, or open the **Learning Studio** for chapter summaries, flashcards, quizzes, and revision notes.`,
    timestamp: new Date().toISOString(),
  };
}

function createNewSession(
  classLevel: TutorClassLevel = '8',
  subject: TutorSubject = 'Mathematics',
  language: TutorLanguage = 'English',
  mode: TutorMode = 'auto'
): TutorChatSession {
  const defaultChapter = CLASS_SUBJECT_CHAPTERS[classLevel][subject][0] ?? '';
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `Class ${classLevel} · ${subject}`,
    classLevel,
    subject,
    chapter: defaultChapter,
    language,
    mode,
    messages: [createWelcomeMessage(classLevel, subject, language)],
    updatedAt: new Date().toISOString(),
  };
}

function loadSavedSessions(): TutorChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [createNewSession()];
    const parsed = JSON.parse(raw) as TutorChatSession[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [createNewSession()];
}

function renderFormattedLine(line: string, keyPrefix: string): React.ReactNode {
  const tokens = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={`${keyPrefix}-c-${i}`}
          className="font-mono text-xs bg-slate-800/90 text-cyan-300 px-1.5 py-0.5 rounded"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
  });
}

function FormattedTutorMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm text-slate-200 leading-relaxed">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={`sp-${idx}`} className="h-1" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={`h3-${idx}`} className="font-display text-sm font-bold text-cyan-300 pt-1">
              {renderFormattedLine(line.slice(4), `h3-${idx}`)}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={`h2-${idx}`} className="font-display text-base font-bold text-white pt-1">
              {renderFormattedLine(line.slice(3), `h2-${idx}`)}
            </h3>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={`ul-${idx}`} className="flex items-start gap-2 pl-1">
              <span className="text-cyan-400 mt-1 shrink-0">•</span>
              <div>{renderFormattedLine(line.slice(2), `ul-${idx}`)}</div>
            </div>
          );
        }
        const numberedMatch = line.match(/^(\d+\.)\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={`ol-${idx}`} className="flex items-start gap-2 pl-1">
              <span className="font-mono text-xs font-semibold text-amber-400 mt-0.5 shrink-0">
                {numberedMatch[1]}
              </span>
              <div>{renderFormattedLine(numberedMatch[2], `ol-${idx}`)}</div>
            </div>
          );
        }
        return <p key={`p-${idx}`}>{renderFormattedLine(line, `p-${idx}`)}</p>;
      })}
    </div>
  );
}

export const AiTutorView: React.FC<AiTutorViewProps> = ({
  initialPrompt,
  initialContext,
  onClearInitialTrigger,
}) => {
  const [sessions, setSessions] = useState<TutorChatSession[]>(() => loadSavedSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const initial = loadSavedSessions();
    return initial[0]?.id ?? '';
  });

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId]
  );

  // Student Settings synchronized with active session
  const [classLevel, setClassLevel] = useState<TutorClassLevel>(activeSession?.classLevel ?? '8');
  const [subject, setSubject] = useState<TutorSubject>(activeSession?.subject ?? 'Mathematics');
  const [chapter, setChapter] = useState<string>(
    activeSession?.chapter ?? CLASS_SUBJECT_CHAPTERS['8'].Mathematics[0]
  );
  const [customChapter, setCustomChapter] = useState<string>('');
  const [language, setLanguage] = useState<TutorLanguage>(activeSession?.language ?? 'English');
  const [mode, setMode] = useState<TutorMode>(activeSession?.mode ?? 'auto');

  const [workspaceTab, setWorkspaceTab] = useState<'chat' | 'studio'>('chat');
  const [historyOpenMobile, setHistoryOpenMobile] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const [materials, setMaterials] = useState<StudyMaterialMeta[]>([]);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [expandedCitationKey, setExpandedCitationKey] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [activeContext, setActiveContext] = useState<TutorContext | null>(initialContext ?? null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);

  const refreshMaterialsAndStatus = async () => {
    try {
      const [matRes, statRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/tutor/status'),
      ]);
      if (matRes.ok) {
        const matData = (await matRes.json()) as { materials?: StudyMaterialMeta[] };
        if (Array.isArray(matData.materials)) setMaterials(matData.materials);
      }
      if (statRes.ok) {
        const statData = (await statRes.json()) as { remainingToday?: number };
        if (typeof statData.remainingToday === 'number') {
          setRemainingToday(statData.remainingToday);
        }
      }
    } catch {
      // ignore offline fetch failures
    }
  };

  useEffect(() => {
    void refreshMaterialsAndStatus();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
    } catch {
      // ignore storage quota errors
    }
  }, [sessions]);

  useEffect(() => {
    if (workspaceTab === 'chat') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isStreaming, workspaceTab]);

  const chapterOptions = useMemo(
    () => CLASS_SUBJECT_CHAPTERS[classLevel][subject] ?? [],
    [classLevel, subject]
  );

  const effectiveChapter = customChapter.trim() || chapter || chapterOptions[0] || subject;

  const updateActiveSession = (updater: (prev: TutorChatSession) => TutorChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updater(s) : s))
    );
  };

  const handleClassChange = (nextClass: TutorClassLevel) => {
    setClassLevel(nextClass);
    const nextCh = CLASS_SUBJECT_CHAPTERS[nextClass][subject][0] ?? '';
    setChapter(nextCh);
    setCustomChapter('');
    updateActiveSession((s) => ({
      ...s,
      classLevel: nextClass,
      chapter: nextCh,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSubjectChange = (nextSub: TutorSubject) => {
    setSubject(nextSub);
    const nextCh = CLASS_SUBJECT_CHAPTERS[classLevel][nextSub][0] ?? '';
    setChapter(nextCh);
    setCustomChapter('');
    updateActiveSession((s) => ({
      ...s,
      subject: nextSub,
      chapter: nextCh,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSelectSession = (sess: TutorChatSession) => {
    setActiveSessionId(sess.id);
    setClassLevel(sess.classLevel);
    setSubject(sess.subject);
    setChapter(sess.chapter);
    setCustomChapter('');
    setLanguage(sess.language);
    setMode(sess.mode);
    setErrorMsg(null);
    setHistoryOpenMobile(false);
  };

  const handleNewChat = () => {
    const fresh = createNewSession(classLevel, subject, language, mode);
    fresh.chapter = effectiveChapter;
    setSessions((prev) => [fresh, ...prev].slice(0, 20));
    setActiveSessionId(fresh.id);
    setActiveContext(null);
    setErrorMsg(null);
    setWorkspaceTab('chat');
    setHistoryOpenMobile(false);
  };

  const handleClearChat = () => {
    setErrorMsg(null);
    setLastFailedPrompt(null);
    updateActiveSession((s) => ({
      ...s,
      title: `Class ${classLevel} · ${subject}`,
      messages: [createWelcomeMessage(classLevel, subject, language)],
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createNewSession(classLevel, subject, language, mode);
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSession.id === id) {
        handleSelectSession(remaining[0]);
      }
      return remaining;
    });
  };

  const sendMessage = async (
    textToSend: string,
    overrides?: {
      context?: TutorContext | null;
      classLevel?: TutorClassLevel;
      subject?: TutorSubject;
      chapter?: string;
      language?: TutorLanguage;
      mode?: TutorMode;
    }
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    const effClass = overrides?.classLevel ?? classLevel;
    const effSubject = overrides?.subject ?? subject;
    const effChapter = overrides?.chapter ?? effectiveChapter;
    const effLang = overrides?.language ?? language;
    const effMode = overrides?.mode ?? mode;
    const effContext = overrides?.context !== undefined ? overrides.context : activeContext;

    setWorkspaceTab('chat');
    setErrorMsg(null);
    setLastFailedPrompt(null);

    const userMsg: TutorMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const currentMsgs = activeSession?.messages ?? [];
    const historyForApi = currentMsgs
      .filter((m) => !m.id.startsWith('welcome-'))
      .map((m) => ({ role: m.role, text: m.text }));

    const assistantId = `m-${Date.now() + 1}`;
    const placeholderAssistant: TutorMessage = {
      id: assistantId,
      role: 'model',
      text: '',
      timestamp: new Date().toISOString(),
    };

    const isFirstUserMsg = currentMsgs.every((m) => m.id.startsWith('welcome-'));
    const nextTitle = isFirstUserMsg
      ? trimmed.slice(0, 42) + (trimmed.length > 42 ? '…' : '')
      : activeSession.title;

    updateActiveSession((s) => ({
      ...s,
      title: nextTitle,
      classLevel: effClass,
      subject: effSubject,
      chapter: effChapter,
      language: effLang,
      mode: effMode,
      messages: [...s.messages, userMsg, placeholderAssistant],
      updatedAt: new Date().toISOString(),
    }));

    setInput('');
    setIsStreaming(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          classLevel: effClass,
          subject: effSubject,
          chapter: effChapter,
          language: effLang,
          mode: effMode,
          context: effContext ?? undefined,
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!res.ok || contentType.includes('application/json')) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || `Tutor request failed (${res.status})`);
      }

      if (!res.body) {
        throw new Error('Empty response stream from server.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let msgResolvedMode: 'textbook' | 'general' | 'hybrid' | undefined;
      let msgCitations: SourceCitation[] = [];
      let msgWebSources: WebSource[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const payloadStr = line.slice(5).trim();
          if (!payloadStr) continue;

          const payload = JSON.parse(payloadStr) as {
            text?: string;
            done?: boolean;
            error?: string;
            meta?: {
              resolvedMode?: 'textbook' | 'general' | 'hybrid';
              citations?: SourceCitation[];
              remainingToday?: number;
            };
            webSources?: WebSource[];
          };

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (payload.meta) {
            msgResolvedMode = payload.meta.resolvedMode;
            msgCitations = Array.isArray(payload.meta.citations) ? payload.meta.citations : [];
            if (typeof payload.meta.remainingToday === 'number') {
              setRemainingToday(payload.meta.remainingToday);
            }
          }

          if (Array.isArray(payload.webSources)) {
            msgWebSources = payload.webSources;
          }

          if (payload.text) {
            accumulated += payload.text;
          }

          updateActiveSession((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    text: accumulated,
                    resolvedMode: msgResolvedMode,
                    citations: msgCitations,
                    webSources: msgWebSources,
                  }
                : m
            ),
          }));
        }
      }

      if (!accumulated.trim()) {
        throw new Error('The AI Tutor returned an empty response. Please try asking again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach AI Tutor.';
      setErrorMsg(msg);
      setLastFailedPrompt(trimmed);
      updateActiveSession((s) => ({
        ...s,
        messages: s.messages.filter((m) => m.id !== assistantId),
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      const nextClass = initialContext?.classLevel ?? classLevel;
      const mappedSub = mapIncomingSubject(initialContext?.subject);
      const nextChapter =
        initialContext?.chapter || CLASS_SUBJECT_CHAPTERS[nextClass][mappedSub][0] || '';
      const nextMode = initialContext?.mode ?? mode;
      setClassLevel(nextClass);
      setSubject(mappedSub);
      setChapter(nextChapter);
      setMode(nextMode);
      setActiveContext(initialContext ?? null);
      void sendMessage(initialPrompt, {
        context: initialContext ?? null,
        classLevel: nextClass,
        subject: mappedSub,
        chapter: nextChapter,
        mode: nextMode,
      });
      onClearInitialTrigger();
    }
  }, [initialPrompt]);

  const suggestedPrompts = useMemo(
    () => getSuggestedQuestions(classLevel, subject, effectiveChapter, language, mode),
    [classLevel, subject, effectiveChapter, language, mode]
  );

  const activeMaterialsCount = materials.filter((m) => m.active).length;
  const subTheme = TUTOR_SUBJECT_COLORS[subject];

  const renderHistorySidebar = () => (
    <div className="flex flex-col h-full justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <History className="h-4 w-4 text-cyan-400" />
            <span>Chat History</span>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
          {sessions.map((sess) => {
            const isSel = sess.id === activeSession?.id;
            return (
              <div
                key={sess.id}
                className={`group flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  isSel
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                    : 'bg-[#081020] border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectSession(sess)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="font-medium truncate">{sess.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Class {sess.classLevel} · {sess.subject} · {sess.language}
                  </div>
                </button>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={() => handleDeleteSession(sess.id)}
                    className="opacity-70 hover:opacity-100 text-slate-400 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white">Suggested Questions</h4>
          <span className="text-[10px] text-cyan-400 font-medium">{language}</span>
        </div>
        <div className="space-y-1.5">
          {suggestedPrompts.map((prompt, idx) => {
            const accents = [
              'hover:border-sky-400/60',
              'hover:border-emerald-400/60',
              'hover:border-amber-400/60',
              'hover:border-violet-400/60',
            ];
            return (
              <button
                key={prompt}
                type="button"
                disabled={isStreaming}
                onClick={() => {
                  setHistoryOpenMobile(false);
                  void sendMessage(prompt);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg bg-[#081020] hover:bg-slate-800/80 border border-slate-800 ${accents[idx % accents.length]} text-[11px] text-slate-200 leading-relaxed transition-colors disabled:opacity-50`}
              >
                {prompt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety & Mode Note */}
      <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Safe Age-Appropriate AI Tutor</span>
        </div>
        <p className="leading-relaxed">
          Textbook mode cites only indexed sources; General mode separates verified facts from uncertain info.
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Top Student Settings & Mode Control Bar */}
      <section className="rounded-xl bg-[#0D1629] border border-cyan-500/30 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-500 via-violet-500 to-emerald-400" />
        <div className="p-4 sm:p-5 space-y-4">
          {/* Header Row: Mode Selector + Sources + Studio Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Three AI Modes */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">AI Mode:</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070D1A] border border-slate-800">
                {(
                  [
                    {
                      id: 'auto',
                      label: 'AUTO MODE',
                      activeCls: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white',
                    },
                    {
                      id: 'textbook',
                      label: 'TEXTBOOK MODE',
                      activeCls: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white',
                    },
                    {
                      id: 'general',
                      label: 'GENERAL MODE',
                      activeCls: 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white',
                    },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      updateActiveSession((s) => ({ ...s, mode: m.id }));
                    }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                      mode === m.id ? m.activeCls : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Controls: NotebookLM Library + Chat/Studio Switch + Quota */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMaterialsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <BookMarked className="h-3.5 w-3.5" />
                <span>Textbooks &amp; Notes ({activeMaterialsCount})</span>
              </button>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070D1A] border border-slate-800">
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('chat')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    workspaceTab === 'chat'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Doubt Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('studio')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    workspaceTab === 'studio'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Learning Studio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Selectors Grid: Class, Subject, Chapter/Topic, Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Class</label>
              <select
                value={classLevel}
                onChange={(e) => handleClassChange(e.target.value as TutorClassLevel)}
                className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {TUTOR_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value as TutorSubject)}
                className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {TUTOR_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] text-slate-400 mb-1">Syllabus Chapter</label>
              <select
                value={chapter}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setCustomChapter('');
                  updateActiveSession((s) => ({ ...s, chapter: e.target.value }));
                }}
                className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {chapterOptions.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Or Custom Topic</label>
              <input
                type="text"
                value={customChapter}
                onChange={(e) => setCustomChapter(e.target.value)}
                placeholder="Any custom topic..."
                className="w-full rounded-lg bg-[#070D1A] border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Language</label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#070D1A] border border-slate-700">
                {(['English', 'Telugu'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      updateActiveSession((s) => ({ ...s, language: lang }));
                    }}
                    className={`py-1 rounded-md text-xs font-semibold transition-colors ${
                      language === lang
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {lang === 'Telugu' ? 'తెలుగు' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Description Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
            <div>
              {mode === 'auto' && (
                <span>
                  <strong className="text-cyan-400">AUTO MODE:</strong> Checks uploaded textbooks, SCERT notes &amp; AISSEE syllabus first, and smoothly uses General Knowledge when needed.
                </span>
              )}
              {mode === 'textbook' && (
                <span>
                  <strong className="text-emerald-400">TEXTBOOK MODE:</strong> Strictly prioritizes uploaded textbooks, SCERT materials, AISSEE syllabus &amp; notes with source citations.
                </span>
              )}
              {mode === 'general' && (
                <span>
                  <strong className="text-violet-400">GENERAL MODE:</strong> Uses Gemini general knowledge &amp; Google Search grounding beyond syllabus, distinguishing verified facts.
                </span>
              )}
            </div>
            {remainingToday !== null && (
              <div className="font-mono tabular-nums text-slate-400 shrink-0">
                Daily AI Quota Remaining: <strong className="text-slate-200">{remainingToday}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Responsive Workspace: History Sidebar + Chat / Learning Studio */}
      {workspaceTab === 'studio' ? (
        <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-5 sm:p-6">
          <LearningStudioPanel
            classLevel={classLevel}
            subject={subject}
            chapter={effectiveChapter}
            language={language}
            mode={mode}
            onDiscussInChat={(prompt) => void sendMessage(prompt)}
          />
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Desktop Left Sidebar: Chat History & Suggested Questions */}
          <aside className="hidden lg:block lg:col-span-4 rounded-xl bg-[#0D1629] border border-slate-800/90 p-5 h-[calc(100vh-19rem)] min-h-[500px] overflow-y-auto">
            {renderHistorySidebar()}
          </aside>

          {/* Mobile History Drawer */}
          {historyOpenMobile && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
                onClick={() => setHistoryOpenMobile(false)}
              />
              <aside className="relative z-10 w-[300px] max-w-[85vw] h-full bg-[#0D1629] border-r border-slate-800 p-5 overflow-y-auto">
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => setHistoryOpenMobile(false)}
                    aria-label="Close history"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {renderHistorySidebar()}
              </aside>
            </div>
          )}

          {/* Main Chat Container */}
          <section className="lg:col-span-8 rounded-xl bg-[#0D1629] border border-slate-800/90 flex flex-col h-[calc(100vh-19rem)] min-h-[500px] overflow-hidden">
            {/* Chat Header */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setHistoryOpenMobile(true)}
                  className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-cyan-400"
                  aria-label="Open chat history and suggestions"
                >
                  <History className="h-4 w-4" />
                </button>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500/25 to-violet-500/25 border border-cyan-400/40 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold text-white truncate">
                    Class {classLevel} · <span className={subTheme.text}>{subject}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {effectiveChapter} · {language} · {mode.toUpperCase()} MODE
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  <span>Clear Chat</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>

            {/* Active Question Context Strip */}
            {activeContext?.questionText && (
              <div className="px-5 py-2 bg-blue-950/35 border-b border-blue-800/50 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 text-sky-200 truncate">
                  <span className="font-semibold">Practice Context: </span>
                  <span>{activeContext.questionText}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveContext(null)}
                  aria-label="Detach context"
                  className="text-slate-400 hover:text-white shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5">
              {(activeSession?.messages ?? []).map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500/25 to-violet-500/25 border border-cyan-400/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-cyan-300" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-xl px-4 py-3 space-y-3 ${
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm leading-relaxed shadow-sm'
                          : 'bg-[#081020] border border-slate-800/90 text-slate-200'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : msg.text ? (
                        <>
                          {msg.resolvedMode && (
                            <div className="flex items-center gap-2 text-[11px] font-medium pb-1.5 border-b border-slate-800/70">
                              {msg.resolvedMode === 'textbook' && (
                                <span className="inline-flex items-center gap-1 text-emerald-400">
                                  <BookOpen className="h-3 w-3" />
                                  Textbook &amp; Syllabus Grounded
                                </span>
                              )}
                              {msg.resolvedMode === 'hybrid' && (
                                <span className="inline-flex items-center gap-1 text-cyan-400">
                                  <Layers className="h-3 w-3" />
                                  Auto Mode (Textbook + General Knowledge)
                                </span>
                              )}
                              {msg.resolvedMode === 'general' && (
                                <span className="inline-flex items-center gap-1 text-violet-400">
                                  <Globe className="h-3 w-3" />
                                  General Knowledge &amp; Web Grounded
                                </span>
                              )}
                            </div>
                          )}

                          <FormattedTutorMessage text={msg.text} />

                          {/* Retrieved Textbook Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                                <FileText className="h-3 w-3" />
                                <span>Retrieved Study Sources ({msg.citations.length})</span>
                              </div>
                              <div className="space-y-1.5">
                                {msg.citations.map((cit, cIdx) => {
                                  const key = `${msg.id}-cit-${cIdx}`;
                                  const isExpanded = expandedCitationKey === key;
                                  return (
                                    <div
                                      key={key}
                                      className="rounded-lg bg-[#070D1A] border border-slate-800 px-3 py-2 text-[11px]"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedCitationKey(isExpanded ? null : key)
                                        }
                                        className="w-full text-left flex items-center justify-between gap-2"
                                      >
                                        <span className="font-medium text-slate-200 truncate">
                                          {cit.title}{' '}
                                          <span className="text-emerald-400">· {cit.location}</span>
                                        </span>
                                        <span className="text-cyan-400 shrink-0">
                                          {isExpanded ? 'Hide' : 'Excerpt'}
                                        </span>
                                      </button>
                                      {isExpanded && (
                                        <p className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-slate-400 leading-relaxed">
                                          {cit.snippet}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Google Search Grounding Sources */}
                          {msg.webSources && msg.webSources.length > 0 && (
                            <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                              <div className="text-[11px] font-semibold text-violet-400 flex items-center gap-1.5">
                                <Globe className="h-3 w-3" />
                                <span>Web Grounding References</span>
                              </div>
                              <div className="space-y-1">
                                {msg.webSources.map((ws) => (
                                  <a
                                    key={ws.uri}
                                    href={ws.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 truncate"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{ws.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                          <span>
                            {mode === 'textbook'
                              ? 'Searching uploaded textbooks & preparing step-by-step lesson...'
                              : 'Thinking through the steps...'}
                          </span>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}

              {errorMsg && (
                <div className="rounded-xl bg-rose-950/50 border border-rose-500/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                  {lastFailedPrompt && (
                    <button
                      type="button"
                      onClick={() => void sendMessage(lastFailedPrompt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 self-start sm:self-center"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Mobile Quick Suggestions Strip */}
            <div className="lg:hidden px-4 py-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto">
              {suggestedPrompts.slice(0, 2).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void sendMessage(p)}
                  className="text-[11px] text-slate-300 bg-[#081020] border border-slate-800 rounded-lg px-3 py-1.5 whitespace-nowrap shrink-0"
                >
                  {p.slice(0, 46)}…
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
              className="p-3.5 sm:p-4 border-t border-slate-800/80 flex items-end gap-2.5"
            >
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder={
                  language === 'Telugu'
                    ? `Class ${classLevel} ${subject} గురించి మీ సందేహాన్ని తెలుగులో లేదా ఇంగ్లీష్‌లో అడగండి...`
                    : `Ask any Class ${classLevel} ${subject} doubt, math problem, or concept... (Enter to send)`
                }
                className="flex-1 resize-none rounded-xl bg-[#070D1A] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold transition-all shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* NotebookLM-Style Textbook & Study Material Drawer */}
      <StudyMaterialsDrawer
        open={materialsOpen}
        onClose={() => setMaterialsOpen(false)}
        materials={materials}
        onRefreshMaterials={refreshMaterialsAndStatus}
        onAskAboutMaterial={(mat) => {
          const mappedSub = mapIncomingSubject(mat.subject);
          setSubject(mappedSub);
          setMode('textbook');
          if (mat.classLevel !== 'All' && ['6', '7', '8', '9', '10'].includes(mat.classLevel)) {
            setClassLevel(mat.classLevel as TutorClassLevel);
          }
          void sendMessage(
            language === 'Telugu'
              ? `"${mat.title}" పాఠ్యపుస్తకం / నోట్స్ నుండి ముఖ్యమైన అంశాలను సారాంశంగా వివరించండి.`
              : `Summarize the key concepts and exam-important points from "${mat.title}".`,
            {
              mode: 'textbook',
              subject: mappedSub,
              chapter: mat.chapter,
            }
          );
        }}
      />
    </motion.div>
  );
};
