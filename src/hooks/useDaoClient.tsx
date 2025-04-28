'use client';
import { DaoClient } from "@account.tech/dao";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { useDaoStore } from "@/store/useDaoStore";
import { Profile } from "@account.tech/core";
import { CreateDaoParams } from "@/types/dao";

export function useDaoClient() {
  const { getOrInitClient, resetClient } = useDaoStore();

  const initDaoClient = async (
    userAddr: string,
    multisigId?: string
  ): Promise<DaoClient> => {
    return getOrInitClient(userAddr, multisigId);
  };

  const createDao = async (
    userAddr: string,
    params: CreateDaoParams
  ): Promise<TransactionResult> => {
    try {
      const client = await getOrInitClient(userAddr);
      const result = await client.createDao(
        params.tx,
        params.assetType,
        params.authVotingPower,
        params.unstakingCooldown,
        params.votingRule,
        params.maxVotingPower,
        params.minimumVotes,
        params.votingQuorum,
        params.name,
        params.description,
        params.image,
        params.twitter,
        params.telegram,
        params.discord,
        params.github,
        params.website,
      );
      resetClient();
      return result;
    } catch (error) {
      console.error("Error creating dao:", error);
      throw error;
    }
  };

  const getUser = async (userAddr: string) => {
    try {
      const client = await getOrInitClient(userAddr);
      return client.user
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  };

  const getUserDaos = async (userAddr: string) => {
    try {
      const client = await getOrInitClient(userAddr);
      return await client.getUserDaos();
    } catch (error) {
      console.error("Error getting user daos:", error);
      throw error;
    }
  };

  return {
    initDaoClient,
    createDao,
    getUser,
    getUserDaos,
  };
}