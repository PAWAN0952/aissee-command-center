export type SubjectId =
  | 'mathematics'
  | 'intelligence'
  | 'english'
  | 'science'
  | 'social';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionSource = 'curated' | 'ai_generated';

export type NavSection =
  | 'dashboard'
  | 'subjects'
  | 'practice'
  | 'mock-test'
  | 'ai-tutor'
  | 'ai-generator'
  | 'progress';

export type ExamTrack = 'aissee' | 'nda';

export interface Question {
  id: string;
  examTrack?: ExamTrack;
  subject: SubjectId;
  chapter: string;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  conceptTag?: string;
  source: QuestionSource;
  createdAt?: string;
}

export interface SyllabusChapter {
  id: string;
  title: string;
  ncertUnit: string;
  weightage: 'High' | 'Medium' | 'Standard';
  keyTopics: string[];
  studyTip: string;
}

export interface SubjectMeta {
  id: SubjectId;
  sectionCode: 'A' | 'B' | 'C' | 'D' | 'E';
  name: string;
  shortName: string;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  qualifyingMarks: number;
  description: string;
  chapters: SyllabusChapter[];
}

export interface PracticeAttempt {
  id: string;
  questionId: string;
  subject: SubjectId;
  chapter: string;
  difficulty: Difficulty;
  selectedIndex: number;
  isCorrect: boolean;
  source: QuestionSource;
  timestamp: string;
}

export interface MockSectionScore {
  subject: SubjectId;
  name: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  marksPerQuestion: number;
  scoredMarks: number;
  maxMarks: number;
  percentage: number;
  qualifiedSection: boolean;
}

export interface MockTestAnswerRecord {
  questionId: string;
  subject: SubjectId;
  chapter: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  selectedIndex: number | null;
  markedForReview: boolean;
  explanation: string;
  source: QuestionSource;
}

export interface MockTestResult {
  id: string;
  title: string;
  mode: 'full' | 'diagnostic' | 'sectional';
  date: string;
  durationSeconds: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  qualifiedOverall: boolean;
  sections: MockSectionScore[];
  answers: MockTestAnswerRecord[];
}

export interface UserProgress {
  cadetName: string;
  targetExamDate: string;
  dailyGoal: number;
  studyDates: string[];
  attempts: PracticeAttempt[];
  mockTests: MockTestResult[];
  aiQuestions: Question[];
}

export type TutorClassLevel = '6' | '7' | '8' | '9' | '10';

export type TutorSubject =
  | 'Mathematics'
  | 'Science'
  | 'Social Studies'
  | 'English'
  | 'Telugu'
  | 'General Knowledge';

export type TutorLanguage = 'English' | 'Telugu';

export type TutorMode = 'auto' | 'textbook' | 'general';

export type TutorLearningTool =
  | 'summary'
  | 'step-by-step'
  | 'mcq'
  | 'practice-test'
  | 'flashcards'
  | 'important-questions'
  | 'revision-notes'
  | 'examples';

export interface SourceCitation {
  materialId: string;
  title: string;
  materialType: 'textbook' | 'scert' | 'syllabus' | 'notes';
  classLevel: string;
  subject: string;
  location: string;
  snippet: string;
  score?: number;
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface StudyMaterialMeta {
  id: string;
  title: string;
  materialType: 'textbook' | 'scert' | 'syllabus' | 'notes';
  classLevel: string;
  subject: string;
  chapter: string;
  fileName: string;
  chunkCount: number;
  wordCount: number;
  active: boolean;
  isBuiltIn: boolean;
  uploadedAt: string;
}

export interface TutorContext {
  examTrack?: ExamTrack;
  subject?: string;
  chapter?: string;
  classLevel?: TutorClassLevel;
  language?: TutorLanguage;
  mode?: TutorMode;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  resolvedMode?: 'textbook' | 'general' | 'hybrid';
  citations?: SourceCitation[];
  webSources?: WebSource[];
}

export interface TutorChatSession {
  id: string;
  title: string;
  classLevel: TutorClassLevel;
  subject: TutorSubject;
  chapter: string;
  language: TutorLanguage;
  mode: TutorMode;
  messages: TutorMessage[];
  updatedAt: string;
}

