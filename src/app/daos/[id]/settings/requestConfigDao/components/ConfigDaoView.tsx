'use client';

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoConfigFormData } from '../helpers/types';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { ConfigProposalStep } from "@/components/CommonProposalSteps/ConfigProposalStep";
import { useDaoClient } from "@/hooks/useDaoClient";
import { AssetTypeStep } from './AssetTypeStep';
import { AuthVotingPowerStep } from './AuthVotingPowerStep';
import { UnstakingCooldownStep } from './UnstakingCooldownStep';
import { VotingRuleStep } from './VotingRuleStep';
import { VotingLimitsStep } from './VotingLimitsStep';
import { VotingQuorumStep } from './VotingQuorumStep';
import { DaoConfigProvider } from '../context/DaoConfigContext';
import Loading from '../loading';

const ConfigDaoView = () => {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getDao } = useDaoClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<DaoConfigFormData | null>(null);
  const [formData, setFormData] = useState<DaoConfigFormData>({
    // Initialize with empty values
    proposalName: '',
    proposalDescription: '',
    executionDate: new Date(),
    expirationDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
    assetType: '',
    authVotingPower: BigInt(0),
    unstakingCooldown: BigInt(0),
    votingRule: 0,
    maxVotingPower: BigInt(0),
    minimumVotes: BigInt(0),
    votingQuorum: BigInt(0)
  });

  useEffect(() => {
    const initDaoData = async () => {
      if (!currentAccount?.address || !daoId) return;

      try {
        setIsLoading(true);
        const daoParams = await getDao(currentAccount.address, daoId);
        
        if (!daoParams) {
          throw new Error("Failed to fetch dao data");
        }

        // Convert string numbers to BigInt where needed
        const updatedFormData = {
          ...formData,
          assetType: daoParams.assetType,
          authVotingPower: BigInt(daoParams.authVotingPower.toString().replace('n', '')),
          unstakingCooldown: BigInt(daoParams.unstakingCooldown.toString().replace('n', '')),
          votingRule: Number(daoParams.votingRule),
          maxVotingPower: BigInt(daoParams.maxVotingPower.toString().replace('n', '')),
          minimumVotes: BigInt(daoParams.minimumVotes.toString().replace('n', '')),
          votingQuorum: BigInt(daoParams.votingQuorum.toString().replace('n', ''))
        };

        setFormData(updatedFormData);
        setOriginalConfig(updatedFormData);

      } catch (error) {
        console.error("Error initializing dao data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initDaoData();
  }, [currentAccount?.address, daoId]);

  const updateFormData = (updates: Partial<DaoConfigFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleComplete = () => {
    setIsCompleted(true);
  };

  const steps = [
    {
      title: "Config Proposal",
      description: "Configure your proposal details",
      component: (
        <ConfigProposalStep<DaoConfigFormData> 
          formData={formData} 
          updateFormData={updateFormData} 
        />
      )
    },
    {
      title: "Asset Type",
      description: "Modify the DAO's asset type",
      component: (
        <AssetTypeStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Auth Voting Power",
      description: "Modify the minimum voting power required for key actions",
      component: (
        <AuthVotingPowerStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Voting Rule",
      description: "Change how voting power is calculated from token holdings",
      component: (
        <VotingRuleStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Voting Limits",
      description: "Set maximum voting power and minimum votes thresholds",
      component: (
        <VotingLimitsStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Approval Threshold",
      description: "Set the percentage of 'Yes' votes required for proposals to pass",
      component: (
        <VotingQuorumStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Unstaking Cooldown",
      description: "Modify the waiting period for unstaking tokens",
      component: (
        <UnstakingCooldownStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
  ];

  if (!currentAccount) {
    return (
      <div className="h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
            <p className="text-gray-600">You need to connect your wallet to configure the DAO.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !originalConfig) {
    return (
      <Loading />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
      <div className="container mx-auto py-32 px-4">
        <DaoConfigProvider originalConfig={originalConfig}>
          <SteppedProgress<DaoConfigFormData>
            steps={steps}
            onComplete={handleComplete}
            isLoading={isLoading}
            isCompleted={isCompleted}
            formData={formData}
            validateStep={() => true} // We'll implement proper validation later
          />
        </DaoConfigProvider>
      </div>
    </div>
  );
};

export default ConfigDaoView; 