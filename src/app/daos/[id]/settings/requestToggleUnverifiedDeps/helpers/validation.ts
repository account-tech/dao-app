import { ToggleUnverifiedFormData } from './types';

export const validateStep = (step: number, formData: ToggleUnverifiedFormData): boolean => {
  switch (step) {
    // Config Proposal Step
    case 0:
      // Basic validation
      if (formData.proposalName.trim().length === 0) {
        return false;
      }

      // Date validations
      const now = new Date();
      
      // Voting start time must be in the future
      if (!formData.votingStartDate || formData.votingStartDate < now) {
        return false;
      }

      // Voting end time must be after start time
      if (!formData.votingEndDate || formData.votingEndDate <= formData.votingStartDate) {
        return false;
      }

      // Execution time must be after voting end time
      if (!formData.executionDate || formData.executionDate <= formData.votingEndDate) {
        return false;
      }

      return true;
    
    // Review Step
    case 1:
      return true; // No additional validation needed for review step
    
    default:
      return false;
  }
};
