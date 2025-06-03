'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { CoinMeta } from '@polymedia/suitcase-core';
import { format } from 'date-fns';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { CoinAndDatesSelectionStep } from './CoinAndDatesSelectionStep';
import { RecipientStep } from './RecipientStep';
import { RecapStep } from './RecapStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { CoinSelection, VestingFormData } from '../helpers/types';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from '@/hooks/useDaoClient';
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';
import { getCoinDecimals, getSimplifiedAssetType } from '@/utils/GlobalHelpers';


const SpendAndVestView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const vaultName = typeof params.vault === 'string' 
    ? decodeURIComponent(params.vault) 
    : Array.isArray(params.vault) 
    ? decodeURIComponent(params.vault[0]) 
    : '';
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestSpendAndVest } = useDaoClient();
  const { refreshClient } = useDaoStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [formData, setFormData] = useState<VestingFormData>({
    selectedCoins: [],
    recipientAddress: '',
    proposalName: '',
    proposalDescription: '',
    vestingStartDate: new Date(),
    vestingStartTime: format(new Date(), 'HH:mm'),
    vestingEndDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days default vesting period
    vestingEndTime: format(new Date(), 'HH:mm'),
    votingStartDate: null,
    votingEndDate: null,
    executionDate: null,
    expirationDate: null,
  });

  const updateFormData = (updates: Partial<VestingFormData>) => {
    setFormData((prev: VestingFormData) => ({ ...prev, ...updates }));
  };

  const handleSpendAndVest = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    if (formData.selectedCoins.length === 0) {
      toast.error("Please select a coin to vest");
      return;
    }

    if (!formData.recipientAddress) {
      toast.error("Please enter a recipient address");
      return;
    }

    if (!formData.votingStartDate || !formData.votingEndDate || !formData.executionDate) {
      toast.error("Please set all required dates");
      return;
    }

    try {
      setIsSubmitting(true);
      const tx = new Transaction();

      // Convert dates to BigInt timestamps
      const startTime = BigInt(formData.votingStartDate.getTime());
      const votingEndTime = BigInt(formData.votingEndDate.getTime());
      const proposalExecutionTime = BigInt(formData.executionDate.getTime());
      const expirationTime = BigInt(formData.expirationDate?.getTime() || formData.votingEndDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Convert vesting dates to BigInt timestamps
      const vestingStart = BigInt(formData.vestingStartDate.getTime());
      const vestingEnd = BigInt(formData.vestingEndDate.getTime());

      const intentArgs = {
        key: formData.proposalName,
        description: formData.proposalDescription,
        executionTimes: [proposalExecutionTime],
        expirationTime: expirationTime,
        startTime: startTime,
        endTime: votingEndTime
      };

      // Process the selected coin
      const coin = formData.selectedCoins[0];
      const simplifiedAssetType = getSimplifiedAssetType(coin.coinType);
      const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
      
      // Convert amount to base units (with decimals)
      const baseAmount = BigInt(Math.round(Number(coin.amount) * Math.pow(10, decimals)));

      await requestSpendAndVest(
        currentAccount.address,
        daoId,
        tx,
        intentArgs,
        vaultName, // treasury name
        coin.coinType,
        baseAmount,
        vestingStart,
        vestingEnd,
        formData.recipientAddress
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
          <p className="text-gray-600">You need to connect your wallet to set up vesting.</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Select a Coin",
      description: "Choose the coin you want to vest",
      component: (
        <CoinAndDatesSelectionStep
          selectedCoins={formData.selectedCoins}
          onCoinsSelected={(coins: CoinSelection[]) => updateFormData({ selectedCoins: coins })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
          vestingParams={{
            startDate: formData.vestingStartDate,
            startTime: formData.vestingStartTime,
            endDate: formData.vestingEndDate,
            endTime: formData.vestingEndTime
          }}
          onVestingParamsChange={(params) => updateFormData({
            vestingStartDate: params.startDate,
            vestingStartTime: params.startTime,
            vestingEndDate: params.endDate,
            vestingEndTime: params.endTime
          })}
        />
      )
    },
    {
      title: "Add Recipient",
      description: "Enter the recipient address for vesting",
      component: (
        <RecipientStep
          recipientAddress={formData.recipientAddress}
          onRecipientAddressChange={(address: string) => updateFormData({ recipientAddress: address })}
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
      description: "Review all vesting details before submitting",
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
        <SteppedProgress<VestingFormData>
          steps={steps}
          onComplete={handleSpendAndVest}
          isLoading={isSubmitting}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default SpendAndVestView; 