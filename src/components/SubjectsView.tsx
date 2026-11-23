import React, { useState } from 'react';
import { ArrowRight, BookOpen, Bot, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { NDA_EXAM_PATTERN, NDA_SUBJECTS, NdaSectionId } from '../data/ndaSyllabus';
import { OFFICIAL_EXAM_PATTERN, SUBJECTS } from '../data/syllabus';
import { ExamTrack, SubjectId, TutorContext, UserProgress } from '../types/aissee';
import { computeOverallAnalytics } from '../utils/analytics';
import { SUBJECT_COLORS } from '../utils/theme';

const NDA_SECTION_COLORS: Record<
  NdaSectionId,
  { text: string; activeTab: string; cta: string; border: string; bullet: string }
> = {
  'nda-math': {
    text: 'text-sky-400',
    activeTab: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm',
    cta: 'bg-gradient-to-r from-blue-600 to-sky-500 hover:brightness-110 text-white',
    border: 'border-sky-500/35',
    bullet: 'text-sky-400',
  },
  'nda-english': {
    text: 'text-cyan-400',
    activeTab: 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-sm',
    cta: 'bg-gradient-to-r from-teal-600 to-cyan-500 hover:brightness-110 text-white',
    border: 'border-cyan-500/35',
    bullet: 'text-cyan-400',
  },
  'nda-gk-science': {
    text: 'text-emerald-400',
    activeTab: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm',
    cta: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white',
    border: 'border-emerald-500/35',
    bullet: 'text-emerald-400',
  },
  'nda-gk-humanities': {
    text: 'text-amber-400',
    activeTab: 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-sm',
    cta: 'bg-gradient-to-r from-amber-600 to-orange-500 hover:brightness-110 text-white',
    border: 'border-amber-500/35',
    bullet: 'text-amber-400',
  },
  'nda-ssb': {
    text: 'text-rose-400',
    activeTab: 'bg-gradient-to-r from-rose-600 to-fuchsia-500 text-white shadow-sm',
    cta: 'bg-gradient-to-r from-rose-600 to-fuchsia-500 hover:brightness-110 text-white',
    border: 'border-rose-500/35',
    bullet: 'text-rose-400',
  },
};

interface SubjectsViewProps {
  progress: UserProgress;
  onPracticeChapter: (subject: SubjectId, chapter: string) => void;
  onAskTutor: (prompt: string, context?: TutorContext) => void;
  onGenerateTopic: (track: ExamTrack, subjectOrNdaId: string, chapter: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  progress,
  onPracticeChapter,
  onAskTutor,
  onGenerateTopic,
}) => {
  const [examTrack, setExamTrack] = useState<ExamTrack>('aissee');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('mathematics');
  const [selectedNdaSection, setSelectedNdaSection] = useState<NdaSectionId>('nda-math');
  const analytics = computeOverallAnalytics(progress);

  const activeSubjectMeta = SUBJECTS.find((s) => s.id === selectedSubject) ?? SUBJECTS[0];
  const activeSubjectColor = SUBJECT_COLORS[activeSubjectMeta.id];
  const activeNdaMeta = NDA_SUBJECTS.find((s) => s.id === selectedNdaSection) ?? NDA_SUBJECTS[0];
  const activeNdaColor = NDA_SECTION_COLORS[activeNdaMeta.id];

  const chapterStatsMap = new Map(
    analytics.allChapterStats
      .filter((c) => c.subjectId === selectedSubject)
      .map((c) => [c.chapter, c])
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Exam Track Selector: AISSEE Class 9 vs UPSC NDA & NA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-[#0B1324] border border-slate-800/90 p-3">
        <div className="px-2">
          <div className="text-xs font-semibold text-white">Examination Syllabus Track</div>
          <div className="text-xs text-slate-400">
            Switch between NTA AISSEE Class 9 and UPSC NDA &amp; NA Officer Entry
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070D1A] border border-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setExamTrack('aissee')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              examTrack === 'aissee'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            AISSEE Class 9 (NTA)
          </button>
          <button
            type="button"
            onClick={() => setExamTrack('nda')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              examTrack === 'nda'
                ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            UPSC NDA &amp; NA
          </button>
        </div>
      </div>

      {examTrack === 'aissee' ? (
        <>
          {/* Official NTA Pattern Overview Table */}
          <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Official NTA AISSEE Class IX Examination Pattern
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {OFFICIAL_EXAM_PATTERN.mode} · {OFFICIAL_EXAM_PATTERN.durationMinutes} Minutes (3 Hours) · {OFFICIAL_EXAM_PATTERN.medium} · {OFFICIAL_EXAM_PATTERN.negativeMarking}
                </p>
              </div>
              <a
                href={OFFICIAL_EXAM_PATTERN.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0"
              >
                <span>NTA Official Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">Section</th>
                    <th className="py-2.5 px-4 font-medium">Subject</th>
                    <th className="py-2.5 px-4 font-medium text-right">Questions</th>
                    <th className="py-2.5 px-4 font-medium text-right">Marks / Q</th>
                    <th className="py-2.5 px-4 font-medium text-right">Total Marks</th>
                    <th className="py-2.5 pl-4 font-medium text-right">Min Qualifying (25%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {SUBJECTS.map((sub) => {
                    const rowTheme = SUBJECT_COLORS[sub.id];
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedSubject(sub.id)}
                        className={`cursor-pointer transition-colors ${
                          selectedSubject === sub.id ? rowTheme.softBg : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className={`py-2.5 pr-4 font-mono text-xs font-semibold ${rowTheme.text}`}>
                          Section {sub.sectionCode}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-white">{sub.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">{sub.questionCount}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">{sub.marksPerQuestion}</td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-white">{sub.totalMarks}</td>
                        <td className="py-2.5 pl-4 text-right font-mono tabular-nums text-slate-300">{sub.qualifyingMarks}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-slate-700 bg-[#09101E] font-semibold">
                    <td className="py-3 pr-4 text-xs text-slate-300">Total</td>
                    <td className="py-3 px-4 text-white">All 5 Sections Combined</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-white">150</td>
                    <td className="py-3 px-4 text-right text-slate-400">—</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-sky-400">400</td>
                    <td className="py-3 pl-4 text-right font-mono tabular-nums text-emerald-400">160 (40%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* AISSEE Subject Segmented Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1324] border border-slate-800/90">
            {SUBJECTS.map((sub) => {
              const active = selectedSubject === sub.id;
              const subTheme = SUBJECT_COLORS[sub.id];
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? subTheme.activeTab
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {sub.sectionCode}. {sub.name}
                </button>
              );
            })}
          </div>

          {/* Selected AISSEE Subject Header + Chapters */}
          <section className="space-y-4">
            <div className={`rounded-xl bg-[#0D1629] border ${activeSubjectColor.border} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="space-y-1.5 max-w-3xl">
                <div className={`text-xs font-medium ${activeSubjectColor.text}`}>
                  Section {activeSubjectMeta.sectionCode} · {activeSubjectMeta.questionCount} Questions · {activeSubjectMeta.totalMarks} Marks ({activeSubjectMeta.marksPerQuestion} marks each)
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  {activeSubjectMeta.name} — Official Class 9 Syllabus
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeSubjectMeta.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPracticeChapter(activeSubjectMeta.id, '')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${activeSubjectColor.activeTab} hover:brightness-110 text-sm font-semibold transition-all whitespace-nowrap shrink-0 self-start md:self-center`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Practice All {activeSubjectMeta.shortName}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSubjectMeta.chapters.map((chapter, index) => {
                const stats = chapterStatsMap.get(chapter.title);
                const attempted = stats?.attempted ?? 0;
                const accuracy = stats?.accuracy ?? 0;

                return (
                  <div
                    key={chapter.id}
                    className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-400">
                            {String(index + 1).padStart(2, '0')}. {chapter.ncertUnit}
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span
                              className={
                                chapter.weightage === 'High'
                                  ? `${activeSubjectColor.text} font-medium`
                                  : 'text-slate-400'
                              }
                            >
                              {chapter.weightage} Priority
                            </span>
                          </div>
                          <h4 className="font-display text-base font-semibold text-white mt-1">
                            {chapter.title}
                          </h4>
                        </div>

                        <div className="text-right shrink-0">
                          {attempted > 0 ? (
                            <div className="font-mono tabular-nums text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{accuracy}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Not practiced</span>
                          )}
                        </div>
                      </div>

                      <ul className="space-y-1 text-xs text-slate-300">
                        {chapter.keyTopics.map((topic) => (
                          <li key={topic} className="flex items-start gap-2">
                            <span className={`${activeSubjectColor.text} mt-0.5`}>•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                        <span className="text-slate-200 font-medium">Exam Tip: </span>
                        {chapter.studyTip}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() =>
                          onAskTutor(
                            `Please teach me the core concepts and key shortcuts for "${chapter.title}" in ${activeSubjectMeta.name} for AISSEE Class 9, with 2 solved examples.`,
                            {
                              examTrack: 'aissee',
                              subject: activeSubjectMeta.name,
                              chapter: chapter.title,
                            }
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-cyan-400 text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        <span>Ask AI Tutor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPracticeChapter(activeSubjectMeta.id, chapter.title)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${activeSubjectColor.activeTab} hover:brightness-110 text-xs font-semibold transition-all whitespace-nowrap`}
                      >
                        <span>Practice Chapter</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Official UPSC NDA & NA Exam Pattern Table */}
          <section className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Official {NDA_EXAM_PATTERN.examName} Pattern
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {NDA_EXAM_PATTERN.mode} · {NDA_EXAM_PATTERN.medium} · {NDA_EXAM_PATTERN.negativeMarkingRule}
                </p>
              </div>
              <a
                href={NDA_EXAM_PATTERN.officialPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0"
              >
                <span>UPSC Official Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">Stage / Paper</th>
                    <th className="py-2.5 px-4 font-medium">Subject Coverage</th>
                    <th className="py-2.5 px-4 font-medium text-right">Questions</th>
                    <th className="py-2.5 px-4 font-medium text-right">Correct / Wrong</th>
                    <th className="py-2.5 px-4 font-medium text-right">Duration</th>
                    <th className="py-2.5 pl-4 font-medium text-right">Total Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr
                    onClick={() => setSelectedNdaSection('nda-math')}
                    className={`cursor-pointer transition-colors ${
                      selectedNdaSection === 'nda-math' ? 'bg-blue-600/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-sky-400">Paper 1</td>
                    <td className="py-2.5 px-4 font-medium text-white">Mathematics (Class 11–12 NCERT)</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">120</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">+2.5 / -0.83</td>
                    <td className="py-2.5 px-4 text-right text-xs text-slate-300">2.5 Hours</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-semibold text-white">300</td>
                  </tr>
                  <tr
                    onClick={() => setSelectedNdaSection('nda-english')}
                    className={`cursor-pointer transition-colors ${
                      selectedNdaSection === 'nda-english' ? 'bg-blue-600/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-sky-400">Paper 2 (Part A)</td>
                    <td className="py-2.5 px-4 font-medium text-white">GAT — English</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">50</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">+4.0 / -1.33</td>
                    <td className="py-2.5 px-4 text-right text-xs text-slate-300">Shared 2.5h</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-semibold text-white">200</td>
                  </tr>
                  <tr
                    onClick={() => setSelectedNdaSection('nda-gk-science')}
                    className={`cursor-pointer transition-colors ${
                      selectedNdaSection === 'nda-gk-science' || selectedNdaSection === 'nda-gk-humanities'
                        ? 'bg-blue-600/10'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-sky-400">Paper 2 (Part B)</td>
                    <td className="py-2.5 px-4 font-medium text-white">
                      GAT — General Knowledge (Physics, Chem, Bio, History, Geo, Current)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">100</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">+4.0 / -1.33</td>
                    <td className="py-2.5 px-4 text-right text-xs text-slate-300">Shared 2.5h</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-semibold text-white">400</td>
                  </tr>
                  <tr
                    onClick={() => setSelectedNdaSection('nda-ssb')}
                    className={`cursor-pointer transition-colors ${
                      selectedNdaSection === 'nda-ssb' ? 'bg-blue-600/10' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-sky-400">Stage II</td>
                    <td className="py-2.5 px-4 font-medium text-white">SSB Interview (Stage I Screening + Stage II OLQs)</td>
                    <td className="py-2.5 px-4 text-right text-xs text-slate-400">5-Day Board</td>
                    <td className="py-2.5 px-4 text-right text-xs text-slate-400">Holistic</td>
                    <td className="py-2.5 px-4 text-right text-xs text-slate-300">5 Days</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-semibold text-white">900</td>
                  </tr>
                  <tr className="border-t border-slate-700 bg-[#09101E] font-semibold">
                    <td className="py-3 pr-4 text-xs text-slate-300">Final Merit</td>
                    <td className="py-3 px-4 text-white">Written Examination (900) + SSB Interview (900)</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-white">270 MCQs</td>
                    <td className="py-3 px-4 text-right text-slate-400">1/3 Negative</td>
                    <td className="py-3 px-4 text-right text-xs text-slate-300">5h + 5 Days</td>
                    <td className="py-3 pl-4 text-right font-mono tabular-nums text-sky-400">1800</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* NDA Paper & Section Segmented Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1324] border border-slate-800/90">
            {NDA_SUBJECTS.map((sec) => {
              const active = selectedNdaSection === sec.id;
              const secTheme = NDA_SECTION_COLORS[sec.id];
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedNdaSection(sec.id)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? secTheme.activeTab
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {sec.shortName}
                </button>
              );
            })}
          </div>

          {/* Selected NDA Section Header + Chapters */}
          <section className="space-y-4">
            <div className={`rounded-xl bg-[#0D1629] border ${activeNdaColor.border} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="space-y-1.5 max-w-3xl">
                <div className={`text-xs font-medium ${activeNdaColor.text}`}>
                  {activeNdaMeta.paperCode}
                  {activeNdaMeta.questionCount ? ` · ${activeNdaMeta.questionCount} Questions` : ''}
                  {' · '}
                  {activeNdaMeta.totalMarks} Marks ({activeNdaMeta.marksPerQuestion} / {activeNdaMeta.negativeMarking})
                  {' · '}
                  {activeNdaMeta.duration}
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  {activeNdaMeta.name} — Official UPSC NDA Syllabus
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeNdaMeta.description}
                </p>
              </div>
              {activeNdaMeta.generatable && (
                <button
                  type="button"
                  onClick={() =>
                    onGenerateTopic(
                      'nda',
                      activeNdaMeta.id,
                      activeNdaMeta.chapters[0]?.title ?? ''
                    )
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${activeNdaColor.cta} text-sm font-semibold transition-all whitespace-nowrap shrink-0 self-start md:self-center`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate NDA MCQs</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeNdaMeta.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="rounded-xl bg-[#0D1629] border border-slate-800/90 p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400">
                        {String(index + 1).padStart(2, '0')}. {chapter.ncertUnit}
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span
                          className={
                            chapter.weightage === 'High'
                              ? `${activeNdaColor.text} font-medium`
                              : 'text-slate-400'
                          }
                        >
                          {chapter.weightage} Priority
                        </span>
                      </div>
                      <h4 className="font-display text-base font-semibold text-white mt-1">
                        {chapter.title}
                      </h4>
                    </div>

                    <ul className="space-y-1 text-xs text-slate-300">
                      {chapter.keyTopics.map((topic) => (
                        <li key={topic} className="flex items-start gap-2">
                          <span className={`${activeNdaColor.bullet} mt-0.5`}>•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                      <span className="text-slate-200 font-medium">NDA Strategy: </span>
                      {chapter.studyTip}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() =>
                        onAskTutor(
                          `Please coach me on "${chapter.title}" (${activeNdaMeta.name}) for the UPSC NDA & NA examination, including key concepts, formulas/framework, and 2 examples.`,
                          {
                            examTrack: 'nda',
                            subject: activeNdaMeta.name,
                            chapter: chapter.title,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-cyan-400 text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Ask AI Tutor</span>
                    </button>

                    {activeNdaMeta.generatable ? (
                      <button
                        type="button"
                        onClick={() => onGenerateTopic('nda', activeNdaMeta.id, chapter.title)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${activeNdaColor.cta} text-xs font-semibold transition-all whitespace-nowrap`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generate MCQs</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onAskTutor(
                            `Give me a practical preparation plan and sample exercises for ${chapter.title} in the UPSC NDA SSB Interview.`,
                            {
                              examTrack: 'nda',
                              subject: activeNdaMeta.name,
                              chapter: chapter.title,
                            }
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${activeNdaColor.cta} text-xs font-semibold transition-all whitespace-nowrap`}
                      >
                        <span>SSB Practice Prompt</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
};
