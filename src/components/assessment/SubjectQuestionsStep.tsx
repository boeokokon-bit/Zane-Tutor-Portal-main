import { useRef } from 'react';
import { Subject, SUBJECT_LABELS, Question } from '@/types/assessment';
import { getQuestionsForSubject } from '@/data/assessment/questionBank';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import QuestionNav from './QuestionNav';

interface SubjectQuestionsStepProps {
  subject: Subject;
  questions?: Question[];
  answers: Record<string, number>;
  onAnswerChange: (questionId: string, answer: number) => void;
}

const SubjectQuestionsStep = ({ subject, questions: questionsProp, answers, onAnswerChange }: SubjectQuestionsStepProps) => {
  const questions = questionsProp ?? getQuestionsForSubject(subject);
  const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleJumpTo = (index: number) => {
    questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex gap-6">
      {/* Main questions column */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            {SUBJECT_LABELS[subject]}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Answer these {questions.length} questions
          </h2>
          <p className="text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              ref={el => { questionRefs.current[index] = el; }}
              className={`p-5 transition-all ${
                answers[question.id] !== undefined 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                  ${answers[question.id] !== undefined 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index + 1}
                </span>
                <p className="font-medium leading-relaxed">{question.question}</p>
              </div>
              
              <RadioGroup
                value={answers[question.id]?.toString() || ''}
                onValueChange={value => onAnswerChange(question.id, parseInt(value))}
                className="ml-11 space-y-2"
              >
                {question.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    onClick={() => onAnswerChange(question.id, optIndex)}
                    className={`
                      flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all text-sm
                      ${answers[question.id] === optIndex 
                        ? 'border-primary bg-primary/10 font-medium' 
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }
                    `}
                  >
                    <RadioGroupItem value={optIndex.toString()} />
                    <span className="flex items-center gap-2">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                        ${answers[question.id] === optIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span>{option}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </Card>
          ))}
        </div>
      </div>

      {/* Side navigation - hidden on mobile */}
      <div className="hidden lg:block w-48 flex-shrink-0">
        <QuestionNav
          questions={questions}
          answers={answers}
          onJumpTo={handleJumpTo}
        />
      </div>
    </div>
  );
};

export default SubjectQuestionsStep;
