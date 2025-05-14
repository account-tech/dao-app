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
      return true;
    case 1: // AssetTypeStep
      return true;
    case 2: // AuthVotingPowerStep
      return true;
    case 3: // UnstakingCooldownStep
      return true;
    case 4: // VotingRuleStep
      return true;
    case 5: // VotingQuorumStep
      return true;
    case 6: // ConfigProposalStep
      return !!formData.proposalName;
    case 7: // RecapStep
      // If hasChanges helper is provided, use it to determine if there are changes
      // If no changes, return false to disable the button
      if (helpers?.hasChanges) {
        return helpers.hasChanges();
      }
      return true;
    default:
      return false;
  }
}; 