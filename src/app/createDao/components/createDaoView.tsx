"use client";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import {
  useSuiClient,
  useCurrentAccount,
  useSignTransaction,
} from "@mysten/dapp-kit";
import { toast } from "sonner"
import { DaoFormData } from "../helpers/types";
import SteppedProgress from "./Stepper";
import { SelectTypeOfDaoStep } from "./SelectTypeOfDaoStep";
import { BasicInfoStep } from "./BasicInfoStep";
import { VotingPowerStep } from "./VotingPowerStep";
import { UnstakingCooldownStep } from "./UnstakingCooldownStep";
import { VotingRuleStep } from "./VotingRuleStep";
import { VotingQuorumStep } from "./VotingQuorumStep";
import { VotingLimitsStep } from "./VotingLimitsStep";
import { RecapStep } from "./RecapStep";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useRouter } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { CreateDaoParams } from "@/types/dao";

const DEFAULT_VOTING_POWER = BigInt(1000000); // 1M voting power
const DEFAULT_COOLDOWN = BigInt(86400); // 24 hours in seconds
const DEFAULT_QUORUM = BigInt(500000); // 50% of max voting power
const DEFAULT_MIN_VOTES = BigInt(100000); // 10% of max voting power

const CreateDaoView = () => {
  const router = useRouter();
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const signTransaction = useSignTransaction();
  const { createDao } = useDaoClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [formData, setFormData] = useState<DaoFormData>({
    daoType: 'coin',
    coinType: '',
    // Initialize DAO specific fields with defaults
    assetType: '',
    authVotingPower: DEFAULT_VOTING_POWER,
    unstakingCooldown: DEFAULT_COOLDOWN,
    votingRule: 0, // Simple majority
    maxVotingPower: DEFAULT_VOTING_POWER,
    minimumVotes: DEFAULT_MIN_VOTES,
    votingQuorum: DEFAULT_QUORUM,
    name: '',
    description: '',
    image: '',
    twitter: '',
    telegram: '',
    discord: '',
    github: '',
    website: '',
  });

  const updateFormData = (updates: Partial<DaoFormData>) => {
    setFormData(current => ({
      ...current,
      ...updates
    }));
  };

  const handleCreateDao = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.coinType && formData.daoType === 'coin') {
      toast.error("Please enter a coin type");
      return;
    }

    setIsCreating(true);
    try {
      const tx = new Transaction();

      const daoParams: CreateDaoParams = {
        tx,
        assetType: formData.daoType === 'coin' ? formData.coinType! : '',
        authVotingPower: formData.authVotingPower,
        unstakingCooldown: formData.unstakingCooldown,
        votingRule: formData.votingRule,
        maxVotingPower: formData.maxVotingPower,
        minimumVotes: formData.minimumVotes,
        votingQuorum: formData.votingQuorum,
        name: formData.name,
        description: formData.description || formData.name,
        image: formData.image || '',
        twitter: formData.twitter || '',
        telegram: formData.telegram || '',
        discord: formData.discord || '',
        github: formData.github || '',
        website: formData.website || ''
      };

      await createDao(currentAccount.address, daoParams);

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);

      setIsCompleted(true);

      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      setIsCompleted(false);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const steps = [
    {
      title: "Select the type of DAO",
      description: "What type of DAO do you want to create?",
      component: <SelectTypeOfDaoStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Basic Information",
      description: "Set up your DAO's basic information and social networks",
      component: <BasicInfoStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Minimum Voting Power",
      description: "Set the minimum voting power to get admin permissions (e.g. create proposal, open vault, deposit asset, etc)",
      component: <VotingPowerStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Unstaking Cooldown",
      description: "Configure the unstaking cooldown period",
      component: <UnstakingCooldownStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Voting Rule",
      description: "Choose between linear and quadratic voting",
      component: <VotingRuleStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Voting Quorum",
      description: "Set the minimum participation required",
      component: <VotingQuorumStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Voting Limits",
      description: "Configure maximum voting power and minimum votes",
      component: <VotingLimitsStep formData={formData} updateFormData={updateFormData} />
    },
    {
      title: "Review",
      description: "Review your DAO configuration",
      component: <RecapStep formData={formData} updateFormData={updateFormData} />
    }
  ];

  if (!currentAccount) {
    return (
      <>
        <div className="h-screen bg-gradient-to-b from-white via-white via-60% to-pink-300">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
              <p className="text-gray-600">You need to connect your wallet to create a DAO.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white via-white via-60% to-pink-300">
        <div className="container mx-auto py-32 px-4">
          <SteppedProgress
            steps={steps}
            onComplete={handleCreateDao}
            isLoading={isCreating}
            isCompleted={isCompleted}
            formData={formData}
          />
        </div>
      </div>
    </>
  );
};

export default CreateDaoView;