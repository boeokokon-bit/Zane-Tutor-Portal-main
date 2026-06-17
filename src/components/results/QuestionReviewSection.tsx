import { Card } from '@/components/ui/card';
import { Subject, SUBJECT_LABELS, Question } from '@/types/assessment';
import { questionBank } from '@/data/assessment/questionBank';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface QuestionReviewSectionProps {
  selectedSubjects: Subject[];
  answers: Record<string, number>;
}

// Get the questions that were answered for a specific subject
const getAnsweredQuestionsForSubject = (
  subject: Subject,
  answers: Record<string, number>
): Question[] => {
  return questionBank.filter(
    (q) => q.subject === subject && answers[q.id] !== undefined
  );
};

const QuestionReviewSection = ({ selectedSubjects, answers }: QuestionReviewSectionProps) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<Subject, boolean>>({} as Record<Subject, boolean>);

  const toggleSubject = (subject: Subject) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  // Calculate totals
  let totalCorrect = 0;
  let totalQuestions = 0;

  selectedSubjects.forEach((subject) => {
    const questions = getAnsweredQuestionsForSubject(subject, answers);
    questions.forEach((q) => {
      totalQuestions++;
      if (answers[q.id] === q.correctAnswer) {
        totalCorrect++;
      }
    });
  });

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          Question Review
        </h2>
        <p className="text-center text-muted-foreground mb-2">
          See how you answered each question
        </p>
        <p className="text-center text-sm text-muted-foreground mb-8">
          <span className="text-success font-medium">{totalCorrect} correct</span>
          {' • '}
          <span className="text-destructive font-medium">{totalQuestions - totalCorrect} incorrect</span>
          {' • '}
          <span className="font-medium">{totalQuestions} total</span>
        </p>

        <div className="space-y-4">
          {selectedSubjects.map((subject) => {
            const questions = getAnsweredQuestionsForSubject(subject, answers);
            const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
            const isExpanded = expandedSubjects[subject] ?? false;

            return (
              <Card key={subject} className="overflow-hidden">
                {/* Subject Header - Clickable */}
                <button
                  onClick={() => toggleSubject(subject)}
                  className="w-full p-4 flex items-center justify-between bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{SUBJECT_LABELS[subject]}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({correctCount}/{questions.length} correct)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Questions List - Collapsible */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {questions.map((question, index) => {
                      const userAnswer = answers[question.id];
                      const isCorrect = userAnswer === question.correctAnswer;

                      return (
                        <div
                          key={question.id}
                          className={`p-4 ${isCorrect ? 'bg-success/5' : 'bg-destructive/5'}`}
                        >
                          {/* Question */}
                          <div className="flex items-start gap-3 mb-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <p className="font-medium text-foreground leading-relaxed">
                              {question.question}
                            </p>
                          </div>

                          {/* Answers */}
                          <div className="ml-10 space-y-2">
                            {/* User's Answer */}
                            <div className={`flex items-center gap-2 p-2 rounded-lg ${
                              isCorrect 
                                ? 'bg-success/10 border border-success/30' 
                                : 'bg-destructive/10 border border-destructive/30'
                            }`}>
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                              )}
                              <span className="text-sm">
                                <span className="font-medium">Your answer:</span>{' '}
                                <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                                  {String.fromCharCode(65 + userAnswer)}. {question.options[userAnswer]}
                                </span>
                              </span>
                            </div>

                            {/* Correct Answer (only show if wrong) */}
                            {!isCorrect && (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/30">
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                <span className="text-sm">
                                  <span className="font-medium">Correct answer:</span>{' '}
                                  <span className="text-success">
                                    {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                                  </span>
                                </span>
                              </div>
                            )}

                            {/* Topic Tag */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                                {question.topic}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Expand/Collapse All */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allExpanded = selectedSubjects.every((s) => expandedSubjects[s]);
              const newState: Record<Subject, boolean> = {} as Record<Subject, boolean>;
              selectedSubjects.forEach((s) => {
                newState[s] = !allExpanded;
              });
              setExpandedSubjects(newState);
            }}
          >
            {selectedSubjects.every((s) => expandedSubjects[s]) ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default QuestionReviewSection;
