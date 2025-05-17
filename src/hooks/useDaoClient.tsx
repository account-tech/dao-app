'use client';
import { DaoClient, DepStatus, VoteIntentArgs } from "@account.tech/dao";
import { OwnedData, Dep } from "@account.tech/core";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { useDaoStore } from "@/store/useDaoStore";
import { CreateDaoParams, RequestConfigDaoParams } from "@/types/dao";

export function useDaoClient() {
  const { initClient } = useDaoStore();

  const initDaoClient = async (
    userAddr: string,
    multisigId?: string
  ): Promise<DaoClient> => {
    return initClient(userAddr, multisigId);
  };

  const createDao = async (
    userAddr: string,
    params: CreateDaoParams
  ): Promise<TransactionResult> => {
    try {
      const client = await initClient(userAddr);
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
      return result;
    } catch (error) {
      console.error("Error creating dao:", error);
      throw error;
    }
  };

  //====================GETTERS====================

  const getAllDaos = async (userAddr: string) => {
    try {
      const client = await initClient(userAddr);
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
      const client = await initClient(userAddr);
      return client.user;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  };

  const getUserDaos = async (userAddr: string) => {
    try {
      const client = await initClient(userAddr);
      return await client.getUserDaos();
    } catch (error) {
      console.error("Error getting user daos:", error);
      throw error;
    }
  };

  const getDao = async (userAddr: string, daoId: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.dao;
    } catch (error) {
      console.error("Error getting dao:", error);
      throw error;
    }
  };

  const getDaoMetadata = async (userAddr: string, daoId: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getDaoMetadata();
    } catch (error) {
      console.error("Error getting dao metadata:", error);
      throw error;
    }
  };

  const getParticipant = async (userAddr: string, daoId: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.participant;
    } catch (error) {
      console.error("Error getting participant:", error);
      throw error;
    }
  };

  const getOwnedObjects = async (userAddr: string, daoId: string): Promise<OwnedData> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getOwnedObjects();
    } catch (error) {
      console.error("Error getting owned objects:", error);
      throw error;
    }
  };

  const getDaoDeps = async (userAddr: string, daoId: string): Promise<Dep[]> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getDaoDeps();
    } catch (error) {
      console.error("Error getting dao dependencies:", error);
      throw error;
    }
  };

  const getVerifiedDeps = async (userAddr: string, daoId: string): Promise<Dep[]> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getVerifiedDeps();
    } catch (error) {
      console.error("Error getting verified dependencies:", error);
      throw error;
    }
  };

  const getUnverifiedDeps = async (userAddr: string, daoId: string): Promise<Dep[]> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getUnverifiedDeps();
    } catch (error) {
      console.error("Error getting unverified dependencies:", error);
      throw error;
    }
  };

  const getDepsStatus = async (userAddr: string, daoId: string): Promise<DepStatus[]> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getDepsStatus();
    } catch (error) {
      console.error("Error getting dependencies status:", error);
      throw error;
    }
  };

  //====================ACTIONS====================

  const authenticate = async (tx: Transaction, daoId: string, userAddr: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      await client.authenticate(tx);
      return tx;
    } catch (error) {
      console.error("Error authenticating:", error);
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
      const client = await initClient(userAddr);
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
      const client = await initClient(userAddr);
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
      const client = await initClient(userAddr);
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
      const client = await initClient(userAddr);
      const tx = new Transaction();
      await client.unstake(tx, assets);
      return tx;
    } catch (error) {
      console.error("Error unstaking assets:", error);
      throw error;
    }
  };

  const claim = async (userAddr: string) => {
    try {
      const client = await initClient(userAddr);
      const tx = new Transaction();
      await client.claim(tx);
      return tx;
    } catch (error) {
      console.error("Error claiming assets:", error);
      throw error;
    }
  };

  const modifyName = async (tx: Transaction, userAddr: string, daoId: string, newName: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      await client.modifyName(tx, newName);
      return tx;
    } catch (error) {
      console.error("Error modifying name:", error);
      throw error;
    }
  };

  const updateVerifiedDeps = async (userAddr: string, daoId: string, tx: Transaction) => {
    try {
      const client = await initClient(userAddr, daoId);
      await client.updateVerifiedDeps(tx);
      return tx;
    } catch (error) {
      console.error("Error updating verified dependencies:", error);
      throw error;
    }
  };

  //====================DAO INTENTS====================

  const requestConfigDao = async (
    userAddr: string,
    params: RequestConfigDaoParams,
    daoId: string
  ) => {
    try {
      const client = await initClient(userAddr, daoId);
      await client.requestConfigDao(
        params.tx,
        params.intentArgs,
        params.assetType,
        params.authVotingPower,
        params.unstakingCooldown,
        params.votingRule,
        params.maxVotingPower,
        params.minimumVotes,
        params.votingQuorum
      );
      return params.tx;
    } catch (error) {
      console.error("Error requesting DAO configuration:", error);
      throw error;
    }
  };

  const requestToggleUnverifiedDepsAllowed = async (
    tx: Transaction,
    userAddr: string,
    intentArgs: VoteIntentArgs,
    daoId: string
  ) => {
    try {
      const client = await initClient(userAddr, daoId);
      await client.requestToggleUnverifiedDepsAllowed(tx, intentArgs);
      return tx;
    } catch (error) {
      console.error("Error requesting toggle unverified deps:", error);
      throw error;
    }
  };

  return {
    initDaoClient,
    createDao,
    getUser,
    getUserDaos,
    getAllDaos,
    getDao,
    getDaoMetadata,
    getParticipant,
    getOwnedObjects,
    getDaoDeps,
    getVerifiedDeps,
    getUnverifiedDeps,
    getDepsStatus,
    authenticate,
    followDao,
    unfollowDao,
    stake,
    unstake,
    claim,
    modifyName,
    updateVerifiedDeps,
    requestConfigDao,
    requestToggleUnverifiedDepsAllowed,
  };
}