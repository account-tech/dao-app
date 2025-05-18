export interface DaoConfigFormData {
    // Proposal metadata
    proposalName: string;
    proposalDescription: string;
    votingStartDate: Date | null;  // When voting starts
    votingEndDate: Date | null;    // When voting ends
    executionDate: Date | null;    // When proposal executes if approved
    expirationDate: Date | null;   // When proposal expires if not executed (auto-calculated)

    // DAO configuration parameters
    assetType: string;
    authVotingPower: bigint;
    unstakingCooldown: bigint;
    votingRule: number;
    maxVotingPower: bigint;
    minimumVotes: bigint;
    votingQuorum: bigint;
}

export interface StepProps {
    formData: DaoConfigFormData;
    updateFormData: (data: Partial<DaoConfigFormData>) => void;
}
