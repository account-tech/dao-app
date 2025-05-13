import { DaoConfigFormData } from "./types";

interface ValidationHelpers {
  hasChanges?: () => boolean;
}

export const validateStep = (
  step: number, 
  formData: DaoConfigFormData,
  helpers?: ValidationHelpers
): boolean => {
  switch (step) {
    case 0: // ConfigProposalStep
      return formData.proposalName.trim().length > 0;
    
    default:
      return false;
  }
}; 