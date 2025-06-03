import { isValidSuiAddress } from "@mysten/sui/utils";
import { VestingFormData, CoinSelection } from "./types";

export const validateStep = (step: number, formData: VestingFormData): boolean => {
  switch (step) {
    case 0: // CoinSelectionStep
      // Validate coin selection
      if (!formData.selectedCoins || formData.selectedCoins.length === 0) {
        return false;
      }
      const coinValid = formData.selectedCoins.every((coin: CoinSelection) => 
        coin.coinType && 
        typeof coin.balance === 'number' && 
        coin.balance > 0 &&
        coin.amount > 0 && // Make sure amount is set
        coin.amount <= coin.balance // Make sure amount doesn't exceed balance
      );
      if (!coinValid) return false;

      // Validate required vesting dates (now Date objects with time included)
      if (!formData.vestingStartDate || !formData.vestingEndDate) {
        return false;
      }

      const now = new Date();
      const vestingStart = formData.vestingStartDate;
      const vestingEnd = formData.vestingEndDate;

      // Validate date order and timing
      return (
        vestingStart > now &&         // Vesting start must be in the future
        vestingEnd > vestingStart     // Vesting end must be after start
      );

    case 1: // RecipientStep
      return Boolean(formData.recipientAddress) && 
             isValidSuiAddress(formData.recipientAddress);

    case 2: // ConfigProposalStep
      // Validate proposal name and voting dates
      if (!formData.proposalName.trim().length) {
        return false;
      }
      
      // Validate voting dates are set
      if (!formData.votingStartDate || !formData.votingEndDate || !formData.executionDate) {
        return false;
      }

      return true;

    case 3: // ReviewStep
      // Validate all previous steps
      return (
        validateStep(0, formData) && 
        validateStep(1, formData) && 
        validateStep(2, formData)
      );

    default:
      return false;
  }
}; 