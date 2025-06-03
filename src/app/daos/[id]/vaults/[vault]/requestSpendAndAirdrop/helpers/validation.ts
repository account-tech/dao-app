import { isValidSuiAddress } from "@mysten/sui/utils";
import { WithdrawFormData } from "./types";

export const validateStep = (step: number, formData: WithdrawFormData): boolean => {
  switch (step) {
    case 0: // RecipientStep
      if (!formData.recipients || formData.recipients.length === 0) {
        return false;
      }
      // Validate all recipient addresses
      return formData.recipients.every(recipient => 
        recipient.address && 
        isValidSuiAddress(recipient.address)
      );

    case 1: // AirDropSelectionStep or CsvPreviewStep
      if (!formData.selectedCoins || formData.selectedCoins.length === 0) {
        return false;
      }
      const selectedCoin = formData.selectedCoins[0];
      
      // Validate coin selection
      if (!selectedCoin.coinType || !selectedCoin.balance) {
        return false;
      }

      // Validate that we have recipients
      if (!formData.recipients || formData.recipients.length === 0) {
        return false;
      }

      // Calculate total amount being distributed
      let totalAmount: number;
      
      // Check if we're in CSV mode (recipients have pre-specified amounts)
      const isCsvMode = formData.recipients.some(r => r.amount > 0);
      
      if (isCsvMode) {
        // Sum up the pre-specified amounts from CSV
        totalAmount = formData.recipients.reduce((sum, r) => sum + r.amount, 0);
      } else {
        // Manual mode - multiply amount per recipient by number of recipients
        if (!selectedCoin.amount || selectedCoin.amount <= 0) {
          return false;
        }
        totalAmount = selectedCoin.amount * formData.recipients.length;
      }

      // Validate that total amount doesn't exceed available balance
      if (totalAmount > selectedCoin.balance) {
        return false;
      }

      // All validations passed
      return true;

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