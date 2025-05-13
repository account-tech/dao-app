export interface DaoConfigFormData {
    // Proposal metadata
    proposalName: string;
    proposalDescription: string;
    executionDate: Date | null;
    expirationDate: Date | null;

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
