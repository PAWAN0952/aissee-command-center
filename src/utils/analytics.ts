import { SUBJECTS } from '../data/syllabus';
import { PracticeAttempt, SubjectId, UserProgress } from '../types/aissee';
import { computeStudyStreak, getTodayKey } from './storage';

export interface SubjectStats {
  subjectId: SubjectId;
  name: string;
  shortName: string;
  sectionCode: string;
  attempted: number;
  correct: number;
  accuracy: number;
  totalQuestionsInExam: number;
  totalMarksInExam: number;
}

export interface ChapterStats {
  subjectId: SubjectId;
  subjectName: string;
  chapter: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

export function computeOverallAnalytics(progress: UserProgress) {
  const attempts = progress.attempts;
  const totalAttempted = attempts.length;
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const todayKey = getTodayKey();
  const todayCount = attempts.filter((a) => a.timestamp.slice(0, 10) === todayKey).length;
  const streak = computeStudyStreak(progress.studyDates);

  const bySubject: Record<SubjectId, { attempted: number; correct: number }> = {
    mathematics: { attempted: 0, correct: 0 },
    intelligence: { attempted: 0, correct: 0 },
    english: { attempted: 0, correct: 0 },
    science: { attempted: 0, correct: 0 },
    social: { attempted: 0, correct: 0 },
  };

  const chapterMap = new Map<string, { subjectId: SubjectId; chapter: string; attempted: number; correct: number }>();

  for (const att of attempts) {
    if (bySubject[att.subject]) {
      bySubject[att.subject].attempted += 1;
      if (att.isCorrect) bySubject[att.subject].correct += 1;
    }
    const key = `${att.subject}::${att.chapter}`;
    const existing = chapterMap.get(key) ?? {
      subjectId: att.subject,
      chapter: att.chapter,
      attempted: 0,
      correct: 0,
    };
    existing.attempted += 1;
    if (att.isCorrect) existing.correct += 1;
    chapterMap.set(key, existing);
  }

  const subjectStats: SubjectStats[] = SUBJECTS.map((sub) => {
    const rec = bySubject[sub.id];
    const acc = rec.attempted > 0 ? Math.round((rec.correct / rec.attempted) * 100) : 0;
    return {
      subjectId: sub.id,
      name: sub.name,
      shortName: sub.shortName,
      sectionCode: sub.sectionCode,
      attempted: rec.attempted,
      correct: rec.correct,
      accuracy: acc,
      totalQuestionsInExam: sub.questionCount,
      totalMarksInExam: sub.totalMarks,
    };
  });

  const weakSubjects = [...subjectStats]
    .filter((s) => s.attempted > 0 && s.accuracy < 65)
    .sort((a, b) => a.accuracy - b.accuracy);

  const allChapterStats: ChapterStats[] = [];
  for (const sub of SUBJECTS) {
    for (const ch of sub.chapters) {
      const key = `${sub.id}::${ch.title}`;
      const found = chapterMap.get(key);
      const attempted = found?.attempted ?? 0;
      const correct = found?.correct ?? 0;
      const acc = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      allChapterStats.push({
        subjectId: sub.id,
        subjectName: sub.name,
        chapter: ch.title,
        attempted,
        correct,
        accuracy: acc,
      });
    }
  }

  // Include any custom/AI chapter not matching exact syllabus title
  for (const [, val] of chapterMap.entries()) {
    const exists = allChapterStats.some(
      (c) => c.subjectId === val.subjectId && c.chapter === val.chapter
    );
    if (!exists) {
      const subName = SUBJECTS.find((s) => s.id === val.subjectId)?.name ?? val.subjectId;
      allChapterStats.push({
        subjectId: val.subjectId,
        subjectName: subName,
        chapter: val.chapter,
        attempted: val.attempted,
        correct: val.correct,
        accuracy: val.attempted > 0 ? Math.round((val.correct / val.attempted) * 100) : 0,
      });
    }
  }

  const weakChapters = allChapterStats
    .filter((c) => c.attempted > 0 && c.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);

  return {
    totalAttempted,
    totalCorrect,
    accuracy,
    todayCount,
    streak,
    subjectStats,
    weakSubjects,
    allChapterStats,
    weakChapters,
  };
}

export function getAccuracyByDifficulty(attempts: PracticeAttempt[]) {
  const levels: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];
  return levels.map((level) => {
    const filtered = attempts.filter((a) => a.difficulty === level);
    const correct = filtered.filter((a) => a.isCorrect).length;
    return {
      difficulty: level,
      attempted: filtered.length,
      correct,
      accuracy: filtered.length > 0 ? Math.round((correct / filtered.length) * 100) : 0,
    };
  });
}
