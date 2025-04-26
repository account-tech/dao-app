import { Transaction } from "@mysten/sui/transactions";

export interface CreateDaoParams {
    tx: Transaction;
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
    newUser?: {
      username: string;
      profilePicture: string;
    };
  }