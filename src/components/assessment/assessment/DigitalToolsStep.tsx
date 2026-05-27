import { useRef, useState } from 'react';
import { digitalToolsQuestions, DIGITAL_TOOL_CATEGORY_LABELS, DigitalToolQuestion, toolSelfRatings, RATING_LABELS } from '@/data/assessment/digitalToolsQuestions';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Laptop, Star } from 'lucide-react';
import QuestionNav from './QuestionNav';

interface DigitalToolsStepProps {
  answers: Record<string, number>;
  onAnswerChange: (questionId: string, answer: number) => void;
}

const DigitalToolsStep = ({ answers, onAnswerChange }: DigitalToolsStepProps) => {
  const answeredCount = digitalToolsQuestions.filter(q => answers[q.id] !== undefined).length;
  const ratedCount = toolSelfRatings.filter(r => answers[r.id] !== undefined).length;
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [showQuestions, setShowQuestions] = useState(ratedCount === toolSelfRatings.length);

  const handleJumpTo = (index: number) => {
    questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Group by category
  const grouped = digitalToolsQuestions.reduce<Record<string, DigitalToolQuestion[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  // Create flat list for nav
  const allQuestions = digitalToolsQuestions.map(q => ({ id: q.id, question: q.question, options: q.options, subject: 'digital_tools' as any, correctAnswer: q.correctAnswer, topic: q.topic }));

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            <Laptop className="w-4 h-4" />
            Digital Teaching Tools
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Digital Tools & Technology Proficiency
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            First, rate your experience with these tools. Then answer knowledge questions.
          </p>
        </div>

        {/* Self-Rating Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-primary">Self-Assessment: Rate Your Experience</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-auto">
              {ratedCount}/{toolSelfRatings.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground px-1">
            How familiar are you with each tool? Rate from 1 (Never used) to 5 (Expert).
          </p>

          <div className="grid gap-3">
            {toolSelfRatings.map((item) => {
              const currentRating = answers[item.id];
              return (
                <Card key={item.id} className={`p-4 transition-all ${currentRating !== undefined ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium text-sm">{item.tool}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      {RATING_LABELS.map((label, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onAnswerChange(item.id, idx)}
                          className={`
                            flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all text-center leading-tight
                            ${currentRating === idx
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }
                          `}
                        >
                          <div className="font-bold text-sm mb-0.5">{idx + 1}</div>
                          <div className="hidden sm:block">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {ratedCount < toolSelfRatings.length && !showQuestions && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Rate all tools to continue, or</p>
              <button
                type="button"
                onClick={() => setShowQuestions(true)}
                className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                skip to questions →
              </button>
            </div>
          )}
        </div>

        {/* Knowledge Questions */}
        {(showQuestions || ratedCount === toolSelfRatings.length) && (
          <>
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-lg mb-1">Knowledge Questions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {answeredCount}/{digitalToolsQuestions.length} answered
              </p>
            </div>

            {Object.entries(grouped).map(([category, questions]) => (
              <div key={category} className="space-y-4">
                <h3 className="font-semibold text-primary flex items-center gap-2 px-1">
                  {DIGITAL_TOOL_CATEGORY_LABELS[category as keyof typeof DIGITAL_TOOL_CATEGORY_LABELS]}
                </h3>
                {questions.map((question) => {
                  const globalIdx = digitalToolsQuestions.indexOf(question);
                  return (
                    <Card
                      key={question.id}
                      ref={el => { questionRefs.current[globalIdx] = el; }}
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
                          {globalIdx + 1}
                        </span>
                        <p className="font-medium leading-relaxed">{question.question}</p>
                      </div>

                      <RadioGroup
                        value={answers[question.id]?.toString() || ''}
                        onValueChange={value => onAnswerChange(question.id, parseInt(value))}
                        className="ml-11 space-y-2"
                      >
                        {question.options.map((option, optIdx) => (
                          <label
                            key={optIdx}
                            onClick={() => onAnswerChange(question.id, optIdx)}
                            className={`
                              flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all text-sm
                              ${answers[question.id] === optIdx
                                ? 'border-primary bg-primary/10 font-medium'
                                : 'border-border hover:border-primary/40 hover:bg-muted/50'
                              }
                            `}
                          >
                            <RadioGroupItem value={optIdx.toString()} />
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
                          </label>
                        ))}
                      </RadioGroup>
                    </Card>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Side navigation */}
      {(showQuestions || ratedCount === toolSelfRatings.length) && (
        <div className="hidden lg:block w-48 flex-shrink-0">
          <QuestionNav
            questions={allQuestions}
            answers={answers}
            onJumpTo={handleJumpTo}
          />
        </div>
      )}
    </div>
  );
};

export default DigitalToolsStep;
