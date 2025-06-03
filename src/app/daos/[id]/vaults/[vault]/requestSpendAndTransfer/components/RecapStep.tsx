import React from 'react';
import { Check, AlertCircle, CalendarIcon, Wallet, ArrowRightLeft, Users } from "lucide-react";
import { useParams } from 'next/navigation';
import { WithdrawFormData, CoinSelection, Recipient } from '../helpers/types';

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatCoinType = (coinType: string) => {
  if (!coinType) return "Not set";
  const match = coinType.match(/::([^:]+)$/);
  return match ? match[1] : coinType;
};

interface RecapStepProps {
  formData: WithdrawFormData;
  updateFormData: (updates: Partial<WithdrawFormData>) => void;
}

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-sm border border-teal-100 p-4">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
      {title}
      {icon}
    </h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const InfoRow = ({ label, value, isDescription = false }: { 
  label: string, 
  value: any,
  isDescription?: boolean
}) => (
  <div className={`${isDescription ? 'block space-y-2' : 'grid grid-cols-2 gap-4'} py-2 border-b last:border-b-0 border-teal-50`}>
    <span className="text-gray-600 font-medium">{label}</span>
    {isDescription ? (
      <div className="w-full mt-1 p-3 rounded-md text-gray-900 whitespace-pre-wrap">
        {value}
      </div>
    ) : (
      <span className="text-gray-900">
        {label === "Type" ? formatCoinType(value) : value}
      </span>
    )}
  </div>
);

const formatAddress = (address: string) => {
  if (!address) return "Not set";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const RecapStep: React.FC<RecapStepProps> = ({ formData }) => {
  const params = useParams();
  const vaultName = params.vault as string;
  const hasSelectedCoins = formData.selectedCoins.length > 0 && formData.selectedCoins[0].coinType !== '';
  const hasRecipients = formData.recipients.length > 0 && formData.recipients[0].address !== '';

  const totalTransferAmount = formData.selectedCoins.reduce((total, coin) => total + coin.amount, 0);
  const totalRecipientAmount = formData.recipients.reduce((total, recipient) => total + recipient.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Spend & Transfer Request Summary
        </h2>
        <div className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full border border-gray-200">
          Final Review
        </div>
      </div>

      <div className="grid gap-6">
        <Section 
          title="Proposal Details"
          icon={formData.proposalName ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
        >
          <InfoRow 
            label="Name"
            value={formData.proposalName || "Not set"}
          />
          <InfoRow 
            label="Description"
            value={formData.proposalDescription || "Not set"}
            isDescription={true}
          />
        </Section>

        <Section 
          title="Transfer Details"
          icon={<ArrowRightLeft className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Source"
            value={`${vaultName} Vault`}
          />
          <InfoRow 
            label="Destination"
            value="External Addresses"
          />
          <InfoRow 
            label="Transfer Type"
            value="External Spend & Transfer"
          />
          <InfoRow 
            label="Total Amount"
            value={`${totalTransferAmount} tokens`}
          />
        </Section>

        <Section 
          title="Selected Coins"
          icon={<Wallet className="w-4 h-4 text-teal-500" />}
        >
          {hasSelectedCoins ? (
            formData.selectedCoins.map((coin: CoinSelection, index: number) => (
              <div key={index} className="pl-4 py-2 border-l-2 border-teal-100">
                <InfoRow 
                  label="Coin Type"
                  value={formatCoinType(coin.coinType)}
                />
                <InfoRow 
                  label="Amount"
                  value={coin.amount || "Not set"}
                />
                {coin.balance !== undefined && (
                  <InfoRow 
                    label="Available Balance"
                    value={coin.balance.toString()}
                  />
                )}
              </div>
            ))
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No coins selected</span>
            </div>
          )}
        </Section>

        <Section 
          title="Recipients"
          icon={<Users className="w-4 h-4 text-teal-500" />}
        >
          {hasRecipients ? (
            formData.recipients.map((recipient: Recipient, index: number) => (
              <div key={index} className="pl-4 py-2 border-l-2 border-blue-100">
                <InfoRow 
                  label="Address"
                  value={formatAddress(recipient.address)}
                />
                <InfoRow 
                  label="Amount"
                  value={recipient.amount || "Not set"}
                />
              </div>
            ))
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No recipients added</span>
            </div>
          )}
          {hasRecipients && (
            <InfoRow 
              label="Total Recipients"
              value={`${formData.recipients.length} address${formData.recipients.length > 1 ? 'es' : ''}`}
            />
          )}
        </Section>

        <Section 
          title="Proposal Timeline"
          icon={<CalendarIcon className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Voting Start"
            value={formData.votingStartDate ? formatDate(formData.votingStartDate) : "Not set"}
          />
          <InfoRow 
            label="Voting End"
            value={formData.votingEndDate ? formatDate(formData.votingEndDate) : "Not set"}
          />
          <InfoRow 
            label="Execution Date"
            value={formData.executionDate ? formatDate(formData.executionDate) : "Not set"}
          />
          <InfoRow 
            label="Expiration Date"
            value={formData.expirationDate ? formatDate(formData.expirationDate) : "Not set"}
          />
        </Section>
      </div>

      {(!hasSelectedCoins || !hasRecipients) && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                Incomplete Transfer Setup
              </p>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                {!hasSelectedCoins && (
                  <p>• You haven't selected any coins for transfer.</p>
                )}
                {!hasRecipients && (
                  <p>• You haven't added any recipients.</p>
                )}
                <p className="mt-2">
                  Go back to the previous steps to complete your transfer setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoins && hasRecipients && totalTransferAmount !== totalRecipientAmount && (
        <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">
                Amount Mismatch
              </p>
              <p className="text-sm text-red-700 mt-1">
                Total selected coin amount ({totalTransferAmount}) doesn't match total recipient amount ({totalRecipientAmount}). 
                Please adjust the amounts to ensure they match.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoins && hasRecipients && totalTransferAmount === totalRecipientAmount && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-800">
                External Transfer Notice
              </p>
              <p className="text-sm text-blue-700">
                This request will transfer a total of {totalTransferAmount} tokens from the <strong>{vaultName}</strong> vault 
                to {formData.recipients.length} external address{formData.recipients.length > 1 ? 'es' : ''} through the governance process.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                • Voting period: {formData.votingStartDate ? formatDate(formData.votingStartDate) : "Not set"} → {formData.votingEndDate ? formatDate(formData.votingEndDate) : "Not set"}<br />
                • If approved, executes at: {formData.executionDate ? formatDate(formData.executionDate) : "Not set"}<br />
                • Expires if not executed by: {formData.expirationDate ? formatDate(formData.expirationDate) : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
