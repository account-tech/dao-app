'use client';

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { CoinMeta } from '@polymedia/suitcase-core';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { AssetSelectionStep } from './AssetSelectionStep';
import { RecipientStep } from './RecipientStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { WithdrawFormData, CoinSelection, ObjectSelection } from '../helpers/types';
import { validateStep } from '../helpers/validation';

const WithdrawAndTransferView = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [formData, setFormData] = useState<WithdrawFormData>({
    selectedCoins: [] as CoinSelection[],
    selectedObjects: [] as ObjectSelection[],
    recipientAddress: '',
    proposalName: '',
    proposalDescription: '',
    executionDate: new Date(),
    expirationDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days in milliseconds
  });

  const currentAccount = useCurrentAccount();

  const updateFormData = (updates: Partial<WithdrawFormData>) => {
    setFormData((prev: WithdrawFormData) => ({ ...prev, ...updates }));
  };

  const handleWithdrawAndTransfer = async () => {
    // TODO: Implement handleSubmit
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
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-16 px-4">
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