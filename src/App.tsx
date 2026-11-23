import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { PracticeView } from './components/PracticeView';
import { MockTestView } from './components/MockTestView';
import { AiTutorView } from './components/AiTutorView';
import { QuestionGeneratorView } from './components/QuestionGeneratorView';
import { ProgressView } from './components/ProgressView';
import {
  Difficulty,
  ExamTrack,
  MockTestResult,
  NavSection,
  Question,
  SubjectId,
  TutorContext,
  UserProgress,
} from './types/aissee';
import { computeOverallAnalytics } from './utils/analytics';
import {
  addMockTestResult,
  addPracticeAttempt,
  getDefaultProgress,
  loadProgress,
  saveAiQuestionsToBank,
  saveProgress,
} from './utils/storage';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  // Cross-view handoff states
  const [practiceTarget, setPracticeTarget] = useState<{
    subject?: SubjectId;
    chapter?: string;
  }>({});

  const [tutorTrigger, setTutorTrigger] = useState<{
    prompt?: string;
    context?: TutorContext | null;
  }>({});

  const [generatorTarget, setGeneratorTarget] = useState<{
    track?: ExamTrack;
    subjectKey?: string;
    chapter?: string;
  }>({});

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const analytics = computeOverallAnalytics(progress);

  const handleUpdateProfile = (
    updates: Partial<Pick<UserProgress, 'cadetName' | 'targetExamDate' | 'dailyGoal'>>
  ) => {
    setProgress((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleRecordAttempt = (attempt: {
    questionId: string;
    subject: SubjectId;
    chapter: string;
    difficulty: Difficulty;
    selectedIndex: number;
    isCorrect: boolean;
    source: 'curated' | 'ai_generated';
  }) => {
    setProgress((prev) => addPracticeAttempt(prev, attempt));
  };

  const handleSubmitMockTest = (result: MockTestResult) => {
    setProgress((prev) => addMockTestResult(prev, result));
  };

  const handleSaveGeneratedQuestions = (questions: Question[]) => {
    setProgress((prev) => saveAiQuestionsToBank(prev, questions));
  };

  const handlePracticeSubject = (subject: SubjectId, chapter?: string) => {
    setPracticeTarget({ subject, chapter: chapter ?? '' });
    setActiveNav('practice');
  };

  const handleAskTutor = (prompt: string, context?: TutorContext) => {
    setTutorTrigger({ prompt, context: context ?? null });
    setActiveNav('ai-tutor');
  };

  const handleGenerateTopic = (track: ExamTrack, subjectKey: string, chapter: string) => {
    setGeneratorTarget({ track, subjectKey, chapter });
    setActiveNav('ai-generator');
  };

  const handleResetProgress = () => {
    const fresh = getDefaultProgress();
    setProgress(fresh);
  };

  return (
    <Layout
      activeNav={activeNav}
      onNavigate={setActiveNav}
      cadetName={progress.cadetName}
      streak={analytics.streak}
      todayCount={analytics.todayCount}
      dailyGoal={progress.dailyGoal}
    >
      {activeNav === 'dashboard' && (
        <DashboardView
          progress={progress}
          onUpdateProfile={handleUpdateProfile}
          onNavigate={setActiveNav}
          onPracticeSubject={handlePracticeSubject}
          onAskTutor={(prompt) => handleAskTutor(prompt)}
        />
      )}

      {activeNav === 'subjects' && (
        <SubjectsView
          progress={progress}
          onPracticeChapter={handlePracticeSubject}
          onAskTutor={handleAskTutor}
          onGenerateTopic={handleGenerateTopic}
        />
      )}

      {activeNav === 'practice' && (
        <PracticeView
          initialSubject={practiceTarget.subject}
          initialChapter={practiceTarget.chapter}
          aiQuestions={progress.aiQuestions}
          onRecordAttempt={handleRecordAttempt}
          onAskTutor={handleAskTutor}
          onNavigateGenerator={() => setActiveNav('ai-generator')}
        />
      )}

      {activeNav === 'mock-test' && (
        <MockTestView
          onSubmitMockTest={handleSubmitMockTest}
          onAskTutor={handleAskTutor}
        />
      )}

      {activeNav === 'ai-tutor' && (
        <AiTutorView
          initialPrompt={tutorTrigger.prompt}
          initialContext={tutorTrigger.context}
          onClearInitialTrigger={() => setTutorTrigger({})}
        />
      )}

      {activeNav === 'ai-generator' && (
        <QuestionGeneratorView
          initialTrack={generatorTarget.track}
          initialSubjectKey={generatorTarget.subjectKey}
          initialChapter={generatorTarget.chapter}
          onSaveGeneratedQuestions={handleSaveGeneratedQuestions}
          onRecordAttempt={handleRecordAttempt}
          onAskTutor={handleAskTutor}
        />
      )}

      {activeNav === 'progress' && (
        <ProgressView
          progress={progress}
          onPracticeChapter={handlePracticeSubject}
          onAskTutor={handleAskTutor}
          onResetProgress={handleResetProgress}
        />
      )}
    </Layout>
  );
}
