'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { CoinMeta } from '@polymedia/suitcase-core';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { CoinSelectionStep } from './CoinSelectionStep';
import { RecapStep } from './RecapStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { WithdrawFormData } from '../helpers/types';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from '@/hooks/useDaoClient';
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';
import { getCoinDecimals, getSimplifiedAssetType } from '@/utils/GlobalHelpers';

const WithdrawAndTransferToVaultView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const vaultName = params.vault as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestWithdrawAndTransferToVault } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [formData, setFormData] = useState<WithdrawFormData>({
    selectedCoins: [],
    vaultName: vaultName,
    proposalName: '',
    proposalDescription: '',
    votingStartDate: null,
    votingEndDate: null,
    executionDate: null,
    expirationDate: null,
  });

  const updateFormData = (updates: Partial<WithdrawFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleWithdrawAndTransferToVault = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    if (formData.selectedCoins.length === 0) {
      toast.error("Please select a coin to transfer");
      return;
    }

    try {
      setIsSubmitting(true);
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

      // Get the first selected coin (vault transfers support single coin)
      const selectedCoin = formData.selectedCoins[0];
      const simplifiedAssetType = getSimplifiedAssetType(selectedCoin.type);
      const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
      
      // Convert human-readable amount to base units using the coin's specific decimals
      const baseUnitAmount = BigInt(Math.round(Number(selectedCoin.amount) * Math.pow(10, decimals)));

      await requestWithdrawAndTransferToVault(
        currentAccount.address,
        daoId,
        tx,
        intentArgs,
        selectedCoin.type,
        baseUnitAmount,
        vaultName
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
        router.push(`/daos/${daoId}/vaults/${vaultName}`);
      }, 500);
    } catch (error) {
      setIsCompleted(false);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
          <p className="text-gray-600">You need to connect your wallet to transfer coins to the vault.</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Select a Coin",
      description: "Choose the coin you want to transfer to the vault",
      component: (
        <CoinSelectionStep
          selectedCoins={formData.selectedCoins}
          onCoinsSelected={(coins) => updateFormData({ selectedCoins: coins })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
        />
      )
    },
    {
      title: "Proposal Details",
      description: "Set the proposal details and timing",
      component: (
        <ConfigProposalStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Review Request",
      description: "Review all transfer details before submitting",
      component: (
        <RecapStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
      <div className="container mx-auto py-32 px-4">
        <SteppedProgress<WithdrawFormData>
          steps={steps}
          onComplete={handleWithdrawAndTransferToVault}
          isLoading={isSubmitting}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default WithdrawAndTransferToVaultView; 