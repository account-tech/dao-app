'use client';
import { DaoClient } from "@account.tech/dao";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { useDaoStore } from "@/store/useDaoStore";
import { CreateDaoParams } from "@/types/dao";

export function useDaoClient() {
  const { getOrInitClient, resetClient } = useDaoStore();

  const initDaoClient = async (
    userAddr: string,
    multisigId?: string
  ): Promise<DaoClient> => {
    return getOrInitClient(userAddr, multisigId);
  };

  const refresh = async (userAddr: string) => {
    try {
      const client = await getOrInitClient(userAddr);
      await client.refresh();
    } catch (error) {
      console.error("Error refreshing multisig:", error);
      throw error;
    }
  };

  const switchDao = async (userAddr: string, daoId: string) => {
    try {
      const client = await getOrInitClient(userAddr);
      await client.switchDao(daoId);
    } catch (error) {
      console.error("Error switching dao:", error);
      throw error;
    }
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

  const getAllDaos = async (userAddr: string) => {
    try {
      const client = await getOrInitClient(userAddr);
      if (!client.registry) {
        throw new Error("Registry not initialized");
      }
      return client.registry.daos;
    } catch (error) {
      console.error("Error getting all daos:", error);
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

  const getDao = async (userAddr: string, daoId?: string) => {
    try {
      const client = await getOrInitClient(userAddr, daoId);
      return client.dao;
    } catch (error) {
      console.error("Error getting dao:", error);
      throw error;
    }
  };

  const getParticipant = async (userAddr: string, daoId?: string) => {
    try {
      const client = await getOrInitClient(userAddr, daoId);
      return client.participant;
    } catch (error) {
      console.error("Error getting participant:", error);
      throw error;
    }
  };

  const followDao = async (
    userAddr: string,
    daoId: string,
    username?: string,
    profilePicture?: string
  ) => {
    try {
      const client = await getOrInitClient(userAddr);
      const tx = new Transaction();
      await client.followDao(tx, daoId, username, profilePicture);
      return tx;
    } catch (error) {
      console.error("Error following dao:", error);
      throw error;
    }
  };

  const unfollowDao = async (userAddr: string, daoId: string) => {
    try {
      const client = await getOrInitClient(userAddr);
      const tx = new Transaction();
      await client.unfollowDao(tx, daoId);
      return tx;
    } catch (error) {
      console.error("Error unfollowing dao:", error);
      throw error;
    }
  };

  const stake = async (userAddr: string, assets: bigint | string[]) => {
    try {
      const client = await getOrInitClient(userAddr);
      const tx = new Transaction();
      tx.setSender(userAddr);
      await client.stake(tx, assets);
      return tx;
    } catch (error) {
      console.error("Error staking assets:", error);
      throw error;
    }
  };

  const unstake = async (userAddr: string, assets: bigint | string[]) => {
    try {
      const client = await getOrInitClient(userAddr);
      const tx = new Transaction();
      tx.setSender(userAddr);
      await client.unstake(tx, assets);
      return tx;
    } catch (error) {
      console.error("Error unstaking assets:", error);
      throw error;
    }
  };

  return {
    initDaoClient,
    refresh,
    switchDao,
    createDao,
    getUser,
    getUserDaos,
    getAllDaos,
    getDao,
    getParticipant,
    followDao,
    unfollowDao,
    stake,
    unstake,
  };
}