import React from 'react';
import { Label } from "@/components/ui/label";
import { WithdrawFormData, CoinSelection, ObjectSelection } from '../helpers/types';
import { Check, AlertCircle, CalendarIcon, Wallet } from "lucide-react";

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

const truncateAddress = (address: string) => {
  if (!address) return "Not set";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const truncateObjectId = (objectId: string) => {
  if (!objectId) return "Not set";
  return `${objectId.slice(0, 8)}...${objectId.slice(-8)}`;
};

const groupObjectsByType = (objects: ObjectSelection[]) => {
  const grouped = objects.reduce((acc, obj) => {
    const type = obj.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(obj);
    return acc;
  }, {} as Record<string, ObjectSelection[]>);
  
  return grouped;
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
  const hasSelectedAssets = formData.selectedCoins.length > 0 || formData.selectedObjects.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Withdrawal Request Summary
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
          title="Withdrawal Assets"
          icon={<Wallet className="w-4 h-4 text-teal-500" />}
        >
          {formData.selectedCoins.length > 0 && (
            <>
              <h4 className="font-medium text-gray-700 mb-2">Selected Coins</h4>
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
                    value={coin.availableBalance.toString()}
                  />
                </div>
              ))}
            </>
          )}

          {formData.selectedObjects.length > 0 && (
            <>
              <h4 className="font-medium text-gray-700 mb-2 mt-4">Selected Objects/NFTs</h4>
              {Object.entries(groupObjectsByType(formData.selectedObjects)).map(([type, objects]) => {
                const quantity = objects.length;
                const firstObject = objects[0];
                const typeName = type.split('::').pop() || type;
                
                return (
                  <div key={type} className="pl-4 pr-4 py-3 border-l-2 border-teal-100 bg-gray-50 rounded-r-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{typeName}</span>
                      <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                        Quantity: x{quantity}
                      </span>
                    </div>
                    
                    {firstObject.name && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Name:</span> {firstObject.name}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Type:</span> {truncateAddress(type)}
                    </div>
                    
                    {quantity === 1 ? (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Object ID:</span> {truncateObjectId(firstObject.objectId)}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-teal-600 hover:text-teal-700 font-medium">
                            View all {quantity} object IDs
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l border-gray-300">
                            {objects.map((obj, idx) => (
                              <div key={obj.objectId} className="text-gray-500">
                                {idx + 1}. {truncateObjectId(obj.objectId)}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
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

      {!hasSelectedAssets && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                No Assets Selected
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You haven't selected any assets for withdrawal. 
                Go back to the first step to select coins or objects to withdraw.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSelectedAssets && (
        <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-teal-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">
                Important Notice
              </p>
              <p className="text-sm text-yellow-700">
                Please review all withdrawal details carefully. This request will need to be approved through
                the DAO's governance process before the assets can be transferred.
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
