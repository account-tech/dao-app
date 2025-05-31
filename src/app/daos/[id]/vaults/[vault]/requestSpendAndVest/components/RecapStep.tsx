import React from 'react';
import { Check, AlertCircle, CalendarIcon, Wallet, User, Clock } from "lucide-react";
import { useParams } from 'next/navigation';
import { VestingFormData } from '../helpers/types';

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

const formatAddress = (address: string) => {
  if (!address) return "Not set";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const calculateVestingDuration = (startDate: Date, endDate: Date): string => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`;
  }
};

const calculateVestingRate = (amount: number, startDate: Date, endDate: Date): string => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  if (diffMinutes <= 0) return "Invalid duration";
  
  const ratePerMinute = amount / diffMinutes;
  const ratePerHour = ratePerMinute * 60;
  const ratePerDay = ratePerHour * 24;
  
  if (ratePerDay >= 1) {
    return `${ratePerDay.toFixed(6)} tokens/day`;
  } else if (ratePerHour >= 1) {
    return `${ratePerHour.toFixed(6)} tokens/hour`;
  } else {
    return `${ratePerMinute.toFixed(6)} tokens/minute`;
  }
};

interface RecapStepProps {
  formData: VestingFormData;
  updateFormData: (updates: Partial<VestingFormData>) => void;
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

export const RecapStep: React.FC<RecapStepProps> = ({ formData }) => {
  const params = useParams();
  const vaultName = typeof params.vault === 'string' 
    ? decodeURIComponent(params.vault) 
    : Array.isArray(params.vault) 
    ? decodeURIComponent(params.vault[0]) 
    : '';

  const hasSelectedCoin = formData.selectedCoins.length > 0 && formData.selectedCoins[0].coinType !== '';
  const hasRecipient = formData.recipientAddress !== '';
  const selectedCoin = formData.selectedCoins[0];

  const isVestingConfigured = formData.vestingStartDate && formData.vestingEndDate;
  const vestingDuration = isVestingConfigured ? calculateVestingDuration(formData.vestingStartDate, formData.vestingEndDate) : null;
  const vestingRate = hasSelectedCoin && selectedCoin.amount > 0 && isVestingConfigured 
    ? calculateVestingRate(selectedCoin.amount, formData.vestingStartDate, formData.vestingEndDate)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Spend & Vest Request Summary
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
          title="Vesting Details"
          icon={<Clock className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Source"
            value={`${vaultName} Vault`}
          />
          <InfoRow 
            label="Type"
            value="Token Vesting Contract"
          />
          <InfoRow 
            label="Vesting Duration"
            value={vestingDuration || "Not configured"}
          />
          {vestingRate && (
            <InfoRow 
              label="Vesting Rate"
              value={vestingRate}
            />
          )}
        </Section>

        <Section 
          title="Selected Coin"
          icon={<Wallet className="w-4 h-4 text-teal-500" />}
        >
          {hasSelectedCoin ? (
            <div className="pl-4 py-2 border-l-2 border-teal-100">
              <InfoRow 
                label="Coin Type"
                value={formatCoinType(selectedCoin.coinType)}
              />
              <InfoRow 
                label="Amount"
                value={selectedCoin.amount || "Not set"}
              />
              {selectedCoin.balance !== undefined && (
                <InfoRow 
                  label="Available Balance"
                  value={selectedCoin.balance.toString()}
                />
              )}
            </div>
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No coin selected</span>
            </div>
          )}
        </Section>

        <Section 
          title="Recipient"
          icon={<User className="w-4 h-4 text-teal-500" />}
        >
          {hasRecipient ? (
            <div className="pl-4 py-2 border-l-2 border-blue-100">
              <InfoRow 
                label="Address"
                value={formatAddress(formData.recipientAddress)}
              />
              <InfoRow 
                label="Full Address"
                value={formData.recipientAddress}
              />
            </div>
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No recipient address</span>
            </div>
          )}
        </Section>

        <Section 
          title="Vesting Schedule"
          icon={<CalendarIcon className="w-4 h-4 text-purple-500" />}
        >
          <InfoRow 
            label="Vesting Start"
            value={formData.vestingStartDate ? formatDate(formData.vestingStartDate) : "Not set"}
          />
          <InfoRow 
            label="Vesting End"
            value={formData.vestingEndDate ? formatDate(formData.vestingEndDate) : "Not set"}
          />
          {vestingDuration && (
            <InfoRow 
              label="Total Duration"
              value={vestingDuration}
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

      {(!hasSelectedCoin || !hasRecipient) && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                Incomplete Vesting Setup
              </p>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                {!hasSelectedCoin && (
                  <p>• You haven't selected a coin for vesting.</p>
                )}
                {!hasRecipient && (
                  <p>• You haven't specified a recipient address.</p>
                )}
                <p className="mt-2">
                  Go back to the previous steps to complete your vesting setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoin && hasRecipient && selectedCoin.amount <= 0 && (
        <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">
                Invalid Amount
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please specify a valid amount greater than 0 for vesting.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoin && hasRecipient && selectedCoin.amount > 0 && isVestingConfigured && (
        <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg border border-purple-100">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-purple-800">
                Vesting Contract Notice
              </p>
              <p className="text-sm text-purple-700">
                This request will create a vesting contract for {selectedCoin.amount} {formatCoinType(selectedCoin.coinType)} tokens 
                from the <strong>{vaultName}</strong> vault to <strong>{formatAddress(formData.recipientAddress)}</strong>.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                • Vesting period: {formatDate(formData.vestingStartDate)} → {formatDate(formData.vestingEndDate)}<br />
                • Duration: {vestingDuration}<br />
                • Rate: {vestingRate}<br />
                • Voting period: {formData.votingStartDate ? formatDate(formData.votingStartDate) : "Not set"} → {formData.votingEndDate ? formatDate(formData.votingEndDate) : "Not set"}<br />
                • If approved, executes at: {formData.executionDate ? formatDate(formData.executionDate) : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
