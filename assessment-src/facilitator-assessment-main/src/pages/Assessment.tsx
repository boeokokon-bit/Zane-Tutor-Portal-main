import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2, Clock, Brain, BookOpen, Laptop, SkipForward } from 'lucide-react';
import { AssessmentState, TutorInfo, Subject, SUBJECT_LABELS, PsychResult, PsychCategory, PSYCH_CATEGORY_LABELS, DigitalToolsResult, getTutorRating } from '@/types/assessment';
import { getQuestionsForSubjects } from '@/data/questionBank';
import { psychQuestions } from '@/data/psychQuestions';
import { digitalToolsQuestions, DIGITAL_TOOL_CATEGORY_LABELS } from '@/data/digitalToolsQuestions';
import { calculateFullResult } from '@/lib/assessmentUtils';
import { saveToGoogleSheets } from '@/lib/googleSheets';
import { useAuth } from '@/contexts/AuthContext';
import { wpApi } from '@/lib/wordpressApi';
import Header from '@/components/layout/Header';
import TutorInfoStep from '@/components/assessment/TutorInfoStep';
import SubjectQuestionsStep from '@/components/assessment/SubjectQuestionsStep';
import PsychAssessmentStep from '@/components/assessment/PsychAssessmentStep';
import DigitalToolsStep from '@/components/assessment/DigitalToolsStep';
import { useAssessmentTimer } from '@/hooks/useAssessmentTimer';
import { toast } from 'sonner';

const STORAGE_KEY = 'zane_assessment_progress';

const calculatePsychResults = (psychAnswers: Record<string, number>): PsychResult[] => {
  const categories: PsychCategory[] = ['patience', 'communication', 'adaptability', 'empathy', 'professionalism', 'motivation'];
  
  return categories.map(category => {
    const catQuestions = psychQuestions.filter(q => q.category === category);
    let totalScore = 0;
    const maxScore = catQuestions.length * 5;

    catQuestions.forEach(q => {
      const answerIdx = psychAnswers[q.id];
      if (answerIdx !== undefined) {
        totalScore += q.weights[answerIdx] || 0;
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    let level: PsychResult['level'] = 'needs_development';
    if (percentage >= 80) level = 'strong';
    else if (percentage >= 60) level = 'adequate';

    return { category, score: totalScore, maxScore, percentage, level };
  });
};

const calculateDigitalToolsResults = (dtAnswers: Record<string, number>): { results: DigitalToolsResult[]; overall: { score: number; percentage: number } } => {
  const categories = Object.keys(DIGITAL_TOOL_CATEGORY_LABELS) as Array<keyof typeof DIGITAL_TOOL_CATEGORY_LABELS>;
  
  let totalCorrect = 0;
  let totalQuestions = 0;

  const results = categories.map(category => {
    const catQuestions = digitalToolsQuestions.filter(q => q.category === category);
    let correct = 0;
    catQuestions.forEach(q => {
      if (dtAnswers[q.id] === q.correctAnswer) correct++;
    });
    totalCorrect += correct;
    totalQuestions += catQuestions.length;
    return {
      category: DIGITAL_TOOL_CATEGORY_LABELS[category],
      score: correct,
      totalQuestions: catQuestions.length,
      percentage: catQuestions.length > 0 ? Math.round((correct / catQuestions.length) * 100) : 0,
    };
  });

  return {
    results,
    overall: {
      score: totalCorrect,
      percentage: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    },
  };
};

const Assessment = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [state, setState] = useState<AssessmentState>(() => {
    // Try to restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AssessmentState;
        return parsed;
      } catch { /* ignore */ }
    }

    return {
      currentStep: 0,
      tutorInfo: {
        selectedSubjects: [],
        ...(user ? {
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email || '',
        } : {}),
      },
      answers: {},
      psychAnswers: {},
      digitalToolsAnswers: {},
      currentSubjectIndex: 0,
    };
  });

  // Persist state to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const allSubjects: Subject[] = (state.tutorInfo.selectedSubjects || []) as Subject[];

  const questionsBySubject = useMemo(
    () => getQuestionsForSubjects(allSubjects, 20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSubjects.join('|')]
  );

  // Steps: 0 = level/subjects, 1..N = subjects, N+1 = digital tools, N+2 = psych
  const totalSteps = 1 + allSubjects.length + 2;

  const { formattedTime, getTimingData } = useAssessmentTimer(state.currentStep, allSubjects);

  const isDigitalToolsStep = state.currentStep === allSubjects.length + 1;
  const isPsychStep = state.currentStep === totalSteps - 1;
  const isSubjectStep = state.currentStep > 0 && state.currentStep <= allSubjects.length;

  const getStepTitle = () => {
    if (state.currentStep === 0) return 'Level & Subjects';
    if (isDigitalToolsStep) return 'Digital Tools Proficiency';
    if (isPsychStep) return 'Personality & Cognitive Assessment';
    const subject = allSubjects[state.currentStep - 1];
    return subject ? SUBJECT_LABELS[subject] : '';
  };

  const progressPercentage = totalSteps > 0 ? ((state.currentStep + 1) / totalSteps) * 100 : 0;

  const stepLabels = [
    'Setup',
    ...allSubjects.map(s => SUBJECT_LABELS[s].split(' ')[0]),
    'Digital',
    'Psych',
  ];

  const handleStepClick = (stepIndex: number) => {
    // Can only jump to steps if setup (step 0) is completed
    if (stepIndex === 0 || canProceedFromSetup()) {
      setState(prev => ({ ...prev, currentStep: stepIndex }));
      window.scrollTo(0, 0);
    }
  };

  const canProceedFromSetup = () => {
    const info = state.tutorInfo;
    return info.teachingLevel && info.selectedSubjects && info.selectedSubjects.length >= 1;
  };

  const handleNext = async () => {
    if (state.currentStep < totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      window.scrollTo(0, 0);
    } else {
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const timingData = getTimingData();

        // Fill tutor info from auth user if available
        const fullTutorInfo: TutorInfo = {
          firstName: user?.first_name || state.tutorInfo.firstName || 'Guest',
          lastName: user?.last_name || state.tutorInfo.lastName || '',
          email: user?.email || state.tutorInfo.email || '',
          whatsappNumber: state.tutorInfo.whatsappNumber || '',
          teachingLevel: state.tutorInfo.teachingLevel!,
          selectedSubjects: allSubjects,
          yearsExperience: state.tutorInfo.yearsExperience || '0_1',
          educationLevel: state.tutorInfo.educationLevel || 'bachelors',
        };

        const allSelectedQuestions = allSubjects.flatMap(s => questionsBySubject[s] || []);
        const result = calculateFullResult(fullTutorInfo, state.answers, allSelectedQuestions);

        // Calculate psych results
        const psychResults = calculatePsychResults(state.psychAnswers);
        const psychOverallScore = Math.round(
          psychResults.reduce((s, r) => s + r.percentage, 0) / psychResults.length
        );

        // Calculate digital tools results
        const dtResults = calculateDigitalToolsResults(state.digitalToolsAnswers);

        // Compute weighted composite score out of 100
        // Subject Knowledge: 50 pts, Digital Tools: 20 pts, Psych: 30 pts
        const subjectPoints = Math.round((result.overallScore / 100) * 50);
        
        // Digital: self-ratings contribute 8 pts, knowledge questions 12 pts
        const selfRatingKeys = Object.keys(state.digitalToolsAnswers).filter(k => k.startsWith('rate_'));
        const selfRatingTotal = selfRatingKeys.reduce((sum, k) => sum + (state.digitalToolsAnswers[k] || 0), 0);
        const selfRatingMax = selfRatingKeys.length * 4; // max rating is 4 (0-indexed from 0-4)
        const selfRatingPoints = selfRatingMax > 0 ? Math.round((selfRatingTotal / selfRatingMax) * 8) : 0;
        const digitalKnowledgePoints = Math.round((dtResults.overall.percentage / 100) * 12);
        const digitalPoints = selfRatingPoints + digitalKnowledgePoints;
        
        const psychPoints = Math.round((psychOverallScore / 100) * 30);
        
        const compositeScore = Math.min(100, subjectPoints + digitalPoints + psychPoints);
        const tutorRating = getTutorRating(compositeScore);

        const resultWithExtras = {
          ...result,
          timing: timingData,
          compositeScore,
          tutorRating,
          finalReadinessScore: compositeScore,
          psychResults,
          psychOverall: {
            score: psychOverallScore,
            level: psychOverallScore >= 80 ? 'Excellent' : psychOverallScore >= 60 ? 'Good' : 'Needs Development',
          },
          digitalToolsResults: dtResults.results,
          digitalToolsOverall: dtResults.overall,
          digitalToolsSelfRatings: Object.fromEntries(selfRatingKeys.map(k => [k, state.digitalToolsAnswers[k]])),
          sectionScores: {
            subjectPoints,
            digitalPoints,
            psychPoints,
          },
        };

        const savePromises: Promise<unknown>[] = [
          saveToGoogleSheets(resultWithExtras).catch(err => console.error('Failed to save to sheets:', err)),
        ];
        if (isAuthenticated) {
          savePromises.push(
            wpApi.saveAssessment(resultWithExtras as unknown as Record<string, unknown>)
              .catch(err => console.error('Failed to save to WP:', err))
          );
        }
        await Promise.all(savePromises);
        
        // Clear localStorage after successful submission
        localStorage.removeItem(STORAGE_KEY);
        
        toast.success('Assessment completed! Generating your results...');
        navigate('/results', { state: { result: resultWithExtras } });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
      window.scrollTo(0, 0);
    }
  };

  const handleSkip = () => {
    if (state.currentStep < totalSteps - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      window.scrollTo(0, 0);
    }
  };

  const handleTutorInfoChange = (info: Partial<TutorInfo>) => {
    setState(prev => ({
      ...prev,
      tutorInfo: { ...prev.tutorInfo, ...info },
    }));
  };

  const handleAnswerChange = (questionId: string, answer: number) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));
  };

  const handlePsychAnswerChange = (questionId: string, answer: number) => {
    setState(prev => ({
      ...prev,
      psychAnswers: { ...prev.psychAnswers, [questionId]: answer },
    }));
  };

  const handleDigitalToolsAnswerChange = (questionId: string, answer: number) => {
    setState(prev => ({
      ...prev,
      digitalToolsAnswers: { ...prev.digitalToolsAnswers, [questionId]: answer },
    }));
  };

  const canProceed = () => {
    if (state.currentStep === 0) {
      return canProceedFromSetup();
    }
    // For subject steps, digital tools, and psych — always allow proceeding (can skip)
    return true;
  };

  const getAnsweredInfo = () => {
    if (isSubjectStep) {
      const currentSubject = allSubjects[state.currentStep - 1];
      const questions = questionsBySubject[currentSubject] || [];
      const answered = questions.filter(q => state.answers[q.id] !== undefined).length;
      return `${answered}/${questions.length} questions answered`;
    }
    if (isDigitalToolsStep) {
      const answered = digitalToolsQuestions.filter(q => state.digitalToolsAnswers[q.id] !== undefined).length;
      return `${answered}/${digitalToolsQuestions.length} questions answered`;
    }
    if (isPsychStep) {
      const answered = psychQuestions.filter(q => state.psychAnswers[q.id] !== undefined).length;
      return `${answered}/${psychQuestions.length} scenarios answered`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Sticky progress bar */}
      <div className="sticky top-[57px] z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {state.currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1.5 text-sm"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono font-medium text-sm">{formattedTime}</span>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {state.currentStep + 1}/{totalSteps}
              </span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
          
          {/* Step indicator pills - clickable for navigation */}
          <div className="flex items-center justify-center gap-1 mt-2 overflow-x-auto">
            {stepLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                disabled={i !== 0 && !canProceedFromSetup()}
                className={`
                  flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer
                  ${i === state.currentStep
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : i < state.currentStep
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-fade-in">
          {state.currentStep === 0 && (
            <TutorInfoStep
              info={state.tutorInfo}
              onChange={handleTutorInfoChange}
            />
          )}

          {isSubjectStep && (
            <SubjectQuestionsStep
              subject={allSubjects[state.currentStep - 1]}
              questions={questionsBySubject[allSubjects[state.currentStep - 1]]}
              answers={state.answers}
              onAnswerChange={handleAnswerChange}
            />
          )}

          {isDigitalToolsStep && (
            <DigitalToolsStep
              answers={state.digitalToolsAnswers}
              onAnswerChange={handleDigitalToolsAnswerChange}
            />
          )}

          {isPsychStep && (
            <PsychAssessmentStep
              answers={state.psychAnswers}
              onAnswerChange={handlePsychAnswerChange}
            />
          )}
        </div>

        {/* Bottom navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {getAnsweredInfo()}
          </div>
          <div className="flex items-center gap-3">
            {/* Skip button for subject/digital/psych steps */}
            {state.currentStep > 0 && state.currentStep < totalSteps - 1 && (
              <Button
                variant="outline"
                onClick={handleSkip}
                className="gap-1.5"
                disabled={isSubmitting}
              >
                Skip
                <SkipForward className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="gradient-primary text-primary-foreground px-8 py-5 text-base rounded-xl gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {state.currentStep >= totalSteps - 1 ? 'Submit Assessment' : 'Continue'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
