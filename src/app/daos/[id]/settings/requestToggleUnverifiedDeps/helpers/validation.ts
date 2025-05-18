import { ToggleUnverifiedFormData } from './types';

export const validateStep = (step: number, formData: ToggleUnverifiedFormData): boolean => {
  switch (step) {
    // Config Proposal Step
    case 0:
      return formData.proposalName.trim().length > 0;
    
    // Review Step
    case 1:
      return true; // No additional validation needed for review step
    
    default:
      return false;
  }
};
