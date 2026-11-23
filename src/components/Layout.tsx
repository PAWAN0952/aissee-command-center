import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { NavSection } from '../types/aissee';
import { NAV_COLORS } from '../utils/theme';
import { PomodoroTimer } from './PomodoroTimer';

interface LayoutProps {
  activeNav: NavSection;
  onNavigate: (section: NavSection) => void;
  cadetName: string;
  streak: number;
  todayCount: number;
  dailyGoal: number;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'subjects', label: 'Subjects & Syllabus', icon: BookOpen },
  { id: 'practice', label: 'Question Practice', icon: CheckCircle2 },
  { id: 'mock-test', label: 'Mock Tests', icon: ClipboardCheck },
  { id: 'ai-tutor', label: 'AI TUTOR', icon: Bot },
  { id: 'ai-generator', label: 'AI Question Generator', icon: Sparkles },
  { id: 'progress', label: 'Progress Tracker', icon: BarChart3 },
];

const SECTION_TITLES: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Command Dashboard',
    subtitle: 'AISSEE Class 9 Readiness · Official NTA Pattern (150 Qs · 400 Marks)',
  },
  subjects: {
    title: 'Official Syllabus & Subjects',
    subtitle: 'NTA AISSEE Class 9 (NCERT Class 8) & UPSC NDA & NA Syllabi',
  },
  practice: {
    title: 'Chapter-Wise Practice',
    subtitle: 'Original MCQs with Instant Evaluation & Step-by-Step Solutions',
  },
  'mock-test': {
    title: 'Examination Simulation',
    subtitle: 'Timed AISSEE Class 9 Mock Tests · Automatic Scoring & Section Cutoffs',
  },
  'ai-tutor': {
    title: 'AI TUTOR',
    subtitle: 'Classes 6–10 · English & Telugu · Auto, Textbook (NotebookLM) & General Modes',
  },
  'ai-generator': {
    title: 'AI Question Generator',
    subtitle: 'Custom Original Practice Sets by Subject, Chapter & Difficulty',
  },
  progress: {
    title: 'Progress & Performance Analytics',
    subtitle: 'Accuracy Trends, Weak Chapters & Mock Test History',
  },
};

export const Layout: React.FC<LayoutProps> = ({
  activeNav,
  onNavigate,
  cadetName,
  streak,
  todayCount,
  dailyGoal,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('aissee_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('aissee_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const meta = SECTION_TITLES[activeNav];
  const goalPct = Math.min(100, Math.round((todayCount / Math.max(1, dailyGoal)) * 100));

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-[#0B1324] text-slate-200 border-r border-slate-800/80">
      <div>
        {/* Brand Block */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-violet-500 via-rose-500 to-amber-400" />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg p-[1.5px] bg-gradient-to-br from-sky-400 via-violet-400 to-amber-400 flex items-center justify-center">
            <div className="h-full w-full rounded-[6px] overflow-hidden bg-[#0F1B33] flex items-center justify-center">
              {!imgError ? (
                <img
                  src="/src/assets/images/cadet_academy_crest_1795419947201.jpg"
                  alt="AISSEE Command Center Crest"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Shield className="h-5 w-5 text-sky-400" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-bold tracking-tight text-white truncate">
              AISSEE Command
            </div>
            <div className="text-xs text-slate-400 truncate">
              Class 9 Entrance Prep
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary Navigation" className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const navColor = NAV_COLORS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isActive
                    ? navColor.activeBg
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : navColor.iconText}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Cadet Summary */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Daily Target</span>
            <span className="font-mono tabular-nums text-slate-200">
              {todayCount}/{dailyGoal} Qs
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="truncate font-medium text-slate-200">{cadetName}</span>
          <span className="font-mono tabular-nums text-amber-400 shrink-0 font-semibold">
            {streak}d streak
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070D1A] text-slate-100 flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[264px] shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-[272px] max-w-[85vw] h-full">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Contextual Bar */}
        <header className="sticky top-0 z-30 bg-[#070D1A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-base sm:text-lg font-semibold text-white truncate">
                  {meta.title}
                </h1>
                <p className="hidden sm:block text-xs text-slate-400 truncate">
                  {meta.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PomodoroTimer activeNav={activeNav} />
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden md:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-sky-400" />
                    <span className="hidden md:inline">Dark</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('mock-test')}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 hover:brightness-110 text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Target className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">Mock</span>
                <span className="hidden sm:inline">Launch Mock Test</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1280px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
