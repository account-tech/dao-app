export interface CoinSelection {
    type: string;
    amount: string;
    availableBalance?: number;
  }
  
  export interface WithdrawFormData {
    selectedCoins: CoinSelection[];
    vaultName: string;
    proposalName: string;
    proposalDescription: string;
    votingStartDate: Date | null;
    votingEndDate: Date | null;
    executionDate: Date | null;
    expirationDate: Date | null;
  }
  
  export interface StepProps {
    formData: WithdrawFormData;
    updateFormData: (updates: Partial<WithdrawFormData>) => void;
  } 