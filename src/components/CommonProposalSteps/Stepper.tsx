import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  description: string;
  component: React.ReactNode;
}

interface BaseFormData {
  proposalName: string;
  proposalDescription: string;
  executionDate?: Date | null;
  expirationDate?: Date | null;
}

interface StepperProps<T extends BaseFormData> {
  steps: Step[];
  onComplete: () => void;
  isLoading?: boolean;
  isCompleted?: boolean;
  formData: T;
  validateStep: (step: number, formData: T) => boolean;
}

const SteppedProgress = <T extends BaseFormData>({ 
  steps, 
  onComplete, 
  isLoading,
  isCompleted,
  formData,
  validateStep
}: StepperProps<T>) => {
  const [currentStep, setCurrentStep] = useState(0);

  const isStepValid = () => {
    return validateStep(currentStep, formData);
  };

  const handleNext = () => {
    if (!isStepValid()) {
      return;
    }

    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Calculate completed steps, including all steps when loading or completed
  const completedSteps = (isLoading || isCompleted) ? steps.length : currentStep;

  // Calculate if the next button should be disabled
  const isNextDisabled = isLoading || !isStepValid();

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <Steps numSteps={steps.length} stepsComplete={completedSteps} />
        
        <div className="text-center">
          <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
          <p className="text-gray-600 mt-2">{steps[currentStep].description}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="min-h-[400px] sm:min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-end gap-4 mt-6">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="px-6"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isNextDisabled}
                className="px-6"
              >
                {(isLoading || isCompleted) && currentStep === steps.length - 1 ? (
                  <div className="flex items-center">
                    <motion.div
                      className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"
                    />
                    Processing...
                  </div>
                ) : currentStep === steps.length - 1 ? (
                  "Confirm Configuration"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Steps = ({
  numSteps,
  stepsComplete,
}: {
  numSteps: number;
  stepsComplete: number;
}) => {
  const stepArray = Array.from(Array(numSteps).keys());

  return (
    <div className="flex items-center justify-between gap-3">
      {stepArray.map((num) => {
        const stepNum = num + 1;
        const isActive = stepNum <= stepsComplete + 1;
        const isCompleted = stepNum <= stepsComplete;
        return (
          <React.Fragment key={stepNum}>
            <Step 
              num={stepNum} 
              isActive={isActive} 
              isCompleted={isCompleted} 
            />
            {stepNum !== stepArray.length && (
              <div className="w-full h-1 rounded-full bg-gray-200 relative">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-neutral-950 rounded-full"
                  animate={{ width: isCompleted ? "100%" : 0 }}
                  transition={{ ease: "easeIn", duration: 0.3 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface StepProps {
  num: number;
  isActive: boolean;
  isCompleted: boolean;
}

const Step = ({ num, isActive, isCompleted }: StepProps) => {
  return (
    <div className="relative">
      <div
        className={`w-10 h-10 flex items-center justify-center shrink-0 border-2 rounded-full font-semibold text-sm relative z-10 transition-colors duration-300 ${
          isActive
            ? isCompleted
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-950 text-neutral-950"
            : "border-gray-300 text-gray-300"
        }`}
      >
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.svg
              key="icon-marker-check"
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 16 16"
              height="1.6em"
              width="1.6em"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.125 }}
            >
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
            </motion.svg>
          ) : (
            <motion.span
              key="icon-marker-num"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.125 }}
            >
              {num}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {isActive && (
        <div className="absolute z-0 -inset-1.5 bg-transparent rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default SteppedProgress;
