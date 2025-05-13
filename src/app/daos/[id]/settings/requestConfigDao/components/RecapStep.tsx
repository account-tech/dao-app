import React from 'react';
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { ExternalLink, Check, AlertCircle, ArrowRight } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { formatBigInt } from "@/utils/GlobalHelpers";

// Constants for time conversion
const MILLISECONDS_PER_MINUTE = BigInt(60 * 1000);

const formatDuration = (milliseconds: bigint): string => {
  const totalMinutes = Number(milliseconds) / Number(MILLISECONDS_PER_MINUTE);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(totalMinutes % 60);
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (hours > 0 || days > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
};

const formatDate = (date: Date | null): string => {
  if (!date) return "Not set";
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Convert the SDK number to a percentage (0-100)
const getCurrentPercentage = (value: bigint): string => {
  const percentage = Number(value) / 10000000; // Convert from 1e9 scale to percentage
  return percentage < 1 ? "0%" : `${Math.round(percentage)}%`;
};

export const RecapStep: React.FC<StepProps> = ({ formData }) => {
  const originalConfig = useOriginalDaoConfig();

  const TruncatedText = ({ text, maxLength = 30 }: { text: string | undefined, maxLength?: number }) => {
    if (!text) return <span className="text-gray-400 italic">Not set</span>;
    if (text.length <= maxLength) return <span>{text}</span>;
    return (
      <div className="group relative cursor-help">
        <span>{text.slice(0, maxLength)}...</span>
        <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-sm rounded-md py-1 px-2 -top-1 left-full ml-2 w-64 break-words">
          {text}
        </div>
      </div>
    );
  };

  const ValueComparison = ({ 
    original, 
    current,
    formatter = (value: any) => value?.toString() ?? "Not set"
  }: { 
    original: any, 
    current: any,
    formatter?: (value: any) => string | React.ReactElement
  }) => {
    const hasChanged = original !== current;
    return (
      <div className={`flex items-center gap-2 ${hasChanged ? 'text-blue-600 font-medium' : ''}`}>
        {typeof formatter(original) === 'string' ? (
          <span>{formatter(original)}</span>
        ) : (
          formatter(original)
        )}
        {hasChanged && (
          <>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            {typeof formatter(current) === 'string' ? (
              <span className="font-semibold">{formatter(current)}</span>
            ) : (
              formatter(current)
            )}
          </>
        )}
      </div>
    );
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "Not set";
    }
    
    if (value instanceof Date) {
      return formatDate(value);
    }

    return String(value);
  };

  // Simple version for proposal details (no comparison needed)
  const InfoRowSimple = ({ label, value, isDescription = false }: { 
    label: string, 
    value: any,
    isDescription?: boolean
  }) => (
    <div className={`${isDescription ? 'block space-y-2' : 'grid grid-cols-2 gap-4'} py-2 border-b last:border-b-0 border-teal-50`}>
      <span className="text-gray-600 font-medium">{label}</span>
      {isDescription ? (
        <div className="w-full mt-1 p-3 rounded-md text-gray-900 whitespace-pre-wrap">
          {formatValue(value)}
        </div>
      ) : (
        <span className="text-gray-900">{formatValue(value)}</span>
      )}
    </div>
  );

  // Original InfoRow with comparison (for other sections)
  const InfoRow = ({ label, original, current, formatter }: { 
    label: string, 
    original: any, 
    current: any,
    formatter?: (value: any) => string | React.ReactElement
  }) => (
    <div className="grid grid-cols-2 gap-4 py-2 border-b last:border-b-0 border-teal-50">
      <span className="text-gray-600 font-medium">{label}</span>
      <ValueComparison original={original} current={current} formatter={formatter} />
    </div>
  );

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

  const hasChanges = 
    formData.assetType !== originalConfig.assetType ||
    formData.authVotingPower !== originalConfig.authVotingPower ||
    formData.unstakingCooldown !== originalConfig.unstakingCooldown ||
    formData.votingRule !== originalConfig.votingRule ||
    formData.votingQuorum !== originalConfig.votingQuorum ||
    formData.maxVotingPower !== originalConfig.maxVotingPower ||
    formData.minimumVotes !== originalConfig.minimumVotes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          Configuration Changes Summary
        </h2>
        <div className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full border border-gray-200">
          Final Review
        </div>
      </div>

      <div className="grid gap-6">
        <Section 
          title="Proposal Details"
          icon={formData.proposalName && formData.proposalDescription ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
        >
          <InfoRowSimple 
            label="Name"
            value={formData.proposalName}
          />
          <InfoRowSimple 
            label="Description"
            value={formData.proposalDescription}
            isDescription={true}
          />
          <InfoRowSimple 
            label="Execution Date"
            value={formData.executionDate}
          />
          <InfoRowSimple 
            label="Expiration Date"
            value={formData.expirationDate}
          />
        </Section>

        <Section title="Asset Configuration">
          <InfoRow 
            label="Asset Type" 
            original={originalConfig.assetType}
            current={formData.assetType}
            formatter={(value) => <TruncatedText text={value} maxLength={40} />}
          />
        </Section>

        <Section title="Governance Parameters">
          <InfoRow 
            label="Auth Voting Power" 
            original={originalConfig.authVotingPower}
            current={formData.authVotingPower}
            formatter={formatBigInt}
          />
          <InfoRow 
            label="Unstaking Cooldown" 
            original={originalConfig.unstakingCooldown}
            current={formData.unstakingCooldown}
            formatter={(value) => value > BigInt(0) ? formatDuration(value) : "No cooldown"}
          />
          <InfoRow 
            label="Voting Rule" 
            original={originalConfig.votingRule}
            current={formData.votingRule}
            formatter={(value) => value === 1 ? "Quadratic" : "Linear"}
          />
          <InfoRow 
            label="Approval Threshold" 
            original={originalConfig.votingQuorum}
            current={formData.votingQuorum}
            formatter={getCurrentPercentage}
          />
        </Section>

        <Section title="Voting Limits">
          <InfoRow 
            label="Maximum Voting Power" 
            original={originalConfig.maxVotingPower}
            current={formData.maxVotingPower}
            formatter={formatBigInt}
          />
          <InfoRow 
            label="Minimum Votes" 
            original={originalConfig.minimumVotes}
            current={formData.minimumVotes}
            formatter={formatBigInt}
          />
        </Section>
      </div>

      {!hasChanges && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                No Changes Detected
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You haven't made any changes to the DAO configuration. 
                Go back to previous steps if you want to modify any settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasChanges && (
        <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-teal-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-800">
                Important Notice
              </p>
              <p className="text-sm text-yellow-700">
                Please review all changes carefully. These modifications will need to be approved through
                the DAO's governance process before taking effect.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
