import { Intent } from "@account.tech/core";
import { ReactNode } from "react";

interface IntentHandlerProps {
  intent: Intent;
  daoId: string;
  unverifiedDepsAllowed?: boolean;
  configChanges?: {
    requested: {
      assetType: string;
      authVotingPower: string;
      maxVotingPower: string;
      minimumVotes: string;
      unstakingCooldown: string;
      votingQuorum: string;
      votingRule: number;
    };
    current: {
      assetType: string;
      authVotingPower: string;
      maxVotingPower: string;
      minimumVotes: string;
      unstakingCooldown: string;
      votingQuorum: string;
      votingRule: number;
    };
  };
}

interface HandlerResult {
  title: string;
  description: ReactNode;
}

export function handleToggleUnverifiedAllowed({ unverifiedDepsAllowed }: IntentHandlerProps): HandlerResult {
  return {
    title: "Toggle Unverified Dependencies",
    description: (
      <span>
        This proposal plans to{' '}
        <span className={unverifiedDepsAllowed ? 'text-red-600 font-medium' : 'text-teal-600 font-medium'}>
          {unverifiedDepsAllowed ? 'disable' : 'allow'}
        </span>
        {' '}unverified dependencies
      </span>
    ),
  };
}

export function handleConfigDao({ configChanges }: IntentHandlerProps): HandlerResult {
  if (!configChanges) {
    return {
      title: "Update DAO Configuration",
      description: <span>Loading configuration changes...</span>
    };
  }

  const { requested, current } = configChanges;

  // Helper function to format values for display
  const formatValue = (value: string | number, isAssetType = false) => {
    if (typeof value === 'number') return value.toString();
    if (isAssetType) {
      // Extract just the coin type from the full asset type string
      const match = value.match(/::([^:]+)$/);
      return match ? match[1] : value;
    }
    return value;
  };

  // Helper function to check if a value has changed
  const hasChanged = (key: keyof typeof requested) => {
    return formatValue(requested[key], key === 'assetType') !== formatValue(current[key], key === 'assetType');
  };

  // Create change descriptions
  const changes = [];
  
  // Helper function to create a change display
  const createChangeDisplay = (key: keyof typeof requested, label: string) => {
    const isAssetType = key === 'assetType';
    const currentValue = formatValue(current[key], isAssetType);
    const requestedValue = formatValue(requested[key], isAssetType);

    if (hasChanged(key)) {
      return (
        <div key={key} className="flex justify-between items-center py-1">
          <span className="font-medium">{label}:</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 line-through">{currentValue}</span>
            <span className="text-teal-600">→</span>
            <span className="text-teal-600 font-medium">{requestedValue}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div key={key} className="flex justify-between items-center py-1">
          <span className="font-medium">{label}:</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{currentValue}</span>
            <span className="text-gray-400 text-sm">(no changes requested)</span>
          </div>
        </div>
      );
    }
  };

  // Add displays for each configuration value
  changes.push(createChangeDisplay('assetType', 'Asset Type'));
  changes.push(createChangeDisplay('authVotingPower', 'Auth Voting Power'));
  changes.push(createChangeDisplay('maxVotingPower', 'Max Voting Power'));
  changes.push(createChangeDisplay('minimumVotes', 'Minimum Votes'));
  changes.push(createChangeDisplay('unstakingCooldown', 'Unstaking Cooldown'));
  changes.push(createChangeDisplay('votingQuorum', 'Voting Quorum'));
  changes.push(createChangeDisplay('votingRule', 'Voting Rule'));

  return {
    title: "Update DAO Configuration",
    description: (
      <div className="space-y-2">
        <div className="space-y-1">{changes}</div>
      </div>
    ),
  };
}

// Add more handlers here as needed
export const intentHandlers: Record<string, (props: IntentHandlerProps) => HandlerResult> = {
  ToggleUnverifiedAllowed: handleToggleUnverifiedAllowed,
  ConfigDao: handleConfigDao,
  // Add more mappings as we add more handlers
}; 