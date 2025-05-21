'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { ToggleUnverifiedFormData } from '../helpers/types';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { useDaoStore } from "@/store/useDaoStore";
import { validateStep } from '../helpers/validation';
import { useDaoClient } from "@/hooks/useDaoClient";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { RecapStep } from './RecapStep';

const ToggleUnverifiedDepsView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestToggleUnverifiedDepsAllowed } = useDaoClient();
  const { refreshClient, client } = useDaoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState<ToggleUnverifiedFormData>({
    proposalName: '',
    proposalDescription: '',
    votingStartDate: null,
    votingEndDate: null,
    executionDate: null,
    expirationDate: null,
    allowUnverifiedDeps: false
  });

  useEffect(() => {
    if (client?.account) {
      const currentStatus = client.account.unverifiedDepsAllowed;
      setFormData(prev => ({
        ...prev,
        allowUnverifiedDeps: !currentStatus // We want to toggle the current status
      }));
    }
  }, [client]);

  const updateFormData = (updates: Partial<ToggleUnverifiedFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleComplete = async () => {
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
        // IntentArgs fields
        key: formData.proposalName,
        description: formData.proposalDescription,
        executionTimes: [proposalExecutionTime], // When proposal can be executed
        expirationTime: expirationTime,    // When proposal expires if not executed
        
        // VoteIntentArgs fields
        startTime: startTime,           // When voting starts
        endTime: votingEndTime     // When voting ends
      };

      console.log(intentArgs);

      await requestToggleUnverifiedDepsAllowed(
        tx,
        currentAccount.address,
        intentArgs,
        daoId
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

  const validateStepWrapper = (stepIndex: number) => {
    return validateStep(stepIndex, formData);
  };

  const steps = [
    {
      title: "Config Proposal",
      description: "Configure your proposal details",
      component: (
        <ConfigProposalStep 
          formData={formData} 
          updateFormData={updateFormData} 
        />
      )
    },
    {
      title: "Review Changes",
      description: "Review all configuration changes before submitting",
      component: (
        <RecapStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    }
  ];

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
            <p className="text-gray-600">You need to connect your wallet to toggle unverified dependencies.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
      <div className="container mx-auto py-32 px-4">
        <SteppedProgress<ToggleUnverifiedFormData>
          steps={steps}
          onComplete={handleComplete}
          isLoading={isLoading}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStepWrapper}
        />
      </div>
    </div>
  );
};

export default ToggleUnverifiedDepsView; 