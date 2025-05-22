'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { CoinMeta } from '@polymedia/suitcase-core';
import { useDaoClient } from '@/hooks/useDaoClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinSelection, ObjectSelection } from '../helpers/types';
import { formatCoinAmount, getMultipleCoinDecimals } from '@/utils/GlobalHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Coin {
  type: string;
  amount: bigint;
  totalBalance?: string;
  symbol?: string;
  decimals?: number;
  baseAmount: bigint;
  displayBalance: number;
  instances?: Array<{
    amount: bigint;
    ref: {
      objectId: string;
    };
  }>;
  lockedAmount?: bigint;
  availableAmount?: bigint;
}

interface AssetSelectionStepProps {
  selectedCoins: CoinSelection[];
  selectedObjects: ObjectSelection[];
  onCoinsSelected: (coins: CoinSelection[]) => void;
  onObjectsSelected: (objects: ObjectSelection[]) => void;
  coinMetas: Map<string, CoinMeta>;
  setCoinMetas: (metas: Map<string, CoinMeta>) => void;
}

export function AssetSelectionStep({ 
  selectedCoins, 
  selectedObjects,
  onCoinsSelected,
  onObjectsSelected,
  coinMetas,
  setCoinMetas
}: AssetSelectionStepProps) {
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  const [availableNFTs, setAvailableNFTs] = useState<ObjectSelection[]>([]);
  const [availableObjects, setAvailableObjects] = useState<ObjectSelection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getOwnedObjects, getLockedObjects } = useDaoClient();
  const [activeTab, setActiveTab] = useState<'coins' | 'objects-nfts'>('coins');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lockedObjects, setLockedObjects] = useState<string[]>([]);
  const [initialSelectionDone, setInitialSelectionDone] = useState(false);
  const searchParams = useSearchParams();

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const params = useParams();
  const multisigId = params.adress as string;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!", {
        description: "Address copied to clipboard",
      });
    } catch (err) {
      toast.error("Failed to copy", {
        description: "Please try again",
      });
    }
  };

  useEffect(() => {
    const fetchAvailableAssets = async () => {
      if (!currentAccount) return;
      
      try {
        setIsLoading(true);
        
        const ownedObjects = await getOwnedObjects(currentAccount.address, multisigId);
        
        if (!ownedObjects) {
          console.warn('No assets found in multisig');
          return;
        }

        // Get locked objects for checking
        const lockedObjectIds = await getLockedObjects(currentAccount.address, multisigId);

        // Handle Coins
        if (ownedObjects.coins) {
          // Get coin types and ensure they start with 0x
          const coinTypes = ownedObjects.coins.map(coin => 
            coin.type.startsWith('0x') ? coin.type : `0x${coin.type}`
          );

          // Get coin decimals using our optimized helper
          const decimalsMap = await getMultipleCoinDecimals(coinTypes, suiClient);
          
          // Get metadata for symbols
          const validMetas = new Map<string, CoinMeta>();
          coinMetas.forEach((meta, key) => {
            if (meta !== null) {
              validMetas.set(key, meta);
            }
          });
          setCoinMetas(validMetas);

          // Format coins with metadata and decimals, including locked amount calculation
          const formattedCoins = ownedObjects.coins.map(coin => {
            const type = coin.type.startsWith('0x') ? coin.type : `0x${coin.type}`;
            const meta = validMetas.get(type);
            const decimals = decimalsMap.get(type) ?? 9;
            const baseAmount = BigInt(String(coin.totalAmount).replace('n', ''));
            
            // Calculate locked amount by summing up locked instances
            let lockedAmount = BigInt(0);
            if (coin.instances) {
              lockedAmount = coin.instances
                .filter(instance => lockedObjectIds.includes(instance.ref.objectId))
                .reduce((sum, instance) => sum + BigInt(String(instance.amount).replace('n', '')), BigInt(0));
            }

            // Calculate available amount
            const availableAmount = baseAmount - lockedAmount;
            const displayBalance = Number(formatCoinAmount(availableAmount > BigInt(0) ? availableAmount : BigInt(0), decimals, 10));
            
            return {
              type,
              amount: baseAmount,
              decimals,
              baseAmount,
              totalBalance: formatCoinAmount(baseAmount, decimals, 10),
              displayBalance,
              symbol: meta?.symbol ?? type.split('::').pop(),
              instances: coin.instances,
              lockedAmount,
              availableAmount: availableAmount > BigInt(0) ? availableAmount : BigInt(0)
            };
          });

          setAvailableCoins(formattedCoins);
        }

        // Separate NFTs and Objects
        if (ownedObjects.nfts) {
          const nfts = ownedObjects.nfts.map(nft => ({
            objectId: nft.ref.objectId,
            type: nft.type,
            display: nft.name || nft.type.split('::').pop(),
            image: nft.image,
            name: nft.name
          }));
          setAvailableNFTs(nfts);
        }

        if (ownedObjects.objects) {
          const objects = ownedObjects.objects.map(obj => ({
            objectId: obj.ref.objectId,
            type: obj.type,
            display: obj.type.split('::').pop(),
            fields: obj.fields
          }));
          setAvailableObjects(objects);
        }

      } catch (error) {
        console.error('Error fetching available assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableAssets();
  }, [currentAccount, multisigId, setCoinMetas, suiClient]);

  useEffect(() => {
    if (!initialSelectionDone && !isLoading && availableCoins.length > 0 && selectedCoins.length === 0) {
      const coinType = searchParams.get('coinType');
      if (coinType) {
        const coin = availableCoins.find(c => c.type === coinType);
        if (coin) {
          const availableAmount = coin.availableAmount || BigInt(0);
          const formattedAvailable = Number(formatCoinAmount(availableAmount, coin.decimals || 9, 10));
          onCoinsSelected([{
            coinType: coin.type,
            amount: 0,
            balance: Number(coin.totalBalance),
            baseBalance: coin.baseAmount,
            availableBalance: formattedAvailable
          }]);
        }
      }
      setInitialSelectionDone(true);
    }
  }, [availableCoins, isLoading, initialSelectionDone, searchParams, onCoinsSelected, selectedCoins.length]);

  useEffect(() => {
    const fetchLockedObjects = async () => {
      if (!currentAccount || !multisigId) return;
      
      try {
        const lockedObjects = await getLockedObjects(currentAccount.address, multisigId);
        if (lockedObjects) {
          setLockedObjects(lockedObjects);
        }
      } catch (error) {
        console.error('Error fetching locked objects:', error);
      }
    };

    fetchLockedObjects();
  }, [currentAccount, multisigId]);

  const addCoin = () => {
    if (availableCoins.length === 0) return;
    const firstCoin = availableCoins[0];
    onCoinsSelected([
      ...selectedCoins, 
      { 
        coinType: firstCoin.type, 
        amount: 0,
        balance: Number(firstCoin.totalBalance),
        baseBalance: firstCoin.baseAmount,
        availableBalance: firstCoin.displayBalance
      }
    ]);
  };

  const toggleObjectSelection = (object: ObjectSelection) => {
    const isSelected = selectedObjects.some(obj => obj.objectId === object.objectId);
    if (isSelected) {
      onObjectsSelected(selectedObjects.filter(obj => obj.objectId !== object.objectId));
    } else {
      onObjectsSelected([...selectedObjects, object]);
    }
  };

  const updateCoin = (index: number, field: keyof CoinSelection, value: string | number) => {
    const newCoins = [...selectedCoins];
    if (field === 'coinType') {
      const coin = availableCoins.find(c => c.type === value);
      if (!coin) return;

      const availableAmount = coin.availableAmount || BigInt(0);
      const formattedAvailable = Number(formatCoinAmount(availableAmount, coin.decimals || 9, 10));
      
      newCoins[index] = { 
        ...newCoins[index], 
        coinType: value as string,
        balance: Number(coin.totalBalance),
        baseBalance: coin.baseAmount,
        availableBalance: formattedAvailable,
        amount: 0 // Reset amount when coin type changes
      };
    } else if (field === 'amount') {
      // Parse the value to ensure we get a number with correct precision
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const coin = availableCoins.find(c => c.type === newCoins[index].coinType);
      if (coin) {
        // Format the number to match the same precision as getMaxAmount
        const formattedValue = Number(formatCoinAmount(
          BigInt(Math.round(numValue * Math.pow(10, coin.decimals || 9))),
          coin.decimals || 9,
          10
        ));
        newCoins[index] = { ...newCoins[index], amount: formattedValue };
      }
    } else {
      newCoins[index] = { ...newCoins[index], [field]: value };
    }
    onCoinsSelected(newCoins);
  };

  const removeCoin = (index: number) => {
    const newCoins = selectedCoins.filter((_, i) => i !== index);
    onCoinsSelected(newCoins);
  };

  const getMaxAmount = (coinType: string) => {
    const coin = availableCoins.find(c => c.type === coinType);
    if (!coin || !coin.decimals) return '0';
    // If all coins are locked, return 0
    if (coin.lockedAmount && coin.lockedAmount >= coin.baseAmount) {
      return '0';
    }
    return formatCoinAmount(coin.availableAmount || BigInt(0), coin.decimals, 10);
  };

  const getLockedAmount = (coinType: string) => {
    const coin = availableCoins.find(c => c.type === coinType);
    if (!coin || !coin.lockedAmount || coin.lockedAmount === BigInt(0)) return null;
    return formatCoinAmount(coin.lockedAmount, coin.decimals || 9, 10);
  };

  const getCoinBalance = (coinType: string) => {
    const coin = availableCoins.find(c => c.type === coinType);
    if (!coin) return null;

    const hasLockedAmount = coin.lockedAmount && coin.lockedAmount > BigInt(0);
    const totalFormatted = formatCoinAmount(coin.baseAmount, coin.decimals || 9, 10);
    const availableFormatted = formatCoinAmount(coin.availableAmount || BigInt(0), coin.decimals || 9, 10);
    
    if (hasLockedAmount) {
      if (coin.lockedAmount === coin.baseAmount) {
        return `Available: 0 ${coin.symbol} (Total: ${totalFormatted} ${coin.symbol})`;
      }
      return `Available: ${availableFormatted} ${coin.symbol} (Total: ${totalFormatted} ${coin.symbol})`;
    }
    return `Balance: ${totalFormatted} ${coin.symbol}`;
  };

  const truncateMiddle = (str: string, startLength = 7, endLength = 7) => {
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
  };

  const isObjectLocked = (objectId: string) => lockedObjects.includes(objectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'coins' | 'objects-nfts')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coins">Coins</TabsTrigger>
          <TabsTrigger value="objects-nfts">Objects & NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="coins" className="space-y-6">
          {selectedCoins.map((coin, index) => {
            const lockedAmount = getLockedAmount(coin.coinType);
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Coin {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCoin(index)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`coin-type-${index}`}>Coin Type</Label>
                    <Select
                      value={coin.coinType}
                      onValueChange={(value) => updateCoin(index, 'coinType', value)}
                    >
                      <SelectTrigger id={`coin-type-${index}`}>
                        <SelectValue placeholder="Select a coin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCoins.map((c) => (
                          <SelectItem key={c.type} value={c.type}>
                            {c.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {coin.coinType && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`amount-${index}`}>Amount</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            value={coin.amount || ''}
                            onChange={(e) => updateCoin(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="flex-1"
                            min="0"
                            max={getMaxAmount(coin.coinType)}
                          />
                          <Button
                            variant="outline"
                            onClick={() => updateCoin(index, 'amount', Number(getMaxAmount(coin.coinType)))}
                          >
                            Max
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getCoinBalance(coin.coinType)}
                        </p>
                      </div>

                      {lockedAmount && (
                        <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                          <AlertDescription>
                            {lockedAmount} {availableCoins.find(c => c.type === coin.coinType)?.symbol} locked in another proposal
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={addCoin}
            className="w-full"
            disabled={availableCoins.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Coin
          </Button>
        </TabsContent>

        <TabsContent value="objects-nfts" className="space-y-6">
          {/* NFTs Grid */}
          {availableNFTs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">NFTs</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableNFTs.map((nft) => {
                  const isSelected = selectedObjects.some(obj => obj.objectId === nft.objectId);
                  const isLocked = isObjectLocked(nft.objectId);
                  return (
                    <div
                      key={nft.objectId}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isLocked ? 'opacity-50 cursor-not-allowed border-yellow-500' :
                        isSelected ? 'border-primary' : 'border-transparent hover:border-primary/50'
                      }`}
                      onClick={() => !isLocked && toggleObjectSelection(nft)}
                    >
                      <img
                        src={nft.image}
                        alt={nft.name || "NFT"}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <p className="text-white text-sm truncate">
                          {nft.name || truncateMiddle(nft.type.split('::').pop() || '')}
                        </p>
                      </div>
                      {isLocked && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                          In Proposal
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Objects List */}
          {availableObjects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Objects</h3>
              <div className="space-y-3">
                {availableObjects.map((object) => {
                  const isSelected = selectedObjects.some(obj => obj.objectId === object.objectId);
                  const isLocked = isObjectLocked(object.objectId);
                  return (
                    <div
                      key={object.objectId}
                      className={`rounded-lg border transition-all ${
                        isLocked ? 'opacity-50 border-yellow-500 bg-yellow-50' :
                        isSelected ? 'border-primary bg-primary/5' : 'bg-card'
                      } text-card-foreground`}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">TYPE</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(object.type);
                                    }}
                                    className="flex items-center gap-1 text-sm hover:text-primary"
                                  >
                                    {truncateMiddle(object.type)}
                                    <Copy className="h-3 w-3 opacity-50" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs font-mono">{object.type}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">OBJECT ID</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(object.objectId);
                                    }}
                                    className="flex items-center gap-1 text-sm hover:text-primary"
                                  >
                                    {truncateMiddle(object.objectId)}
                                    <Copy className="h-3 w-3 opacity-50" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs font-mono">{object.objectId}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLocked ? (
                            <span className="text-sm text-yellow-600 font-medium px-2 py-1 bg-yellow-100 rounded">
                              In Proposal
                            </span>
                          ) : (
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleObjectSelection(object)}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === object.objectId ? null : object.objectId);
                            }}
                          >
                            {expandedId === object.objectId ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {expandedId === object.objectId && object.fields && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="text-xs text-muted-foreground mb-2">FIELDS</div>
                          <pre className="text-sm bg-muted/50 rounded-md p-2 overflow-x-auto">
                            {JSON.stringify(object.fields, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 