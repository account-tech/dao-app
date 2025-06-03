'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { CoinMeta } from '@polymedia/suitcase-core';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { CoinAndDatesSelectionStep } from './CoinAndDatesSelectionStep';
import { RecipientStep } from './RecipientStep';
import { RecapStep } from './RecapStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { VestingFormData, CoinSelection } from '../helpers/types';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from '@/hooks/useDaoClient';
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';
import { getCoinDecimals, getSimplifiedAssetType } from '@/utils/GlobalHelpers';

const WithdrawAndVestView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestWithdrawAndVest } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [formData, setFormData] = useState<VestingFormData>({
    selectedCoins: [] as CoinSelection[],
    recipientAddress: '',
    proposalName: '',
    proposalDescription: '',
    vestingStartDate: null,
    vestingEndDate: null,
    votingStartDate: null,
    votingEndDate: null,
    executionDate: null,
    expirationDate: null,
  });

  const updateFormData = (updates: Partial<VestingFormData>) => {
    setFormData((prev: VestingFormData) => ({ ...prev, ...updates }));
  };

  const handleWithdrawAndVest = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    if (!formData.selectedCoins.length || !formData.selectedCoins[0].amount) {
      toast.error("Please select a coin and amount");
      return;
    }

    if (!formData.recipientAddress) {
      toast.error("Please enter a recipient address");
      return;
    }

    try {
      setIsSubmitting(true);
      const tx = new Transaction();

      // Validate all required dates are set
      if (!formData.votingStartDate || !formData.votingEndDate || !formData.executionDate) {
        toast.error("Please set all required voting dates");
        return;
      }

      if (!formData.vestingStartDate || !formData.vestingEndDate) {
        toast.error("Please set vesting start and end dates");
        return;
      }

      // Convert dates to BigInt timestamps
      const startTime = BigInt(formData.votingStartDate.getTime());
      const votingEndTime = BigInt(formData.votingEndDate.getTime());
      const proposalExecutionTime = BigInt(formData.executionDate.getTime());
      const expirationTime = BigInt(formData.expirationDate?.getTime() || formData.votingEndDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const vestingStartTime = BigInt(formData.vestingStartDate.getTime());
      const vestingEndTime = BigInt(formData.vestingEndDate.getTime());

      const intentArgs = {
        key: formData.proposalName,
        description: formData.proposalDescription,
        executionTimes: [proposalExecutionTime],
        expirationTime: expirationTime,
        startTime: startTime,
        endTime: votingEndTime
      };

      // Prepare coin data with correct decimals
      const coin = formData.selectedCoins[0];
      const simplifiedAssetType = getSimplifiedAssetType(coin.coinType);
      const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
      const baseUnitAmount = BigInt(Math.round(Number(coin.amount) * Math.pow(10, decimals)));

      await requestWithdrawAndVest(
        currentAccount.address,
        daoId,
        tx,
        intentArgs,
        coin.coinType,
        baseUnitAmount,
        vestingStartTime,
        vestingEndTime,
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
        router.push(`/daos/${daoId}`);
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Connect Your Wallet</h1>
            <p className="text-gray-600">You need to connect your wallet to set up vesting.</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Select Coin & Vesting Period",
      description: "Choose the coin and set vesting dates",
      component: (
        <CoinAndDatesSelectionStep
          selectedCoins={formData.selectedCoins}
          onCoinsSelected={(coins: CoinSelection[]) => updateFormData({ selectedCoins: coins })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
          vestingParams={{
            startDate: formData.vestingStartDate || new Date(),
            endDate: formData.vestingEndDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
          }}
          onVestingParamsChange={(params) => updateFormData({
            vestingStartDate: params.startDate,
            vestingEndDate: params.endDate
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
      description: "Set the proposal details and voting timing",
      component: (
        <ConfigProposalStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Review Changes",
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
          onComplete={handleWithdrawAndVest}
          isLoading={isSubmitting}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default WithdrawAndVestView; 