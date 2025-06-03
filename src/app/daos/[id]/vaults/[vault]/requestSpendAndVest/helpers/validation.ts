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

      // Validate required vesting dates and times
      if (!formData.vestingStartDate || !formData.vestingStartTime ||
          !formData.vestingEndDate || !formData.vestingEndTime) {
        return false;
      }

      const now = new Date();
      const vestingStart = new Date(formData.vestingStartDate);
      const vestingEnd = new Date(formData.vestingEndDate);

      // Set time components for vesting dates
      const [startHours, startMinutes] = formData.vestingStartTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.vestingEndTime.split(':').map(Number);
      
      vestingStart.setHours(startHours, startMinutes, 0, 0);
      vestingEnd.setHours(endHours, endMinutes, 0, 0);

      // Validate date order
      return (
        vestingStart > now &&         // Vesting start must be in the future
        vestingEnd > vestingStart     // Vesting end must be after start
      );

    case 1: // RecipientStep
      return Boolean(formData.recipientAddress) && 
             isValidSuiAddress(formData.recipientAddress);

    case 2: // ConfigProposalStep
      // Only validate proposal name
      return formData.proposalName.trim().length > 0;

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