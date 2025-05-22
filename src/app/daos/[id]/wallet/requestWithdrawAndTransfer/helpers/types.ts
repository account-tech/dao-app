export interface CoinSelection {
    coinType: string;
    amount: number | undefined;
    balance: number;
    baseBalance: bigint;
    availableBalance: number;
}

export interface ObjectSelection {
    objectId: string;
    type: string;
    display?: string;
    image?: string;
    name?: string;
    fields?: Record<string, any>;
}

export interface WithdrawFormData {
    selectedCoins: CoinSelection[];
    selectedObjects: ObjectSelection[];
    recipientAddress: string;
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