export interface CoinSelection {
    coinType: string;
    amount: number;
    balance?: number;
    baseBalance?: bigint;
    coinObjectId?: string;
  }
  
  export interface Recipient {
    address: string;
    coinType: string;
    amount: number;
  }
  
  
  export interface VestingFormData {
    selectedCoins: CoinSelection[];
    recipientAddress: string;
    proposalName: string;
    proposalDescription: string;
    vestingStartDate: Date;
    vestingStartTime: string;
    vestingEndDate: Date;
    vestingEndTime: string;
    votingStartDate: Date | null;
    votingEndDate: Date | null;
    executionDate: Date | null;
    expirationDate: Date | null;
  }
  
  export interface VestingStepProps {
    formData: VestingFormData;
    updateFormData: (updates: Partial<VestingFormData>) => void;
  } 