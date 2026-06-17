export type TeachingLevel = 
  | 'lower_primary'
  | 'upper_primary'
  | 'junior_secondary'
  | 'senior_secondary'
  | 'undergraduate';

export const TEACHING_LEVEL_LABELS: Record<TeachingLevel, string> = {
  lower_primary: 'Lower Primary (Grades 1–3)',
  upper_primary: 'Upper Primary (Grades 4–6)',
  junior_secondary: 'Junior Secondary (JSS 1–3)',
  senior_secondary: 'Senior Secondary (SSS 1–3)',
  undergraduate: 'Undergrad / Advanced',
};

export type Subject =
  | 'english'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'economics'
  | 'government'
  | 'geography'
  | 'basic_science'
  | 'basic_math'
  | 'phonics'
  | 'social_studies'
  | 'civic_education'
  | 'computer_science'
  | 'further_math'
  | 'literature'
  | 'accounting'
  | 'a_level_math'
  | 'a_level_physics'
  | 'a_level_chemistry'
  | 'ielts'
  | 'sat';

export const SUBJECT_LABELS: Record<Subject, string> = {
  english: 'English Language',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
  government: 'Government',
  geography: 'Geography',
  basic_science: 'Basic Science',
  basic_math: 'Basic Mathematics',
  phonics: 'Phonics & Reading',
  social_studies: 'Social Studies',
  civic_education: 'Civic Education',
  computer_science: 'Computer Science',
  further_math: 'Further Mathematics',
  literature: 'Literature in English',
  accounting: 'Financial Accounting',
  a_level_math: 'A-Level Mathematics',
  a_level_physics: 'A-Level Physics',
  a_level_chemistry: 'A-Level Chemistry',
  ielts: 'IELTS Preparation',
  sat: 'SAT Preparation',
};

export const LEVEL_SUBJECTS: Record<TeachingLevel, Subject[]> = {
  lower_primary: ['phonics', 'basic_math', 'basic_science', 'english'],
  upper_primary: ['english', 'mathematics', 'basic_science', 'social_studies'],
  junior_secondary: ['english', 'mathematics', 'basic_science', 'social_studies', 'civic_education', 'computer_science'],
  senior_secondary: ['english', 'mathematics', 'physics', 'chemistry', 'biology', 'economics', 'government', 'geography', 'further_math', 'literature', 'accounting', 'computer_science'],
  undergraduate: ['a_level_math', 'a_level_physics', 'a_level_chemistry', 'ielts', 'sat', 'english', 'mathematics', 'physics', 'chemistry', 'biology', 'economics'],
};

export interface Question {
  id: string;
  subject: Subject;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
}

export interface PsychQuestion {
  id: string;
  category: PsychCategory;
  question: string;
  options: string[];
  weights: number[]; // score per option
}

export type PsychCategory = 
  | 'patience'
  | 'communication'
  | 'adaptability'
  | 'empathy'
  | 'professionalism'
  | 'motivation';

export const PSYCH_CATEGORY_LABELS: Record<PsychCategory, string> = {
  patience: 'Patience & Composure',
  communication: 'Communication Style',
  adaptability: 'Adaptability',
  empathy: 'Empathy & Understanding',
  professionalism: 'Professionalism',
  motivation: 'Motivation & Passion',
};

export interface PsychResult {
  category: PsychCategory;
  score: number;
  maxScore: number;
  percentage: number;
  level: 'strong' | 'adequate' | 'needs_development';
}

export interface TutorInfo {
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  teachingLevel: TeachingLevel;
  selectedSubjects: Subject[];
  yearsExperience: '0_1' | '1_3' | '3_5' | '5_plus';
  educationLevel: 'nce' | 'ond_hnd' | 'bachelors' | 'masters' | 'phd';
}

// Keep StudentInfo as alias for backward compat in shared utils
export type StudentInfo = TutorInfo;

export const getFullName = (firstName?: string, lastName?: string): string => {
  if (!firstName) return '';
  return lastName ? `${firstName} ${lastName}` : firstName;
};

export interface SubjectResult {
  subject: Subject;
  score: number;
  totalQuestions: number;
  percentage: number;
  status: 'excellent' | 'good' | 'needs_work' | 'urgent';
  passed: boolean;
  weakTopics: string[];
}

export interface TimingData {
  totalSeconds: number;
  stepTimes: Record<string, number>;
  startTime: number;
}

export interface DigitalToolsResult {
  category: string;
  score: number;
  totalQuestions: number;
  percentage: number;
}

export type TutorRating = 'expert' | 'proficient' | 'developing' | 'foundational';

export const TUTOR_RATING_LABELS: Record<TutorRating, string> = {
  expert: 'Expert Tutor',
  proficient: 'Proficient Tutor',
  developing: 'Developing Tutor',
  foundational: 'Foundational',
};

export const TUTOR_RATING_DESCRIPTIONS: Record<TutorRating, string> = {
  expert: 'Outstanding across all areas. Ready for immediate placement.',
  proficient: 'Strong performance with minor development areas.',
  developing: 'Shows potential but needs targeted training before placement.',
  foundational: 'Requires significant preparation across multiple areas.',
};

export const getTutorRating = (score: number): TutorRating => {
  if (score >= 85) return 'expert';
  if (score >= 70) return 'proficient';
  if (score >= 55) return 'developing';
  return 'foundational';
};

export const getTutorRatingIcon = (rating: TutorRating): string => {
  switch (rating) {
    case 'expert': return 'Award';
    case 'proficient': return 'TrendingUp';
    case 'developing': return 'AlertTriangle';
    case 'foundational': return 'ArrowDown';
  }
};

export interface AssessmentResult {
  studentInfo: TutorInfo;
  subjectResults: SubjectResult[];
  overallScore: number;
  finalReadinessScore: number;
  compositeScore: number; // Weighted score out of 100
  tutorRating: TutorRating;
  readinessLevel: 'proficient' | 'competent' | 'developing' | 'not_ready';
  overallPassed: boolean;
  answers: Record<string, number>;
  psychResults?: PsychResult[];
  psychOverall?: { score: number; level: string };
  digitalToolsResults?: DigitalToolsResult[];
  digitalToolsOverall?: { score: number; percentage: number };
  digitalToolsSelfRatings?: Record<string, number>;
  sectionScores?: {
    subjectPoints: number;
    digitalPoints: number;
    psychPoints: number;
  };
  timing?: TimingData;
}

export interface StudyHabits {
  hoursPerWeek?: string;
  hasTimetable?: string;
  biggestChallenge?: string;
  previousJamb?: string;
  prioritySubject?: Subject | null;
}

export interface MockExamConfig {
  questionCount: 25 | 40;
  timed: boolean;
  timeLimitSeconds: number;
}

export interface AssessmentState {
  currentStep: number;
  tutorInfo: Partial<TutorInfo>;
  answers: Record<string, number>;
  psychAnswers: Record<string, number>;
  digitalToolsAnswers: Record<string, number>;
  currentSubjectIndex: number;
}

export const PASS_THRESHOLD = 70;
