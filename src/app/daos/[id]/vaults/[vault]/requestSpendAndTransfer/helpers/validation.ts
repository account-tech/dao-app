import { isValidSuiAddress } from "@mysten/sui/utils";
import { WithdrawFormData } from "./types";

export const validateStep = (step: number, formData: WithdrawFormData): boolean => {
  switch (step) {
    case 0: // CoinSelectionStep
      if (!formData.selectedCoins || formData.selectedCoins.length === 0) {
        return false;
      }
      return formData.selectedCoins.every(coin => 
        coin.coinType && 
        typeof coin.amount === 'number' && 
        coin.amount > 0
      );

    case 1: // RecipientStep
      if (!formData.recipients || formData.recipients.length === 0 || !formData.selectedCoins?.[0]) {
        return false;
      }

      const selectedCoin = formData.selectedCoins[0];

      // First validate basic recipient data
      const basicValidation = formData.recipients.every(recipient => {
        // Check if recipient address is valid
        if (!recipient.address || !isValidSuiAddress(recipient.address)) {
          return false;
        }
        // Check if amount is valid
        if (typeof recipient.amount !== 'number' || recipient.amount <= 0) {
          return false;
        }
        return true;
      });

      if (!basicValidation) return false;

      // Calculate total amount from all recipients
      const totalAmount = formData.recipients.reduce((sum, recipient) => sum + recipient.amount, 0);

      // Check if recipient amounts match selected amount exactly
      return totalAmount === selectedCoin.amount;

    case 2: // ConfigProposalStep
      return formData.proposalName.trim().length > 0;

    case 3: // ReviewStep
      return (
        validateStep(0, formData) && 
        validateStep(1, formData) && 
        validateStep(2, formData)
      );

    default:
      return false;
  }
}; 