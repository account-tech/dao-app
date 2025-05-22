'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { CoinMeta } from '@polymedia/suitcase-core';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { AssetSelectionStep } from './AssetSelectionStep';
import { RecipientStep } from './RecipientStep';
import { RecapStep } from './RecapStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { WithdrawFormData, CoinSelection, ObjectSelection } from '../helpers/types';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from '@/hooks/useDaoClient';
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';

const WithdrawAndTransferView = () => {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { requestWithdrawAndTransfer } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [formData, setFormData] = useState<WithdrawFormData>({
    selectedCoins: [] as CoinSelection[],
    selectedObjects: [] as ObjectSelection[],
    recipientAddress: '',
    proposalName: '',
    proposalDescription: '',
    votingStartDate: new Date(),
    votingEndDate: new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)), // 3 days for voting
    executionDate: new Date(Date.now() + (4 * 24 * 60 * 60 * 1000)), // 1 day after voting ends
    expirationDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days total
  });

  const updateFormData = (updates: Partial<WithdrawFormData>) => {
    setFormData((prev: WithdrawFormData) => ({ ...prev, ...updates }));
  };

  const handleWithdrawAndTransfer = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    try {
      setIsSubmitting(true);
      const tx = new Transaction();

      // Convert dates to BigInt timestamps
      const startTime = BigInt(formData.votingStartDate.getTime());
      const votingEndTime = BigInt(formData.votingEndDate.getTime());
      const proposalExecutionTime = BigInt(formData.executionDate.getTime());
      const expirationTime = BigInt(formData.expirationDate.getTime());

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

      // Prepare coins array for the request
      const coins = formData.selectedCoins.map(coin => ({
        coinType: coin.coinType,
        coinAmount: BigInt(Math.round(coin.amount * Math.pow(10, 9))) // Convert to base units with 9 decimals
      }));

      // Get object IDs array
      const objectIds = formData.selectedObjects.map(obj => obj.objectId);

      await requestWithdrawAndTransfer(
        currentAccount.address,
        daoId,
        tx,
        intentArgs,
        coins,
        objectIds,
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
            <p className="text-gray-600">You need to connect your wallet to withdraw and transfer assets.</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: "Select Assets",
      description: "Choose coins and objects/NFTs",
      component: (
        <AssetSelectionStep
          selectedCoins={formData.selectedCoins}
          selectedObjects={formData.selectedObjects}
          onCoinsSelected={(coins: CoinSelection[]) => updateFormData({ selectedCoins: coins })}
          onObjectsSelected={(objects: ObjectSelection[]) => updateFormData({ selectedObjects: objects })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
        />
      )
    },
    {
      title: "Add Recipient",
      description: "Enter the recipient address",
      component: (
        <RecipientStep
          recipientAddress={formData.recipientAddress}
          onRecipientAddressUpdated={(address: string) => updateFormData({ recipientAddress: address })}
        />
      )
    },
    {
      title: "Proposal Details",
      description: "Set proposal name, description, and timing",
      component: (
        <ConfigProposalStep
          formData={formData}
          updateFormData={updateFormData}
        />
      )
    },
    {
      title: "Review Changes",
      description: "Review all withdrawal details before submitting",
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
          onComplete={handleWithdrawAndTransfer}
          isLoading={isSubmitting}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default WithdrawAndTransferView; 