import React from 'react';

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
    <nav
      aria-label="Progress Stepper"
      className="flex items-center justify-center gap-2 py-1 max-h-6 select-none"
    >
      {steps.map((step) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick && onStepClick(step.id)}
            disabled={!onStepClick}
            aria-label={`Step ${step.id}: ${step.label}`}
            className={`h-1 sm:h-1.5 w-8 sm:w-10 rounded-full transition-all duration-300 ${
              isActive || isCompleted
                ? 'bg-accent shadow-[0_0_8px_rgba(201,168,76,0.5)] opacity-100'
                : 'bg-border-subtle/80 hover:bg-border-medium/60 opacity-60'
            }`}
          />
        );
      })}
    </nav>
  );
};
