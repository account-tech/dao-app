'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { AddDependencyStep } from './AddDependencyStep';
import { RecapStep } from './RecapStep';
import { DependencyConfigFormData } from '../helpers/types';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { Dep } from '@account.tech/core';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from '@/hooks/useDaoClient';
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';

const DependencyConfigView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestConfigDeps } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentDeps, setCurrentDeps] = useState<Dep[]>([]);
  const [formData, setFormData] = useState<DependencyConfigFormData>({
    proposalName: '',
    proposalDescription: '',
    votingStartDate: null,
    votingEndDate: null,
    executionDate: null,
    expirationDate: null,
    selectedDeps: [],
    removedDeps: [],
    currentDeps: []
  });

  const updateFormData = (updates: Partial<DependencyConfigFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleConfigDeps = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    try {
      setIsLoading(true);
      const tx = new Transaction();

      // Validate all required dates are set
      if (!formData.votingStartDate || !formData.votingEndDate || !formData.executionDate) {
        toast.error("Please set all required dates");
        return;
      }

      // Convert dates to BigInt timestamps
      const startTime = BigInt(formData.votingStartDate.getTime());
      const votingEndTime = BigInt(formData.votingEndDate.getTime());
      const proposalExecutionTime = BigInt(formData.executionDate.getTime());
      const expirationTime = BigInt(formData.expirationDate?.getTime() || formData.votingEndDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const intentArgs = {
        key: formData.proposalName,
        description: formData.proposalDescription,
        executionTimes: [proposalExecutionTime],
        expirationTime: expirationTime,
        startTime: startTime,
        endTime: votingEndTime
      };

      // Convert selected dependencies to Dep objects
      const deps: Dep[] = formData.selectedDeps.map(depString => {
        const [name, addr, version] = depString.split(':');
        return {
          name,
          addr,
          version: Number(version)
        };
      });

      await requestConfigDeps(
        currentAccount.address,
        daoId,
        tx,
        intentArgs,
        deps
      );

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);

      refreshClient();

      setIsCompleted(true);

      setTimeout(() => {
        router.push(`/daos/${daoId}`);
      }, 500);
    } catch (error) {
      setIsCompleted(false);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      title: "Manage Dependencies",
      description: "Select dependencies to configure",
      component: (
        <AddDependencyStep 
          formData={formData} 
          updateFormData={updateFormData}
          currentDeps={currentDeps}
        />
      )
    },
    {
      title: "Proposal Details",
      description: "Configure your proposal details",
      component: (
        <ConfigProposalStep 
          formData={formData} 
          updateFormData={updateFormData} 
        />
      )
    },
    {
      title: "Recap",
      description: "Review your proposal",
      component: (
        <RecapStep 
          formData={formData} 
          updateFormData={updateFormData}
        />
      )
    },
  ];

  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
          <p className="text-gray-600">You need to connect your wallet to configure dependencies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
      <div className="container mx-auto py-32 px-4">
        <SteppedProgress<DependencyConfigFormData>
          steps={steps}
          onComplete={handleConfigDeps}
          isLoading={isLoading}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default DependencyConfigView; 