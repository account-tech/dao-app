export interface CoinSelection {
    coinType: string;
    amount: number;
    balance: number;
    baseBalance: bigint;
    availableBalance: number;
    coinObjectId?: string;
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
    executionDate?: Date;
    expirationDate?: Date;
}

export interface StepProps {
    formData: WithdrawFormData;
    updateFormData: (updates: Partial<WithdrawFormData>) => void;
} 