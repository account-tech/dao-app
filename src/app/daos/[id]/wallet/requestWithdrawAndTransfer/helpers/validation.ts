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
          (typeof coin.amount !== 'number' || coin.amount <= coin.availableBalance)
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

      // Coin amount validation (if coins selected) - needs refinement
      if (formData.selectedCoins && formData.selectedCoins.length > 0) {
        const coinsValid = formData.selectedCoins.every(coin => {
          if (typeof coin.amount !== 'number' || coin.amount <= 0) {
             return false; // Amount must be a positive number
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