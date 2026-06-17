import { Check } from 'lucide-react';
import { ONBOARDING_STEPS, OnboardingStep } from '@/types/tutor';

const STEP_ORDER: OnboardingStep[] = ['signup', 'profile', 'test', 'verification'];

interface StepTrackerProps {
  currentStep: OnboardingStep;
}

export default function StepTracker({ currentStep }: StepTrackerProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="w-full py-6 overflow-x-auto hide-scrollbar">
      <div className="flex items-center justify-between relative min-w-[400px] sm:min-w-0 px-2 sm:px-0">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border mx-8" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-secondary mx-8 transition-all duration-500"
          style={{ width: `${(currentIndex / (STEP_ORDER.length - 1)) * 100}%` }}
        />

        {ONBOARDING_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-secondary text-secondary-foreground'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
