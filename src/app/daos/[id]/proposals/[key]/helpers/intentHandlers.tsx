import { Intent } from "@account.tech/core";
import { ReactNode, useState } from "react";
import { formatCoinAmount } from "@/utils/GlobalHelpers";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface IntentHandlerProps {
  intent: Intent;
  daoId: string;
  unverifiedDepsAllowed?: boolean;
  coinDecimals?: number;
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
  withdrawAssets?: Array<{
    type: 'coin' | 'nft' | 'object';
    recipient: string;
    // For coins
    amount?: string;
    coinType?: string;
    // For NFTs and objects
    objectId?: string;
    objectType?: string;
    name?: string;
    image?: string;
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

// Update formatDuration to handle milliseconds
const formatDuration = (milliseconds: number): string => {
  if (milliseconds === 0) return '0 seconds';

  // Convert milliseconds to seconds first
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

  return parts.join(' ');
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

export function handleWithdrawAndTransfer({ withdrawAssets }: IntentHandlerProps): HandlerResult {
  if (!withdrawAssets) {
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

  // Helper function to truncate object ID
  const truncateObjectId = (objectId: string) => {
    if (!objectId) return "Not set";
    return `${objectId.slice(0, 8)}...${objectId.slice(-8)}`;
  };

  // Group assets by type and then by object type for NFTs/objects
  const groupAssetsByType = (assets: any[]) => {
    const grouped = {
      coins: [] as any[],
      nfts: {} as Record<string, any[]>,
      objects: {} as Record<string, any[]>
    };

    assets.forEach(asset => {
      if (asset.type === 'coin') {
        grouped.coins.push(asset);
      } else if (asset.type === 'nft') {
        const type = asset.objectType;
        if (!grouped.nfts[type]) {
          grouped.nfts[type] = [];
        }
        grouped.nfts[type].push(asset);
      } else if (asset.type === 'object') {
        const type = asset.objectType;
        if (!grouped.objects[type]) {
          grouped.objects[type] = [];
        }
        grouped.objects[type].push(asset);
      }
    });

    return grouped;
  };

  // Use the assets data
  const assetsToDisplay = withdrawAssets;

  const groupedAssets = groupAssetsByType(assetsToDisplay);

  return {
    title: "Withdraw and Transfer Assets",
    description: (
      <div className="space-y-4">
        {/* Coins Section */}
        {groupedAssets.coins.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Coins</h4>
            {groupedAssets.coins.map((coin, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-teal-100 transition-colors mb-3"
              >
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="text-teal-600 font-medium">
                      {coin.amount} {formatCoinType(coin.coinType)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 my-1" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700">
                        {truncateAddress(coin.recipient)}
                      </span>
                      <button
                        onClick={() => handleCopyClick(coin.recipient)}
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
        )}

        {/* NFTs Section */}
        {Object.keys(groupedAssets.nfts).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">NFTs</h4>
            {Object.entries(groupedAssets.nfts).map(([type, nfts]) => {
              const quantity = nfts.length;
              const firstNft = nfts[0];
              const typeName = type.split('::').pop() || type;
              
              return (
                <div key={type} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-teal-100 transition-colors mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{typeName}</span>
                    <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                      Quantity: x{quantity}
                    </span>
                  </div>
                  
                  {firstNft.name && (
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Name:</span> {firstNft.name}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mb-2">
                    <span className="font-medium">Type:</span> {truncateAddress(type)}
                  </div>
                  
                  {quantity === 1 ? (
                    <div className="text-xs text-gray-500 mb-2">
                      <span className="font-medium">Object ID:</span> {truncateObjectId(firstNft.objectId)}
                    </div>
                  ) : (
                    <div className="mb-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-teal-600 hover:text-teal-700 font-medium">
                          View all {quantity} object IDs
                        </summary>
                        <div className="mt-2 space-y-1 pl-2 border-l border-gray-300">
                          {nfts.map((nft, idx) => (
                            <div key={nft.objectId} className="text-gray-500">
                              {idx + 1}. {truncateObjectId(nft.objectId)}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  <div className="border-t border-gray-200 my-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700">
                        {truncateAddress(firstNft.recipient)}
                      </span>
                      <button
                        onClick={() => handleCopyClick(firstNft.recipient)}
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
              );
            })}
          </div>
        )}

        {/* Objects Section */}
        {Object.keys(groupedAssets.objects).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Objects</h4>
            {Object.entries(groupedAssets.objects).map(([type, objects]) => {
              const quantity = objects.length;
              const firstObject = objects[0];
              const typeName = type.split('::').pop() || type;
              
              return (
                <div key={type} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-teal-100 transition-colors mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{typeName}</span>
                    <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                      Quantity: x{quantity}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-2">
                    <span className="font-medium">Type:</span> {truncateAddress(type)}
                  </div>
                  
                  {quantity === 1 ? (
                    <div className="text-xs text-gray-500 mb-2">
                      <span className="font-medium">Object ID:</span> {truncateObjectId(firstObject.objectId)}
                    </div>
                  ) : (
                    <div className="mb-2">
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

                  <div className="border-t border-gray-200 my-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700">
                        {truncateAddress(firstObject.recipient)}
                      </span>
                      <button
                        onClick={() => handleCopyClick(firstObject.recipient)}
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
              );
            })}
          </div>
        )}
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
    if (key === 'unstakingCooldown') {
      // Convert milliseconds to human readable duration
      return formatDuration(Number(value));
    }
    return value.toString();
  };

  // Helper function to check if a value has changed
  const hasChanged = (key: keyof typeof requested) => {
    if (key === 'votingQuorum') {
      // Compare actual numbers for quorum
      return Number(requested[key]) !== Number(current[key]);
    }
    if (key === 'unstakingCooldown') {
      // Compare actual numbers for cooldown
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

export function handleWithdrawAndTransferToVault({ intent, coinDecimals }: IntentHandlerProps): HandlerResult {
  const args = (intent as any).args;
  
  if (!args) {
    return {
      title: "Transfer to Vault",
      description: <span>Loading transfer details...</span>
    };
  }

  const { coinAmount, coinType, vaultName } = args;

  // Helper function to format coin type for display
  const formatCoinType = (coinType: string) => {
    const match = coinType.match(/::([^:]+)$/);
    return match ? match[1] : coinType;
  };
  
  // Use the correct decimals passed from the component, fallback to 9 if not provided
  const decimals = coinDecimals ?? 9;
  const formattedAmount = formatCoinAmount(coinAmount, decimals, 6);

  return {
    title: "Transfer to Vault",
    description: (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-teal-100 transition-colors">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="text-teal-600 font-medium">
                {formattedAmount} {formatCoinType(coinType)}
              </span>
            </div>
            
            <div className="border-t border-gray-200 my-1" />
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source</span>
              <span className="text-gray-700">DAO Wallet</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Destination</span>
              <span className="text-gray-700 font-medium">Vault : {vaultName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transfer Type</span>
              <span className="text-gray-700">Internal DAO Transfer</span>
            </div>
          </div>
        </div>
      </div>
    ),
  };
}

export function handleSpendAndTransfer({ intent, coinDecimals }: IntentHandlerProps): HandlerResult {
  const args = (intent as any).args;
  
  if (!args) {
    return {
      title: "Spend and Transfer",
      description: <span>Loading transfer details...</span>
    };
  }

  const { coinType, treasuryName, transfers } = args;

  // Helper function to format coin type for display
  const formatCoinType = (coinType: string) => {
    const match = coinType.match(/::([^:]+)$/);
    return match ? match[1] : coinType;
  };

  const handleCopyClick = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Use the correct decimals passed from the component, fallback to 9 if not provided
  const decimals = coinDecimals ?? 9;

  // Calculate total amount being transferred
  const totalAmount = transfers.reduce((sum: bigint, transfer: any) => {
    return sum + BigInt(transfer.amount);
  }, BigInt(0));

  const formattedTotalAmount = formatCoinAmount(totalAmount.toString(), decimals, 6);

  // TransfersList component for handling large numbers of transfers
  const TransfersList = ({ transfers }: { transfers: any[] }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const transfersPerPage = 10;

    const visibleTransfers = transfers.slice(0, 2);
    const remainingTransfers = transfers.slice(2);
    const totalPages = Math.ceil(remainingTransfers.length / transfersPerPage);
    
    const paginatedTransfers = remainingTransfers.slice(
      (currentPage - 1) * transfersPerPage,
      currentPage * transfersPerPage
    );

    const TransferItem = ({ transfer, index }: { transfer: any, index: number }) => {
      const formattedAmount = formatCoinAmount(transfer.amount, decimals, 6);
      
      return (
        <div 
          key={index} 
          className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-teal-100 transition-colors mb-3"
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Transfer #{index + 1}</span>
              <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                External Transfer
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="text-teal-600 font-medium">
                {formattedAmount} {formatCoinType(coinType)}
              </span>
            </div>
            
            <div className="border-t border-gray-200 my-1" />
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Recipient</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-700">
                  {truncateAddress(transfer.recipient)}
                </span>
                <button
                  onClick={() => handleCopyClick(transfer.recipient)}
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
      );
    };

    return (
      <div className="space-y-3">
        {/* Always show first 3 transfers */}
        <div className="space-y-2">
          {visibleTransfers.map((transfer, index) => (
            <TransferItem key={index} transfer={transfer} index={index} />
          ))}
        </div>

        {/* Show expandable section if there are more than 3 transfers */}
        {remainingTransfers.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="additional-transfers">
              <AccordionTrigger className="text-sm">
                {remainingTransfers.length} more transfer{remainingTransfers.length > 1 ? 's' : ''}
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {/* Paginated transfers */}
                <div className="space-y-2">
                  {paginatedTransfers.map((transfer, index) => (
                    <TransferItem 
                      key={3 + (currentPage - 1) * transfersPerPage + index} 
                      transfer={transfer} 
                      index={3 + (currentPage - 1) * transfersPerPage + index} 
                    />
                  ))}
                </div>

                {/* Pagination if needed */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Show current page info if paginated */}
                {totalPages > 1 && (
                  <div className="text-center text-sm text-gray-600">
                    Showing {((currentPage - 1) * transfersPerPage) + 1}-{Math.min(currentPage * transfersPerPage, remainingTransfers.length)} of {remainingTransfers.length} additional transfers
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    );
  };

  return {
    title: "Spend and Transfer",
    description: (
      <div className="space-y-4">
        {/* Summary Section */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source</span>
              <span className="text-gray-700 font-medium">Vault: {treasuryName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Coin Type</span>
              <span className="text-gray-700 font-medium">{formatCoinType(coinType)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-teal-600 font-medium">
                {formattedTotalAmount} {formatCoinType(coinType)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Recipients</span>
              <span className="text-gray-700">{transfers.length} address{transfers.length > 1 ? 'es' : ''}</span>
            </div>
          </div>
        </div>

        {/* Transfers Section */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Transfer Details</h4>
          <TransfersList transfers={transfers} />
        </div>
      </div>
    ),
  };
}

export function handleConfigDeps({ intent, currentDeps }: IntentHandlerProps & { currentDeps?: any[] }): HandlerResult {
  const args = (intent as any).args;
  
  if (!args || !args.deps) {
    return {
      title: "Configure Dependencies",
      description: <span>Loading dependency changes...</span>
    };
  }

  const proposedDeps = args.deps;
  const daoDeps = currentDeps || [];

  // Helper function to create dependency string for comparison
  const createDepString = (dep: any) => `${dep.name}:${dep.addr}:${dep.version}`;

  // Convert to sets for easy comparison
  const proposedDepStrings = new Set(proposedDeps.map(createDepString));
  const currentDepStrings = new Set(daoDeps.map(createDepString));

  // Find changes
  const addedDeps = proposedDeps.filter((dep: any) => !currentDepStrings.has(createDepString(dep)));
  const removedDeps = daoDeps.filter((dep: any) => !proposedDepStrings.has(createDepString(dep)));
  const unchangedDeps = proposedDeps.filter((dep: any) => currentDepStrings.has(createDepString(dep)));

  const totalChanges = addedDeps.length + removedDeps.length;

  return {
    title: "Configure Dependencies",
    description: (
      <div className="space-y-4">
        {/* Summary Section */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Dependencies</span>
              <span className="text-gray-700 font-medium">{proposedDeps.length}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Changes</span>
              <span className="text-gray-700">
                {totalChanges === 0 ? 'No changes' : `${totalChanges} change${totalChanges > 1 ? 's' : ''}`}
              </span>
            </div>
            
            {addedDeps.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Added</span>
                <span className="text-green-600 font-medium">{addedDeps.length} package{addedDeps.length > 1 ? 's' : ''}</span>
              </div>
            )}
            
            {removedDeps.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Removed</span>
                <span className="text-red-600 font-medium">{removedDeps.length} package{removedDeps.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Changes Section */}
        {totalChanges > 0 && (
          <div className="space-y-4">
            {/* Added Dependencies */}
            {addedDeps.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-3">📦 Added Dependencies ({addedDeps.length})</h4>
                {addedDeps.map((dep: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-green-50 rounded-lg p-4 border border-green-100 mb-3"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800">{dep.name}</span>
                        <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          New Package
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div>Version: {dep.version}</div>
                        <div className="break-all">Address: {truncateAddress(dep.addr)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Removed Dependencies */}
            {removedDeps.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-3">🗑️ Removed Dependencies ({removedDeps.length})</h4>
                {removedDeps.map((dep: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-red-50 rounded-lg p-4 border border-red-100 mb-3"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-red-800">{dep.name}</span>
                        <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Removed
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div>Version: {dep.version}</div>
                        <div className="break-all">Address: {truncateAddress(dep.addr)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unchanged Dependencies (collapsible) */}
        {unchangedDeps.length > 0 && (
          <div>
            <details className="group">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
                <span className="transform group-open:rotate-90 transition-transform">▶</span>
                View unchanged dependencies ({unchangedDeps.length})
              </summary>
              <div className="mt-3 space-y-2">
                {unchangedDeps.map((dep: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{dep.name}</span>
                      <span className="text-xs text-gray-500">v{dep.version}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {truncateAddress(dep.addr)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {totalChanges === 0 && (
          <div className="text-center py-4 text-gray-500">
            No dependency changes proposed
          </div>
        )}
      </div>
    ),
  };
}

export function handleSpendAndVest({ intent, coinDecimals }: IntentHandlerProps): HandlerResult {
  const args = (intent as any).args;
  
  if (!args) {
    return {
      title: "Spend and Vest",
      description: <span>Loading vesting details...</span>
    };
  }

  const { amount, coinType, start, end, recipient, treasuryName } = args;

  // Helper function to format coin type for display
  const formatCoinType = (coinType: string) => {
    const match = coinType.match(/::([^:]+)$/);
    return match ? match[1] : coinType;
  };

  const handleCopyClick = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Helper function to format timestamp to readable date (plain format)
  const formatTimestamp = (timestamp: string | number | bigint): string => {
    const timestampMs = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
    
    // Check if timestamp looks like it's in seconds (less than year 2010 in ms)
    const actualTimestamp = timestampMs < 1000000000000 ? timestampMs * 1000 : timestampMs;
    
    return new Date(actualTimestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Use the correct decimals passed from the component, fallback to 9 if not provided
  const decimals = coinDecimals ?? 9;
  const formattedAmount = formatCoinAmount(amount.toString(), decimals, 6);

  return {
    title: "Spend and Vest",
    description: (
      <div className="space-y-4">
        {/* Summary Section */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Source</span>
              <span className="text-gray-700 font-medium">Vault: {treasuryName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Coin Type</span>
              <span className="text-gray-700 font-medium">{formatCoinType(coinType)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-purple-600 font-medium">
                {formattedAmount} {formatCoinType(coinType)}
              </span>
            </div>
          </div>
        </div>

        {/* Vesting Schedule Section */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Vesting Schedule</h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-purple-100 transition-colors">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Vesting Start</span>
                <span className="text-gray-700 font-medium">
                  {formatTimestamp(start)}
                </span>
              </div>
              
              <div className="border-t border-gray-200 my-1" />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Vesting End</span>
                <span className="text-gray-700 font-medium">
                  {formatTimestamp(end)}
                </span>
              </div>

              <div className="border-t border-gray-200 my-1" />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Recipient</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-700">
                    {truncateAddress(recipient)}
                  </span>
                  <button
                    onClick={() => handleCopyClick(recipient)}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
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
        </div>

        {/* Vesting Details Notice */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-purple-800">
                Vesting Contract Notice
              </p>
              <p className="text-sm text-purple-700">
                This proposal will create a vesting contract that gradually releases{' '}
                <strong>{formattedAmount} {formatCoinType(coinType)}</strong> tokens from the{' '}
                <strong>{treasuryName}</strong> vault to the recipient according to the specified schedule.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                • Tokens will be released continuously throughout the vesting period<br />
                • The recipient can claim vested tokens at any time during the vesting period<br />
                • Unclaimed tokens remain locked until the vesting schedule allows their release
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  };
}

// Add more handlers here as needed
export const intentHandlers: Record<string, (props: IntentHandlerProps) => HandlerResult> = {
  ToggleUnverifiedAllowed: handleToggleUnverifiedAllowed,
  ConfigDao: handleConfigDao,
  WithdrawAndTransfer: handleWithdrawAndTransfer,
  WithdrawAndTransferToVault: handleWithdrawAndTransferToVault,
  SpendAndTransfer: handleSpendAndTransfer,
  SpendAndVest: handleSpendAndVest,
  ConfigDeps: handleConfigDeps,
  // Add more mappings as we add more handlers
}; 