import { DependencyConfigFormData } from "./types";

interface ValidationHelpers {
  hasChanges?: () => boolean;
}

export const validateStep = (
  step: number, 
  formData: DependencyConfigFormData,
  helpers?: ValidationHelpers
): boolean => {
  switch (step) {
    case 0: // AddDependencyStep
      // Check if there are any changes (new deps added or existing deps removed)
      const hasNewDeps = formData.selectedDeps.some(dep => !formData.currentDeps.includes(dep));
      const hasRemovedDeps = formData.removedDeps.length > 0;
      return hasNewDeps || hasRemovedDeps;
    
    case 1: // ConfigProposalStep
      return formData.proposalName.trim().length > 0;
    
    case 2: // ReviewAndConfirmStep
      return true; // All validation done in previous steps
    
    default:
      return false;
  }
}; 