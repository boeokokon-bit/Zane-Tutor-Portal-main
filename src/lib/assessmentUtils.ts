import { 
  AssessmentResult, 
  TutorInfo, 
  Subject, 
  SubjectResult,
  SUBJECT_LABELS,
  PASS_THRESHOLD,
  Question,
  getTutorRating,
} from '@/types/assessment';
import { questionBank } from '@/data/assessment/questionBank';

export const calculateSubjectResult = (
  subject: Subject,
  answers: Record<string, number>,
  actualQuestions?: Question[]
): SubjectResult => {
  const subjectQuestions = actualQuestions 
    ? actualQuestions.filter(q => q.subject === subject)
    : questionBank.filter(q => q.subject === subject);
  
  let correct = 0;
  const wrongTopics: string[] = [];

  subjectQuestions.forEach(question => {
    if (answers[question.id] === question.correctAnswer) {
      correct++;
    } else if (answers[question.id] !== undefined) {
      if (!wrongTopics.includes(question.topic)) {
        wrongTopics.push(question.topic);
      }
    }
  });

  const totalToGrade = subjectQuestions.length;
  const percentage = totalToGrade > 0 ? Math.round((correct / totalToGrade) * 100) : 0;
  
  let status: SubjectResult['status'];
  if (percentage >= 80) status = 'excellent';
  else if (percentage >= 70) status = 'good';
  else if (percentage >= 50) status = 'needs_work';
  else status = 'urgent';

  return {
    subject,
    score: correct,
    totalQuestions: subjectQuestions.length,
    percentage,
    status,
    passed: percentage >= PASS_THRESHOLD,
    weakTopics: wrongTopics.slice(0, 3),
  };
};

export const getReadinessLevel = (score: number): AssessmentResult['readinessLevel'] => {
  if (score >= 80) return 'proficient';
  if (score >= 70) return 'competent';
  if (score >= 50) return 'developing';
  return 'not_ready';
};

export const calculateFullResult = (
  tutorInfo: TutorInfo,
  answers: Record<string, number>,
  actualQuestions?: Question[]
): AssessmentResult => {
  const subjectResults = tutorInfo.selectedSubjects.map(subject =>
    calculateSubjectResult(subject, answers, actualQuestions)
  );

  const overallScore = Math.round(
    subjectResults.reduce((sum, r) => sum + r.percentage, 0) / subjectResults.length
  );

  const overallPassed = subjectResults.every(r => r.passed);

  return {
    studentInfo: tutorInfo,
    subjectResults,
    overallScore,
    finalReadinessScore: overallScore,
    compositeScore: 0, // Will be computed with all sections in Assessment.tsx
    tutorRating: getTutorRating(0),
    readinessLevel: getReadinessLevel(overallScore),
    overallPassed,
    answers,
  };
};

export const getReadinessEmoji = (level: AssessmentResult['readinessLevel']): string => {
  switch (level) {
    case 'proficient': return '✅';
    case 'competent': return '👍';
    case 'developing': return '⚠️';
    case 'not_ready': return '🔴';
  }
};

export const getReadinessLabel = (level: AssessmentResult['readinessLevel']): string => {
  switch (level) {
    case 'proficient': return 'Highly Proficient';
    case 'competent': return 'Competent';
    case 'developing': return 'Developing';
    case 'not_ready': return 'Not Yet Ready';
  }
};

export const getReadinessDescription = (level: AssessmentResult['readinessLevel']): string => {
  switch (level) {
    case 'proficient': 
      return 'Excellent subject mastery. You demonstrate strong readiness to teach these subjects.';
    case 'competent': 
      return 'Good subject knowledge with minor gaps. A brief review of weak areas is recommended.';
    case 'developing': 
      return 'Some knowledge gaps identified. Additional study is needed before tutoring assignment.';
    case 'not_ready': 
      return 'Significant knowledge gaps found. Intensive review required before teaching these subjects.';
  }
};

export const getStatusColor = (status: SubjectResult['status']): string => {
  switch (status) {
    case 'excellent': return 'text-success';
    case 'good': return 'text-secondary';
    case 'needs_work': return 'text-warning';
    case 'urgent': return 'text-danger';
  }
};

export const getStatusBgColor = (status: SubjectResult['status']): string => {
  switch (status) {
    case 'excellent': return 'bg-success/10 border-success/20';
    case 'good': return 'bg-secondary/10 border-secondary/20';
    case 'needs_work': return 'bg-warning/10 border-warning/20';
    case 'urgent': return 'bg-danger/10 border-danger/20';
  }
};

export const prepareResultForStorage = (result: AssessmentResult) => {
  const tutorName = result.studentInfo.firstName + (result.studentInfo.lastName ? ` ${result.studentInfo.lastName}` : '');
  
  return {
    tutor_name: tutorName,
    email: result.studentInfo.email,
    whatsapp: result.studentInfo.whatsappNumber,
    teaching_level: result.studentInfo.teachingLevel,
    subjects: result.studentInfo.selectedSubjects,
    overall_score: result.overallScore,
    final_score: result.finalReadinessScore,
    readiness_level: result.readinessLevel,
    overall_passed: result.overallPassed,
    subject_results: result.subjectResults,
    psych_results: result.psychResults,
    psych_overall: result.psychOverall,
    answers: result.answers,
    created_at: new Date().toISOString(),
  };
};
