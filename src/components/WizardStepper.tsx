import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
}

interface WizardStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full px-2 py-2 flex flex-col items-center select-none">
      <div className="flex items-center justify-between w-full max-w-md relative">
        {/* Connecting background track */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-border-subtle -z-0" />
        
        {/* Active progress fill */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-[2px] bg-accent transition-all duration-300 -z-0"
          style={{
            width: steps.length > 1 ? `${((currentStep - 1) / (steps.length - 1)) * 100}%` : '0%',
            maxWidth: 'calc(100% - 32px)'
          }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`relative z-10 flex flex-col items-center group ${
                onStepClick ? 'cursor-pointer' : ''
              }`}
            >
              {/* Dot / Number Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-accent text-[#070B14] shadow-gold-glow ring-4 ring-accent/20 scale-110'
                    : isCompleted
                    ? 'bg-accent-dim text-white shadow-sm'
                    : 'bg-bg-elevated border border-border-subtle text-text-tertiary group-hover:border-border-medium'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step Label (compact overline) */}
              <span
                className={`text-[10px] tracking-wider uppercase mt-1 text-center font-medium transition-colors whitespace-nowrap max-w-[80px] truncate ${
                  isActive
                    ? 'text-accent font-semibold'
                    : isCompleted
                    ? 'text-text-secondary'
                    : 'text-text-tertiary'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
