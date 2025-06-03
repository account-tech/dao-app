'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { CoinMeta } from '@polymedia/suitcase-core';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { CoinSelectionStep } from './CoinSelectionStep';
import { RecipientStep } from './RecipientStep';
import { RecapStep } from './RecapStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { WithdrawFormData, CoinSelection, Recipient } from '../helpers/types';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from '@/hooks/useDaoClient';
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';
import { getCoinDecimals, getSimplifiedAssetType } from '@/utils/GlobalHelpers';

const SpendAndTransferView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const vaultName = params.vault as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestSpendAndTransfer } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [formData, setFormData] = useState<WithdrawFormData>({
    selectedCoins: [] as CoinSelection[],
    recipients: [] as Recipient[],
    proposalName: '',
    proposalDescription: '',
    votingStartDate: null,
    votingEndDate: null,
    executionDate: null,
    expirationDate: null,
  });

  const updateFormData = (updates: Partial<WithdrawFormData>) => {
    setFormData((prev: WithdrawFormData) => ({ ...prev, ...updates }));
  };

  const handleSpendAndTransfer = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    if (formData.selectedCoins.length === 0) {
      toast.error("Please select coins to transfer");
      return;
    }

    if (formData.recipients.length === 0) {
      toast.error("Please add at least one recipient");
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

      // Process each coin and recipient combination
      for (const coin of formData.selectedCoins) {
        const simplifiedAssetType = getSimplifiedAssetType(coin.coinType);
        const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
        
        // Prepare transfers array for this coin
        const transfers = formData.recipients.map(recipient => ({
          amount: BigInt(Math.round(Number(recipient.amount) * Math.pow(10, decimals))),
          recipient: recipient.address
        }));

        await requestSpendAndTransfer(
          currentAccount.address,
          daoId,
          tx,
          intentArgs,
          vaultName, // treasury name
          coin.coinType,
          transfers
        );
      }

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
          <p className="text-gray-600">You need to connect your wallet to withdraw and transfer coins.</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Select a Coin",
      description: "Choose the coin you want to transfer",
      component: (
        <CoinSelectionStep
          selectedCoins={formData.selectedCoins}
          onCoinsSelected={(coins: CoinSelection[]) => updateFormData({ selectedCoins: coins })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
        />
      )
    },
    {
      title: "Add a Recipient",
      description: "Enter recipient address for the transfer",
      component: (
        <RecipientStep
          selectedCoins={formData.selectedCoins}
          recipients={formData.recipients}
          onRecipientsUpdated={(recipients: Recipient[]) => updateFormData({ recipients })}
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
          onComplete={handleSpendAndTransfer}
          isLoading={isSubmitting}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default SpendAndTransferView; 