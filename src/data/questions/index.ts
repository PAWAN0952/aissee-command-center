import { Question, SubjectId } from '../../types/aissee';
import { MATH_QUESTIONS } from './math';
import { INTELLIGENCE_QUESTIONS } from './intelligence';
import { ENGLISH_QUESTIONS } from './english';
import { SCIENCE_QUESTIONS } from './science';
import { SOCIAL_QUESTIONS } from './social';

export const CURATED_QUESTIONS: Question[] = [
  ...MATH_QUESTIONS,
  ...INTELLIGENCE_QUESTIONS,
  ...ENGLISH_QUESTIONS,
  ...SCIENCE_QUESTIONS,
  ...SOCIAL_QUESTIONS,
];

export const QUESTIONS_BY_SUBJECT: Record<SubjectId, Question[]> = {
  mathematics: MATH_QUESTIONS,
  intelligence: INTELLIGENCE_QUESTIONS,
  english: ENGLISH_QUESTIONS,
  science: SCIENCE_QUESTIONS,
  social: SOCIAL_QUESTIONS,
};
