import { DaoFormData } from "./types";

export const validateStep = (step: number, formData: DaoFormData): boolean => {
  switch (step) {
    case 0: // SelectTypeOfDaoStep
      // Ensure daoType is 'coin' and coinType is defined and not empty
      return formData.daoType === 'coin' && !!formData.coinType?.trim();

    case 1: // BasicInfoStep
      // Ensure name is present
      return !!formData.name.trim()

    case 2: // VotingPowerStep
      // Ensure authVotingPower is greater than 0
      return formData.authVotingPower > BigInt(0);

    case 3: // UnstakingCooldownStep
      // Always valid as it can be 0 (no cooldown) or any positive number
      return true;

    case 4: // VotingRuleStep
      // Always valid as it's either 0 (linear) or 1 (quadratic)
      return formData.votingRule === 0 || formData.votingRule === 1;

    case 5: // VotingQuorumStep
      // Ensure quorum is between 0 and 100% (0 to 1e9 in SDK terms)
      return formData.votingQuorum >= BigInt(0) && 
             formData.votingQuorum <= BigInt(1000000000);

    case 6: // VotingLimitsStep
      // Ensure maxVotingPower is greater than 0 and minimumVotes is less than or equal to maxVotingPower
      return formData.maxVotingPower > BigInt(0) && 
             formData.minimumVotes <= formData.maxVotingPower;

    case 7: // RecapStep
      // Final validation of all critical parameters
      return (
        // Basic validation
        !!formData.name.trim() &&
        formData.daoType === 'coin' &&
        !!formData.coinType?.trim() &&
        // Voting power validation
        formData.authVotingPower > BigInt(0) &&
        formData.maxVotingPower > BigInt(0) &&
        formData.minimumVotes <= formData.maxVotingPower &&
        // Quorum validation (0-100%)
        formData.votingQuorum >= BigInt(0) &&
        formData.votingQuorum <= BigInt(1000000000) &&
        // Voting rule validation
        (formData.votingRule === 0 || formData.votingRule === 1)
      );

    default:
      return false;
  }
};