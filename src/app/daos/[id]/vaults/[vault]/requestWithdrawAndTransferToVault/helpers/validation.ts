import { WithdrawFormData } from "./types";

export const validateStep = (step: number, formData: WithdrawFormData): boolean => {
  switch (step) {
    case 0: // CoinSelectionStep
      // Check if there are any selected coins and they all have valid amounts
      return formData.selectedCoins.length > 0 && 
             formData.selectedCoins.every(coin => 
               coin.type && 
               coin.amount && 
               parseFloat(coin.amount) > 0 &&
               // Ensure amount doesn't exceed available balance
               parseFloat(coin.amount) <= (coin.availableBalance ?? 0)
             );
    
    case 1: // ConfigProposalStep
      // Check if proposal name and required dates are provided
      return !!formData.proposalName && 
             formData.proposalName.trim().length > 0 &&
             !!formData.votingStartDate &&
             !!formData.votingEndDate &&
             !!formData.executionDate;
    
    case 2: // RecapStep
      // All validation done in previous steps
      return true;
    
    default:
      return false;
  }
}; 