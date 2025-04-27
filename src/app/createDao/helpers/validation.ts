import { MultiSigFormData } from "./types";

export const validateStep = (step: number, formData: MultiSigFormData): boolean => {
  switch (step) {
    case 0: // MultiSigStep
      return formData.teamName.length > 0;
    
    case 1: // AddMemberStep
      // Current user's address is always present, so we can proceed
      // Additional members should be valid if present
      return formData.members.every(member => member.length > 0);
    
    case 2: // ThresholdStep
      const totalMembers = formData.members.length + 1; // +1 for current user
      return formData.threshold > 0 && 
             formData.threshold <= totalMembers;
    
    case 3: // ReviewStep
      return true; // All validation done in previous steps
    
    default:
      return false;
  }
};