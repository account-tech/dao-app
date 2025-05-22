import { isValidSuiAddress } from "@mysten/sui/utils";
import { WithdrawFormData } from "./types";

export const validateStep = (step: number, formData: WithdrawFormData): boolean => {
  switch (step) {
    case 0: // AssetSelectionStep
      // Check if we have at least one asset selected (coin, NFT, or object)
      const hasAssets = (
        (formData.selectedCoins && formData.selectedCoins.length > 0) ||
        (formData.selectedObjects && formData.selectedObjects.length > 0)
      );

      if (!hasAssets) {
        return false;
      }

      // If coins are selected, validate them
      if (formData.selectedCoins && formData.selectedCoins.length > 0) {
        const coinsValid = formData.selectedCoins.every(coin => 
          coin.coinType && 
          typeof coin.availableBalance === 'number' &&
          coin.availableBalance > 0 &&
          typeof coin.amount === 'number' &&
          coin.amount > 0 && // Ensure amount is positive
          coin.amount <= coin.availableBalance
        );
        if (!coinsValid) return false;
      }

      // If objects are selected, validate them
      if (formData.selectedObjects && formData.selectedObjects.length > 0) {
        const objectsValid = formData.selectedObjects.every(obj => 
          obj.objectId && 
          isValidSuiAddress(obj.objectId)
        );
        if (!objectsValid) return false;
      }

      return true;

    case 1: // RecipientStep
      if (!formData.recipientAddress || !isValidSuiAddress(formData.recipientAddress)) {
        return false;
      }

      // Coin amount validation (if coins selected)
      if (formData.selectedCoins && formData.selectedCoins.length > 0) {
        const coinsValid = formData.selectedCoins.every(coin => {
          // Amount must be a positive number and not zero
          if (typeof coin.amount !== 'number' || coin.amount === 0 || coin.amount < 0) {
             return false;
          }
          if (typeof coin.availableBalance !== 'number') {
             return false; // Need balance to compare
          }
          if (coin.amount > coin.availableBalance) {
             return false; // Cannot send more than available
          }
          return true;
        });
        if (!coinsValid) return false;
      }
      
      // No specific validation needed for objects at this step
      return true;

    case 2: // ConfigProposalStep
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