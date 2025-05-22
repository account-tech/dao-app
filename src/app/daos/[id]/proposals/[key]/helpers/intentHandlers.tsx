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
  withdrawAmounts?: Array<{
    amount: string;
    coinType: string;
    recipient: string;
  }>;
}

interface HandlerResult {
  title: string;
  description: ReactNode;
}

const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

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

export function handleWithdrawAndTransfer({ withdrawAmounts }: IntentHandlerProps): HandlerResult {
  if (!withdrawAmounts) {
    return {
      title: "Withdraw and Transfer Assets",
      description: <span>Loading withdrawal details...</span>
    };
  }

  // Helper function to format coin type
  const formatCoinType = (coinType: string) => {
    const match = coinType.match(/::([^:]+)$/);
    return match ? match[1] : coinType;
  };

  const handleCopyClick = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return {
    title: "Withdraw and Transfer Assets",
    description: (
      <div className="space-y-4">
        {withdrawAmounts.map((withdrawal, index) => (
          <div 
            key={index} 
            className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-teal-100 transition-colors"
          >
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="text-teal-600 font-medium">
                  {withdrawal.amount} {formatCoinType(withdrawal.coinType)}
                </span>
              </div>
              
              <div className="border-t border-gray-200 my-1" />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recipient</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-700">
                    {truncateAddress(withdrawal.recipient)}
                  </span>
                  <button
                    onClick={() => handleCopyClick(withdrawal.recipient)}
                    className="text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
  const formatValue = (value: string | number, key: keyof typeof requested) => {
    if (key === 'assetType') {
      // Extract just the coin type from the full asset type string
      const match = value.toString().match(/::([^:]+)$/);
      return match ? match[1] : value;
    }
    if (key === 'votingQuorum') {
      // Convert decimal to percentage
      return `${(Number(value) * 100).toFixed(0)}%`;
    }
    if (key === 'votingRule') {
      // Convert 0/1 to Linear/Quadratic
      return Number(value) === 0 ? 'Linear' : 'Quadratic';
    }
    return value.toString();
  };

  // Helper function to check if a value has changed
  const hasChanged = (key: keyof typeof requested) => {
    if (key === 'votingQuorum') {
      // Compare actual numbers for quorum
      return Number(requested[key]) !== Number(current[key]);
    }
    return formatValue(requested[key], key) !== formatValue(current[key], key);
  };

  // Helper function to create a change display
  const createChangeDisplay = (key: keyof typeof requested, label: string) => {
    const currentValue = formatValue(current[key], key);
    const requestedValue = formatValue(requested[key], key);

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
  const changes = [];
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
  WithdrawAndTransfer: handleWithdrawAndTransfer,
  // Add more mappings as we add more handlers
}; 