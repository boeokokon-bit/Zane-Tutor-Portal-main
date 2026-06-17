import { PsychQuestion, PSYCH_CATEGORY_LABELS } from '@/types/assessment';
import { psychQuestions } from '@/data/assessment/psychQuestions';
import { Card } from '@/components/ui/card';
import { Brain } from 'lucide-react';

interface PsychAssessmentStepProps {
  answers: Record<string, number>;
  onAnswerChange: (questionId: string, answer: number) => void;
}

const PsychAssessmentStep = ({ answers, onAnswerChange }: PsychAssessmentStepProps) => {
  const answeredCount = psychQuestions.filter(q => answers[q.id] !== undefined).length;

  // Group by category
  const grouped = psychQuestions.reduce<Record<string, PsychQuestion[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
          <Brain className="w-4 h-4" />
          Cognitive & Personality Assessment
        </div>
        <h2 className="text-2xl font-bold mb-2">
          How would you handle these situations?
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          There are no "wrong" answers — we want to understand your teaching style, patience, and approach to working with students.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {answeredCount}/{psychQuestions.length} answered
        </p>
      </div>

      {/* Questions by category */}
      {Object.entries(grouped).map(([category, questions]) => (
        <div key={category} className="space-y-4">
          <h3 className="font-semibold text-primary flex items-center gap-2 px-1">
            {PSYCH_CATEGORY_LABELS[category as keyof typeof PSYCH_CATEGORY_LABELS]}
          </h3>
          {questions.map((question, qIdx) => (
            <Card
              key={question.id}
              className={`p-5 transition-all ${
                answers[question.id] !== undefined
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border'
              }`}
            >
              <p className="font-medium mb-4 leading-relaxed">{question.question}</p>
              <div className="space-y-2">
                {question.options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => onAnswerChange(question.id, optIdx)}
                    className={`
                      w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm
                      ${answers[question.id] === optIdx
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                        ${answers[question.id] === optIdx
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PsychAssessmentStep;
