export interface DaoFormData {
    daoType: 'coin' | 'nft';
    coinType?: string;
    coinDecimals?: number;
    assetType: string;
    authVotingPower: bigint;
    unstakingCooldown: bigint;
    votingRule: number;
    maxVotingPower: bigint;
    minimumVotes: bigint;
    votingQuorum: bigint;
    name: string;
    description: string;
    image: string;
    twitter: string;
    telegram: string;
    discord: string;
    github: string;
    website: string;
  }
  
  export interface StepProps {
    formData: DaoFormData;
    updateFormData: (updates: Partial<DaoFormData>) => void;
  }