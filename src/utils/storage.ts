import { MockTestResult, PracticeAttempt, Question, UserProgress } from '../types/aissee';

const STORAGE_KEY = 'aissee_command_center_v1';

export function getDefaultExamDate(): string {
  const now = new Date();
  // AISSEE is traditionally conducted by NTA in January
  let year = now.getFullYear();
  if (now.getMonth() > 0 || (now.getMonth() === 0 && now.getDate() > 25)) {
    year += 1;
  }
  // Second Sunday-ish of January at 10:00 AM local time
  const jan10 = new Date(year, 0, 10, 10, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${jan10.getFullYear()}-${pad(jan10.getMonth() + 1)}-${pad(jan10.getDate())}T10:00`;
}

export function getTodayKey(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDefaultProgress(): UserProgress {
  return {
    cadetName: 'Cadet Aspirant',
    targetExamDate: getDefaultExamDate(),
    dailyGoal: 20,
    studyDates: [],
    attempts: [],
    mockTests: [],
    aiQuestions: [],
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      cadetName: typeof parsed.cadetName === 'string' && parsed.cadetName.trim() ? parsed.cadetName : 'Cadet Aspirant',
      targetExamDate:
        typeof parsed.targetExamDate === 'string' && parsed.targetExamDate
          ? parsed.targetExamDate
          : getDefaultExamDate(),
      dailyGoal: typeof parsed.dailyGoal === 'number' && parsed.dailyGoal > 0 ? parsed.dailyGoal : 20,
      studyDates: Array.isArray(parsed.studyDates) ? parsed.studyDates : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      mockTests: Array.isArray(parsed.mockTests) ? parsed.mockTests : [],
      aiQuestions: Array.isArray(parsed.aiQuestions) ? parsed.aiQuestions : [],
    };
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Could not persist progress to localStorage:', err);
  }
}

export function computeStudyStreak(studyDates: string[]): number {
  if (studyDates.length === 0) return 0;
  const uniqueSet = new Set(studyDates);
  const today = new Date();
  const todayKey = getTodayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getTodayKey(yesterday);

  let cursor = new Date(today);
  if (uniqueSet.has(todayKey)) {
    cursor = today;
  } else if (uniqueSet.has(yesterdayKey)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (uniqueSet.has(getTodayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function addPracticeAttempt(
  prev: UserProgress,
  attempt: Omit<PracticeAttempt, 'id' | 'timestamp'>
): UserProgress {
  const todayKey = getTodayKey();
  const nextStudyDates = prev.studyDates.includes(todayKey)
    ? prev.studyDates
    : [...prev.studyDates, todayKey];

  const newAttempt: PracticeAttempt = {
    ...attempt,
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...prev,
    studyDates: nextStudyDates,
    attempts: [newAttempt, ...prev.attempts].slice(0, 2000),
  };
}

export function addMockTestResult(prev: UserProgress, result: MockTestResult): UserProgress {
  const todayKey = getTodayKey();
  const nextStudyDates = prev.studyDates.includes(todayKey)
    ? prev.studyDates
    : [...prev.studyDates, todayKey];

  // Also record answered questions into attempts for chapter/subject analytics
  const newAttempts: PracticeAttempt[] = result.answers
    .filter((ans) => ans.selectedIndex !== null)
    .map((ans, idx) => ({
      id: `mock-att-${result.id}-${idx}`,
      questionId: ans.questionId,
      subject: ans.subject,
      chapter: ans.chapter,
      difficulty: 'Medium',
      selectedIndex: ans.selectedIndex as number,
      isCorrect: ans.selectedIndex === ans.correctIndex,
      source: ans.source,
      timestamp: result.date,
    }));

  return {
    ...prev,
    studyDates: nextStudyDates,
    mockTests: [result, ...prev.mockTests].slice(0, 100),
    attempts: [...newAttempts, ...prev.attempts].slice(0, 2000),
  };
}

export function saveAiQuestionsToBank(prev: UserProgress, questions: Question[]): UserProgress {
  const existingIds = new Set(prev.aiQuestions.map((q) => q.id));
  const fresh = questions.filter((q) => !existingIds.has(q.id));
  return {
    ...prev,
    aiQuestions: [...fresh, ...prev.aiQuestions].slice(0, 250),
  };
}
