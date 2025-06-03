import React from 'react';
import { Label } from "@/components/ui/label";
import { VestingFormData, CoinSelection } from '../helpers/types';
import { Check, AlertCircle, CalendarIcon, Wallet, Clock } from "lucide-react";

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

const truncateAddress = (address: string) => {
  if (!address) return "Not set";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

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
        {label === "Recipient Address" ? truncateAddress(value) : 
         label === "Type" ? formatCoinType(value) : 
         value}
      </span>
    )}
  </div>
);

export const RecapStep: React.FC<RecapStepProps> = ({ formData }) => {
  const hasSelectedCoin = formData.selectedCoins.length > 0 && formData.selectedCoins[0].amount > 0;
  
  const calculateVestingRate = () => {
    if (!hasSelectedCoin || !formData.vestingStartDate || !formData.vestingEndDate) return null;
    
    const coin = formData.selectedCoins[0];
    const durationMinutes = Math.max(1, (formData.vestingEndDate.getTime() - formData.vestingStartDate.getTime()) / (1000 * 60));
    const ratePerMinute = coin.amount / durationMinutes;
    
    return {
      perMinute: ratePerMinute.toFixed(6),
      perHour: (ratePerMinute * 60).toFixed(6),
      perDay: (ratePerMinute * 60 * 24).toFixed(6),
      symbol: formatCoinType(coin.coinType)
    };
  };

  const vestingRate = calculateVestingRate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Vesting Proposal Summary
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
          icon={<Wallet className="w-4 h-4 text-teal-500" />}
        >
          {formData.selectedCoins.length > 0 && (
            <>
              <h4 className="font-medium text-gray-700 mb-2">Selected Coin</h4>
              {formData.selectedCoins.map((coin: CoinSelection, index: number) => (
                <div key={index} className="pl-4 py-2 border-l-2 border-teal-100">
                  <InfoRow 
                    label="Type"
                    value={coin.coinType}
                  />
                  <InfoRow 
                    label="Amount"
                    value={coin.amount ? coin.amount.toString() : "Not set"}
                  />
                  <InfoRow 
                    label="Available Balance"
                    value={coin.availableBalance?.toString() || "Not available"}
                  />
                </div>
              ))}
            </>
          )}
        </Section>

        <Section 
          title="Recipient Details"
          icon={<Check className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Recipient Address"
            value={formData.recipientAddress}
          />
        </Section>

        <Section 
          title="Vesting Schedule"
          icon={<Clock className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Vesting Start"
            value={formData.vestingStartDate ? formatDate(formData.vestingStartDate) : "Not set"}
          />
          <InfoRow 
            label="Vesting End"
            value={formData.vestingEndDate ? formatDate(formData.vestingEndDate) : "Not set"}
          />
          {vestingRate && (
            <div className="mt-4 p-3 bg-teal-50 rounded-md border border-teal-100">
              <h5 className="font-medium text-teal-800 mb-2">Vesting Rate</h5>
              <div className="space-y-1 text-sm text-teal-700">
                <div>Per minute: {vestingRate.perMinute} {vestingRate.symbol}</div>
                <div>Per hour: {vestingRate.perHour} {vestingRate.symbol}</div>
                <div>Per day: {vestingRate.perDay} {vestingRate.symbol}</div>
              </div>
            </div>
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

      {!hasSelectedCoin && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                No Coin Selected
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You haven't selected a coin and amount for vesting. 
                Go back to the first step to select a coin and specify the amount.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoin && (
        <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-teal-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">
                Important Notice
              </p>
              <p className="text-sm text-yellow-700">
                Please review all vesting details carefully. This request will need to be approved through
                the DAO's governance process before the vesting schedule can be created.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                • Voting period: {formData.votingStartDate ? formatDate(formData.votingStartDate) : "Not set"} → {formData.votingEndDate ? formatDate(formData.votingEndDate) : "Not set"}<br />
                • If approved, vesting starts: {formData.vestingStartDate ? formatDate(formData.vestingStartDate) : "Not set"}<br />
                • Vesting completes: {formData.vestingEndDate ? formatDate(formData.vestingEndDate) : "Not set"}<br />
                • Expires if not executed by: {formData.expirationDate ? formatDate(formData.expirationDate) : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 