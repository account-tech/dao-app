import React from 'react';
import { Check, AlertCircle, CalendarIcon, Vault, ArrowUpFromLine } from "lucide-react";
import { useParams } from 'next/navigation';

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

interface CoinSelection {
  type: string;
  amount: string;
  availableBalance?: number;
}

interface VaultTransferFormData {
  proposalName: string;
  proposalDescription: string;
  selectedCoins: CoinSelection[];
  votingStartDate: Date | null;
  votingEndDate: Date | null;
  executionDate: Date | null;
  expirationDate: Date | null;
}

interface RecapStepProps {
  formData: VaultTransferFormData;
  updateFormData: (updates: Partial<VaultTransferFormData>) => void;
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
  const vaultName = params.vault as string;
  const hasSelectedCoins = formData.selectedCoins.length > 0 && formData.selectedCoins[0].type !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Vault Transfer Request Summary
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
          icon={<ArrowUpFromLine className="w-4 h-4 text-teal-500" />}
        >
          <InfoRow 
            label="Source"
            value="DAO Wallet"
          />
          <InfoRow 
            label="Destination"
            value={`${vaultName} Vault`}
          />
          <InfoRow 
            label="Transfer Type"
            value="Internal DAO Transfer"
          />
        </Section>

        <Section 
          title="Selected Coin"
          icon={<Vault className="w-4 h-4 text-teal-500" />}
        >
          {hasSelectedCoins ? (
            formData.selectedCoins.map((coin: CoinSelection, index: number) => (
              <div key={index} className="pl-4 py-2 border-l-2 border-teal-100">
                <InfoRow 
                  label="Coin Type"
                  value={coin.type}
                />
                <InfoRow 
                  label="Amount"
                  value={coin.amount || "Not set"}
                />
                {coin.availableBalance !== undefined && (
                  <InfoRow 
                    label="Available Balance"
                    value={coin.availableBalance.toString()}
                  />
                )}
              </div>
            ))
          ) : (
            <div className="pl-4 py-2 border-l-2 border-yellow-100 bg-yellow-50 rounded-r-md">
              <span className="text-yellow-700">No coin selected</span>
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

      {!hasSelectedCoins && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                No Coin Selected
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You haven't selected a coin for transfer. 
                Go back to the coin selection step to choose a coin and amount.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedCoins && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <Vault className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-800">
                Vault Transfer Notice
              </p>
              <p className="text-sm text-blue-700">
                This request will transfer {formData.selectedCoins[0]?.amount || "0"} {formatCoinType(formData.selectedCoins[0]?.type || "")} 
                from the DAO wallet to the <strong>{vaultName}</strong> vault through the governance process.
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
