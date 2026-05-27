import { Question } from '@/types/assessment';

interface QuestionNavProps {
  questions: Question[];
  answers: Record<string, number>;
  onJumpTo: (index: number) => void;
}

const QuestionNav = ({ questions, answers, onJumpTo }: QuestionNavProps) => {
  const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;

  return (
    <div className="bg-card border border-border rounded-xl p-4 sticky top-[160px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">Questions</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {answeredCount}/{questions.length}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJumpTo(i)}
              className={`
                w-full aspect-square rounded-lg text-xs font-semibold transition-all
                ${isAnswered
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-primary" /> Answered
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-muted border border-border" /> Unanswered
        </span>
      </div>
    </div>
  );
};

export default QuestionNav;
