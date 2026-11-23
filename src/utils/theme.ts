import { NavSection, SubjectId } from '../types/aissee';

export interface SubjectColorTheme {
  text: string;
  softBg: string;
  border: string;
  bar: string;
  hex: string;
  activeTab: string;
}

export const SUBJECT_COLORS: Record<SubjectId, SubjectColorTheme> = {
  mathematics: {
    text: 'text-sky-400',
    softBg: 'bg-sky-500/15',
    border: 'border-sky-500/35',
    bar: 'bg-gradient-to-r from-blue-500 to-sky-400',
    hex: '#38BDF8',
    activeTab: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm',
  },
  intelligence: {
    text: 'text-violet-400',
    softBg: 'bg-violet-500/15',
    border: 'border-violet-500/35',
    bar: 'bg-gradient-to-r from-violet-600 to-fuchsia-400',
    hex: '#A78BFA',
    activeTab: 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-sm',
  },
  english: {
    text: 'text-cyan-400',
    softBg: 'bg-cyan-500/15',
    border: 'border-cyan-500/35',
    bar: 'bg-gradient-to-r from-teal-500 to-cyan-400',
    hex: '#22D3EE',
    activeTab: 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-sm',
  },
  science: {
    text: 'text-emerald-400',
    softBg: 'bg-emerald-500/15',
    border: 'border-emerald-500/35',
    bar: 'bg-gradient-to-r from-emerald-500 to-lime-400',
    hex: '#34D399',
    activeTab: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm',
  },
  social: {
    text: 'text-amber-400',
    softBg: 'bg-amber-500/15',
    border: 'border-amber-500/35',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
    hex: '#FBBF24',
    activeTab: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-sm',
  },
};

export const NAV_COLORS: Record<
  NavSection,
  { iconText: string; activeBg: string }
> = {
  dashboard: {
    iconText: 'text-sky-400',
    activeBg: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm',
  },
  subjects: {
    iconText: 'text-emerald-400',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm',
  },
  practice: {
    iconText: 'text-violet-400',
    activeBg: 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-sm',
  },
  'mock-test': {
    iconText: 'text-rose-400',
    activeBg: 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-sm',
  },
  'ai-tutor': {
    iconText: 'text-cyan-400',
    activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-sm',
  },
  'ai-generator': {
    iconText: 'text-amber-400',
    activeBg: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm',
  },
  progress: {
    iconText: 'text-fuchsia-400',
    activeBg: 'bg-gradient-to-r from-fuchsia-600 to-violet-500 text-white shadow-sm',
  },
};
