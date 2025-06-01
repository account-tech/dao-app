export interface CoinSelection {
    coinType: string;
    amount: number;
    balance?: number;
    baseBalance?: bigint;
    coinObjectId?: string;
  }
  
  export interface Recipient {
    address: string;
    amount: number;
  }
  
  export interface WithdrawFormData {
    selectedCoins: CoinSelection[];
    recipients: Recipient[];
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