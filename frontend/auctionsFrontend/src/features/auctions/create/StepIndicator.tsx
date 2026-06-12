import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Type' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Media' },
  { id: 4, label: 'Pricing' },
  { id: 5, label: 'Schedule' },
  { id: 6, label: 'Review' },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number[];
}

export function StepIndicator({ currentStep, onStepClick, completedSteps }: StepIndicatorProps) {
  return (
    <nav aria-label="Wizard progress" className="mx-auto w-full max-w-3xl px-4">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= Math.max(...completedSteps, 0) + 1;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  'group flex flex-col items-center gap-2 focus:outline-none',
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200',
                    isCompleted
                      ? 'border-success bg-success text-white'
                      : isCurrent
                        ? 'border-orange bg-orange text-white shadow-md shadow-orange/30'
                        : 'border-border bg-white text-muted group-hover:border-orange/50',
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors whitespace-nowrap',
                    isCurrent ? 'text-orange' : isCompleted ? 'text-success' : 'text-muted',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="mx-2 mb-6 h-0.5 flex-1">
                  <div
                    className={cn(
                      'h-full rounded-full transition-colors duration-300',
                      isCompleted ? 'bg-success' : 'bg-border',
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
