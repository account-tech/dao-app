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
    case 0: // AssetTypeStep
      return true;
    case 1: // AuthVotingPowerStep
      return true;
    case 2: // UnstakingCooldownStep
      return true;
    case 3: // VotingRuleStep
      return true;
    case 4: // VotingQuorumStep
      return true;
    case 5: // VotingLimitsStep
      // Ensure maxVotingPower is greater than 0, not less than authVotingPower, and minimumVotes is less than or equal to maxVotingPower
      return formData.maxVotingPower > BigInt(0) && 
             formData.maxVotingPower >= formData.authVotingPower &&
             formData.minimumVotes <= formData.maxVotingPower;
    case 6: // ConfigProposalStep
      // Basic validation
      if (!formData.proposalName) {
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

      // Expiration time is auto-calculated, but let's validate it if it exists
      if (formData.expirationDate && formData.expirationDate <= formData.executionDate) {
        return false;
      }

      return true;

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