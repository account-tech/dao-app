'use client';
import { DaoClient, DepStatus, VoteIntentArgs, IntentStatus } from "@account.tech/dao";
import { OwnedData, Dep } from "@account.tech/core";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { useDaoStore } from "@/store/useDaoStore";
import { CreateDaoParams, RequestConfigDaoParams } from "@/types/dao";
import { getCoinDecimals, getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import { SuiClient } from "@mysten/sui/client";

interface VotingPowerInfo {
  votingPower: string;
  authVotingPower: string;
  maxVotingPower: string;
  minimumVotes: string;
  hasAuthPower: boolean;
  isQuadratic: boolean;
  votingQuorum: number;
  assetType: string;
  unstakingCooldown: string;
}

interface VoteStakeInfo {
  lockedInVotes: string;
  retrievableVotes: string;
}

interface ConfigDaoChanges {
  requested: {
    assetType: string;
    authVotingPower: string;
    maxVotingPower: string;
    minimumVotes: string;
    unstakingCooldown: string;
    votingQuorum: string;
    votingRule: number;
  };
  current: {
    assetType: string;
    authVotingPower: string;
    maxVotingPower: string;
    minimumVotes: string;
    unstakingCooldown: string;
    votingQuorum: string;
    votingRule: number;
  };
}

interface WithdrawAmount {
  amount: string;
  coinType: string;
  recipient: string;
}

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
  ): Promise<void> => {
    try {
      const client = await initClient(userAddr);
      const result = client.createDao(
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
      return client.getUserDaos();
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

  const getIntents = async (userAddr: string, daoId: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.intents;
    } catch (error) {
      console.error("Error getting intents:", error);
      throw error;
    }
  };

  const getIntent = async (userAddr: string, daoId: string, key: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getIntent(key);
    } catch (error) {
      console.error("Error getting intent:", error);
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

  const getIntentStatus = async (
    userAddr: string,
    multisigId: string,
    key: string
  ): Promise<IntentStatus> => {
    try {
      const client = await initClient(userAddr, multisigId);
      const result = client.getIntentStatus(key);
      return result;
    } catch (error) {
      console.error("Error getting intent status:", error);
      throw error;
    }
  };

  const getDaoVotingPowerInfo = async (
    userAddr: string,
    daoId: string,
    suiClient: SuiClient
  ): Promise<VotingPowerInfo> => {
    try {
      const client = await initClient(userAddr, daoId);
      const [participant, dao] = await Promise.all([
        client.participant,
        client.dao
      ]);

      if (!participant || !dao) {
        throw new Error("Failed to fetch participant or dao data");
      }

      // Get coin decimals
      const simplifiedAssetType = getSimplifiedAssetType(participant.assetType);
      const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);

      // Calculate total staked amount
      let totalStakedValue = BigInt(0);
      if (participant.staked && Array.isArray(participant.staked)) {
        totalStakedValue = participant.staked.reduce((acc: bigint, stake: any) => {
          if (stake.daoAddr === daoId) {
            return acc + stake.value;
          }
          return acc;
        }, BigInt(0));
      }

      // Format values with decimals
      const divisor = BigInt(10) ** BigInt(decimals);
      const stakedAmount = Number(totalStakedValue) / Number(divisor);
      const formattedAuthVotingPower = Number(dao.authVotingPower) / Number(divisor);
      const formattedMaxVotingPower = Number(dao.maxVotingPower) / Number(divisor);
      const formattedMinimumVotes = Number(dao.minimumVotes) / Number(divisor);

      // Calculate voting power based on rule
      const isQuadratic = dao.votingRule === 1;
      const votingPower = isQuadratic 
        ? Math.sqrt(stakedAmount)
        : stakedAmount;

      // Convert voting quorum from [0, 1_000_000_000] to [0, 1]
      const votingQuorum = Number(dao.votingQuorum) / 1_000_000_000;

      return {
        votingPower: votingPower.toFixed(2),
        authVotingPower: formattedAuthVotingPower.toString(),
        maxVotingPower: formattedMaxVotingPower.toString(),
        minimumVotes: formattedMinimumVotes.toString(),
        hasAuthPower: votingPower >= formattedAuthVotingPower,
        isQuadratic,
        votingQuorum,
        assetType: dao.assetType,
        unstakingCooldown: dao.unstakingCooldown.toString()
      };
    } catch (error) {
      console.error("Error getting voting power info:", error);
      return {
        votingPower: "0.00",
        authVotingPower: "0",
        maxVotingPower: "0",
        minimumVotes: "0",
        hasAuthPower: false,
        isQuadratic: false,
        votingQuorum: 0,
        assetType: "",
        unstakingCooldown: "0"
      };
    }
  };

  const getVoteStakeInfo = async (
    userAddr: string,
    daoId: string,
    suiClient: SuiClient
  ): Promise<VoteStakeInfo> => {
    try {
      const client = await initClient(userAddr, daoId);
      const participant = await client.participant;

      if (!participant) {
        throw new Error("Failed to fetch participant data");
      }

      // Get coin decimals
      const simplifiedAssetType = getSimplifiedAssetType(participant.assetType);
      const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
      const divisor = BigInt(10) ** BigInt(decimals);

      let lockedInVotesValue = BigInt(0);
      let retrievableVotesValue = BigInt(0);

      // Process votes array if it exists
      if (participant.votes && Array.isArray(participant.votes)) {
        const now = Date.now();
        participant.votes.forEach((vote: any) => {
          if (vote.daoAddr === daoId && vote.staked?.value) {
            const voteEndTime = Number(vote.voteEnd || 0);
            if (now > voteEndTime) {
              retrievableVotesValue += BigInt(vote.staked.value);
            } else {
              lockedInVotesValue += BigInt(vote.staked.value);
            }
          }
        });
      }

      // Format values with decimals
      const lockedInVotes = Number(lockedInVotesValue) / Number(divisor);
      const retrievableVotes = Number(retrievableVotesValue) / Number(divisor);

      return {
        lockedInVotes: lockedInVotes.toFixed(2),
        retrievableVotes: retrievableVotes.toFixed(2)
      };
    } catch (error) {
      console.error("Error getting vote stake info:", error);
      return {
        lockedInVotes: "0.00",
        retrievableVotes: "0.00"
      };
    }
  };

  const getunverifiedDepsAllowedBool = async (
    userAddr: string,
    multisigId: string,
  ): Promise<boolean> => {
    try {
      const client = await initClient(userAddr, multisigId);
      const result = client.account.unverifiedDepsAllowed;
      return result;
    } catch (error) {
      console.error("Error getting boolean:", error);
      throw error;
    }
  };

  const getLockedObjects = async (userAddr: string, daoId: string): Promise<string[]> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.account.lockedObjects;
    } catch (error) {
      console.error("Error getting locked objects:", error);
      throw error;
    }
  };

  const getConfigDaoIntentChanges = async (
    userAddr: string,
    daoId: string,
    intentKey: string
  ): Promise<ConfigDaoChanges | null> => {
    try {
      // Get both the intent and current DAO data in parallel
      const [intent, dao] = await Promise.all([
        getIntent(userAddr, daoId, intentKey),
        getDao(userAddr, daoId)
      ]);

      if (!intent || !dao) {
        throw new Error("Failed to fetch intent or dao data");
      }

      const args = (intent as any).args;
      if (!args) {
        throw new Error("Intent args not found");
      }

      // Get coin decimals for proper value formatting
      const simplifiedAssetType = getSimplifiedAssetType(dao.assetType);
      const decimals = await getCoinDecimals(simplifiedAssetType, (intent as any).client?.provider);
      const divisor = BigInt(10) ** BigInt(decimals);

      // Helper function to format values with decimals
      const formatWithDecimals = (value: string | number | bigint | undefined): string => {
        if (value === undefined) return "0";
        const bigIntValue = BigInt(value.toString());
        return (Number(bigIntValue) / Number(divisor)).toString();
      };

      // Format the requested changes from the intent
      const requested = {
        assetType: args.assetType || "",
        authVotingPower: formatWithDecimals(args.authVotingPower),
        maxVotingPower: formatWithDecimals(args.maxVotingPower),
        minimumVotes: formatWithDecimals(args.minimumVotes),
        unstakingCooldown: args.unstakingCooldown?.toString() || "0",
        votingQuorum: ((Number(args.votingQuorum || 0) / 1_000_000_000)).toString(),
        votingRule: Number(args.votingRule || 0)
      };

      // Format the current values from the DAO
      const current = {
        assetType: dao.assetType,
        authVotingPower: formatWithDecimals(dao.authVotingPower),
        maxVotingPower: formatWithDecimals(dao.maxVotingPower),
        minimumVotes: formatWithDecimals(dao.minimumVotes),
        unstakingCooldown: dao.unstakingCooldown.toString(),
        votingQuorum: (Number(dao.votingQuorum) / 1_000_000_000).toString(),
        votingRule: dao.votingRule
      };

      return {
        requested,
        current
      };
    } catch (error) {
      console.error("Error getting config dao changes:", error);
      return null;
    }
  };

  const getAmountsFromWithdrawIntent = async (
    userAddr: string,
    daoId: string,
    intentKey: string
  ): Promise<WithdrawAmount[]> => {
    try {
      // Get both the intent and owned objects in parallel
      const [intent, ownedData] = await Promise.all([
        getIntent(userAddr, daoId, intentKey),
        getOwnedObjects(userAddr, daoId)
      ]);

      if (!intent) {
        throw new Error("Failed to fetch intent");
      }

      const transfers = (intent as any).args?.transfers || [];
      const amounts: WithdrawAmount[] = [];

      // Process each transfer
      for (const transfer of transfers) {
        const objectId = transfer.objectId;
        const recipient = transfer.recipient;

        // Look through coins to find matching object ID
        for (const coin of ownedData.coins) {
          for (const instance of coin.instances) {
            if (instance.ref.objectId === objectId) {
              // Get coin decimals for proper formatting
              const simplifiedAssetType = getSimplifiedAssetType(coin.type);
              const decimals = await getCoinDecimals(simplifiedAssetType, (intent as any).client?.provider);
              const divisor = BigInt(10) ** BigInt(decimals);

              // Format amount with correct decimals
              const rawAmount = BigInt(instance.amount);
              const formattedAmount = (Number(rawAmount) / Number(divisor)).toString();

              amounts.push({
                amount: formattedAmount,
                coinType: coin.type,
                recipient
              });
            }
          }
        }
      }

      return amounts;
    } catch (error) {
      console.error("Error getting withdraw amounts:", error);
      return [];
    }
  };

  const getVaults = async (userAddr: string, daoId: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.getVaults();
    } catch (error) {
      console.error("Error getting vault:", error);
      throw error;
    }
  };

  //====================ACTIONS====================

  const authenticate = async (tx: Transaction, daoId: string, userAddr: string) => {
    try {
      const client = await initClient(userAddr, daoId);
      client.authenticate(tx);
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
      client.followDao(tx, daoId, username, profilePicture);
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
      client.unfollowDao(tx, daoId);
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
      client.stake(tx, assets);
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
      client.unstake(tx, assets);
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
      client.claim(tx);
      return tx;
    } catch (error) {
      console.error("Error claiming assets:", error);
      throw error;
    }
  };

  const retrieveVotes = async (
    userAddr: string,
    multisigId: string,
    tx: Transaction
  ) => {
    try {
      const client = await initClient(userAddr, multisigId);
      client.retrieveVotes(tx);
      return tx;
    } catch (error) {
      console.error("Error retrieving votes:", error);
      throw error;
    }
  };

  const execute = async (
    userAddr: string,
    multisigId: string,
    tx: Transaction,
    intentKey: string
  ): Promise<TransactionResult | void> => {
    try {
      const client = await initClient(userAddr, multisigId);
      const result = client.execute(tx, intentKey);
      return result;
    } catch (error) {
      console.error("Error executing intent:", error);
      throw error;
    }
  };

  const deleteIntent = async (
    userAddr: string,
    multisigId: string,
    tx: Transaction,
    intentKey: string
  ) => {
    try {
      const client = await initClient(userAddr, multisigId);
      const result = client.delete(tx, intentKey);
      return result;
    } catch (error) {
      console.error("Error deleting intent:", error);
      throw error;
    }
  };

  const vote = async (
    userAddr: string,
    multisigId: string,
    tx: Transaction,
    intentKey: string,
    answer: "no" | "yes" | "abstain"
  ) => {
    try {
      const client = await initClient(userAddr, multisigId);
      const result = client.vote(tx, intentKey, answer);
      return result;
    } catch (error) {
      console.error("Error voting on intent:", error);
      throw error;
    }
  };

  const changeVote = async (
    userAddr: string,
    multisigId: string,
    tx: Transaction,
    intentKey: string,
    answer: "no" | "yes" | "abstain"
  ) => {
    try {
      const client = await initClient(userAddr, multisigId);
      const result = client.changeVote(tx, intentKey, answer);
      return result;
    } catch (error) {
      console.error("Error changing vote:", error);
      throw error;
    }
  };

  const modifyMetadata = async (
    tx: Transaction,
    userAddr: string,
    daoId: string,
    name: string,
    description: string,
    image: string,
    twitter: string,
    telegram: string,
    discord: string,
    github: string,
    website: string
  ) => {
    try {
      const client = await initClient(userAddr, daoId);
      client.modifyMetadata(tx, name, description, image, twitter, telegram, discord, github, website);
      return tx;
    } catch (error) {
      console.error("Error modifying metadata:", error);
      throw error;
    }
  };

  const updateVerifiedDeps = async (userAddr: string, daoId: string, tx: Transaction) => {
    try {
      const client = await initClient(userAddr, daoId);
      client.updateVerifiedDeps(tx);
      return tx;
    } catch (error) {
      console.error("Error updating verified dependencies:", error);
      throw error;
    }
  };

  const openVault = async (
    userAddr: string,
    daoId: string,
    tx: Transaction,
    treasuryName: string
  ): Promise<TransactionResult> => {
    try {
      const client = await initClient(userAddr, daoId);
      return client.openVault(tx, treasuryName) as unknown as TransactionResult;
    } catch (error) {
      console.error("Error opening vault:", error);
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
      client.requestConfigDao(
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
      client.requestToggleUnverifiedDepsAllowed(tx, intentArgs);
      return tx;
    } catch (error) {
      console.error("Error requesting toggle unverified deps:", error);
      throw error;
    }
  };

  const requestWithdrawAndTransfer = async (
    userAddr: string,
    daoId: string,
    tx: Transaction,
    intentArgs: VoteIntentArgs,
    coins: {
      coinType: string;
      coinAmount: bigint;
    }[],
    objectIds: string[],
    recipient: string
  ): Promise<TransactionResult> => {
    try {
      const client = await initClient(userAddr, daoId);
      return (await client.requestWithdrawAndTransfer(
        tx,
        intentArgs,
        coins,
        objectIds,
        recipient
      )) as unknown as TransactionResult;
    } catch (error) {
      console.error("Error requesting withdraw and transfer:", error);
      throw error;
    }
  };

  return {
    // CORE
    initDaoClient,
    createDao,
    // GETTERS
    getUser,
    getUserDaos,
    getAllDaos,
    getDao,
    getIntents,
    getIntent,
    getDaoMetadata,
    getParticipant,
    getOwnedObjects,
    getDaoDeps,
    getVerifiedDeps,
    getUnverifiedDeps,
    getDepsStatus,
    getIntentStatus,
    getDaoVotingPowerInfo,
    getVoteStakeInfo,
    getunverifiedDepsAllowedBool,
    getLockedObjects,
    getConfigDaoIntentChanges,
    getAmountsFromWithdrawIntent,
    getVaults,
    // ACTIONS
    authenticate,
    followDao,
    unfollowDao,
    stake,
    unstake,
    claim,
    retrieveVotes,
    execute,
    deleteIntent,
    vote,
    changeVote,
    modifyMetadata,
    updateVerifiedDeps,
    openVault,
    // DAO INTENTS
    requestWithdrawAndTransfer,
    requestConfigDao,
    requestToggleUnverifiedDepsAllowed,
  };
}