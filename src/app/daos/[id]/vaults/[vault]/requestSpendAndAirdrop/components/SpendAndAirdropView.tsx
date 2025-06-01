'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import { CoinMeta } from '@polymedia/suitcase-core';
import SteppedProgress from '@/components/CommonProposalSteps/Stepper';
import { AirDropSelectionStep } from './AirdropSelectionStep';
import { CsvPreviewStep } from './CsvPreviewStep';
import { RecipientStep } from './RecipientStep';
import { ConfigProposalStep } from '@/components/CommonProposalSteps/ConfigProposalStep';
import { WithdrawFormData, CoinSelection, Recipient } from '../helpers/types';
import { validateStep } from '../helpers/validation';
import { useDaoClient } from "@/hooks/useDaoClient";
import { signAndExecute, handleTxResult } from '@/utils/tx/Tx';
import { useDaoStore } from '@/store/useDaoStore';
import { getMultipleCoinDecimals } from "@/utils/GlobalHelpers";

const SpendAndAirdropView = () => {
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
  const { requestSpendAndTransfer } = useDaoClient();
  const { refreshClient } = useDaoStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [coinMetas, setCoinMetas] = useState<Map<string, CoinMeta>>(new Map());
  const [isCSVUpload, setIsCSVUpload] = useState(false);
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

  const handleSpendAndAirdrop = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.proposalName) {
      toast.error("Please fill in the proposal name");
      return;
    }

    if (formData.selectedCoins.length === 0) {
      toast.error("Please select a coin to airdrop");
      return;
    }

    if (formData.recipients.length === 0) {
      toast.error("Please add recipients for the airdrop");
      return;
    }

    if (!formData.votingStartDate || !formData.votingEndDate || !formData.executionDate) {
      toast.error("Please set all required dates");
      return;
    }

    try {
      setIsSubmitting(true);
      const tx = new Transaction();
      
      const selectedCoin = formData.selectedCoins[0];
      const coinType = selectedCoin.coinType.startsWith('0x') ? selectedCoin.coinType : `0x${selectedCoin.coinType}`;
      
      // Get coin decimals using our optimized helper
      const decimalsMap = await getMultipleCoinDecimals([coinType], suiClient);
      const decimals = decimalsMap.get(coinType) ?? 9;
      
      // Convert dates to BigInt timestamps
      const startTime = BigInt(formData.votingStartDate.getTime());
      const votingEndTime = BigInt(formData.votingEndDate.getTime());
      const proposalExecutionTime = BigInt(formData.executionDate.getTime());
      const expirationTime = BigInt(formData.expirationDate?.getTime() || formData.votingEndDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Prepare transfers
      const transfers = formData.recipients.map(recipient => ({
        amount: BigInt(Math.round(recipient.amount * Math.pow(10, decimals))),
        recipient: recipient.address
      }));

      // Prepare intent arguments
      const intentArgs = {
        key: formData.proposalName,
        description: formData.proposalDescription,
        executionTimes: [proposalExecutionTime],
        expirationTime: expirationTime,
        startTime: startTime,
        endTime: votingEndTime
      };

      await requestSpendAndTransfer(
        currentAccount.address,
        daoId,
        tx,
        intentArgs,
        vaultName, // treasury name
        coinType,
        transfers
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
      
      // Navigate back after a short delay
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
      title: "Add recipients",
      description: "Enter recipient addresses for the airdrop, either manually or by uploading a CSV file",
      component: (
        <RecipientStep
          recipients={formData.recipients}
          onRecipientsUpdated={(recipients) => {
            updateFormData({ recipients });
            // Set isCSVUpload based on whether amounts are present in the recipients
            setIsCSVUpload(recipients.some(r => r.amount > 0));
          }}
        />
      )
    },
    {
      title: isCSVUpload ? "Preview CSV" : "Select coins",
      description: isCSVUpload 
        ? "Review your CSV data and select the coin type"
        : "Select the coins you want to airdrop",
      component: isCSVUpload ? (
        <CsvPreviewStep
          selectedCoins={formData.selectedCoins}
          onCoinsSelected={(coins) => updateFormData({ selectedCoins: coins })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
          recipients={formData.recipients}
        />
      ) : (
        <AirDropSelectionStep
          selectedCoins={formData.selectedCoins}
          onCoinsSelected={(coins) => updateFormData({ selectedCoins: coins })}
          coinMetas={coinMetas}
          setCoinMetas={setCoinMetas}
          recipients={formData.recipients}
          onRecipientsUpdated={(recipients) => updateFormData({ recipients })}
        />
      )
    },
    {
      title: "Configure proposal",
      description: "Configure the proposal details",
      component: (
        <ConfigProposalStep formData={formData} updateFormData={updateFormData} />
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-80% to-teal-200">
      <div className="container mx-auto py-32 px-4">
        <SteppedProgress<WithdrawFormData>
          steps={steps}
          onComplete={handleSpendAndAirdrop}
          isLoading={isSubmitting}
          isCompleted={isCompleted}
          formData={formData}
          validateStep={validateStep}
        />
      </div>
    </div>
  );
};

export default SpendAndAirdropView; 