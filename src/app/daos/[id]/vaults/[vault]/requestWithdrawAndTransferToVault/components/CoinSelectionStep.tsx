'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoinMeta } from '@polymedia/suitcase-core';
import { useDaoClient } from '@/hooks/useDaoClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCoinAmount, getMultipleCoinDecimals } from "@/utils/GlobalHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MultisigCoin {
  type: string;
  balance: bigint;
  totalBalance?: string;
  symbol?: string;
  decimals?: number;
  baseAmount: bigint;
  lockedAmount?: bigint;
  availableAmount?: bigint;
  instances?: Array<{
    amount: bigint;
    ref: {
      objectId: string;
    };
  }>;
}

interface CoinSelection {
  type: string;
  amount: string;
  availableBalance?: number;
}

interface CoinSelectionStepProps {
  selectedCoins: CoinSelection[];
  onCoinsSelected: (coins: CoinSelection[]) => void;
  coinMetas: Map<string, CoinMeta>;
  setCoinMetas: (metas: Map<string, CoinMeta>) => void;
}

export function CoinSelectionStep({ 
  selectedCoins, 
  onCoinsSelected,
  coinMetas,
  setCoinMetas
}: CoinSelectionStepProps) {
  const [multisigCoins, setMultisigCoins] = useState<MultisigCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedObjects, setLockedObjects] = useState<string[]>([]);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const params = useParams();
  const { getOwnedObjects, getLockedObjects } = useDaoClient();
  const daoId = params.id as string;
  const vaultName = params.vault as string;

  useEffect(() => {
    const fetchAvailableAssets = async () => {
      if (!currentAccount) return;
      
      try {
        setIsLoading(true);
        
        const ownedObjects = await getOwnedObjects(currentAccount.address, daoId);
        
        if (!ownedObjects) {
          console.warn('No assets found in DAO');
          return;
        }

        // Get locked objects for checking
        const lockedObjectIds = await getLockedObjects(currentAccount.address, daoId);
        setLockedObjects(lockedObjectIds);

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
            
            return {
              type,
              balance: baseAmount,
              decimals,
              baseAmount,
              totalBalance: formatCoinAmount(baseAmount, decimals, 10),
              symbol: meta?.symbol ?? type.split('::').pop(),
              instances: coin.instances,
              lockedAmount,
              availableAmount: availableAmount > BigInt(0) ? availableAmount : BigInt(0)
            };
          });

          setMultisigCoins(formattedCoins);
        }

      } catch (error) {
        console.error('Error fetching available assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableAssets();
  }, [currentAccount, daoId, setCoinMetas, suiClient]);

  const updateCoin = (field: 'type' | 'amount', value: string) => {
    const newCoin = { ...selectedCoins[0] };
    if (field === 'type') {
      // Reset amount when coin type changes
      const coin = multisigCoins.find(c => c.type === value);
      if (!coin) return;
      
      const availableAmount = coin.availableAmount || coin.baseAmount;
      const formattedAvailable = Number(formatCoinAmount(availableAmount, coin.decimals || 9, 10));
      
      newCoin.type = value;
      newCoin.amount = '0';
      newCoin.availableBalance = formattedAvailable;
    } else {
      newCoin[field] = value;
    }
    onCoinsSelected([newCoin]);
  };

  const getMaxAmount = (coinType: string) => {
    const coin = multisigCoins.find(c => c.type === coinType);
    if (!coin || !coin.decimals) return '0';
    // If all coins are locked, return 0
    if (coin.lockedAmount && coin.lockedAmount >= coin.baseAmount) {
      return '0';
    }
    return formatCoinAmount(coin.availableAmount || BigInt(0), coin.decimals, 10);
  };

  const getLockedAmount = (coinType: string) => {
    const coin = multisigCoins.find(c => c.type === coinType);
    if (!coin || !coin.lockedAmount || coin.lockedAmount === BigInt(0)) return null;
    return formatCoinAmount(coin.lockedAmount, coin.decimals || 9, 10);
  };

  const getCoinBalance = (coinType: string) => {
    const coin = multisigCoins.find(c => c.type === coinType);
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

  useEffect(() => {
    // Initialize with empty coin if none exists
    if (selectedCoins.length === 0) {
      onCoinsSelected([{ type: '', amount: '' }]);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show alert if no coins are available
  if (!isLoading && multisigCoins.length === 0) {
    return (
      <div className="space-y-6">
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            This DAO currently has no coins available to transfer to the vault. The DAO wallet appears to be empty or all coins are locked in other proposals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedCoin = selectedCoins[0] || { type: '', amount: '' };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Select Coin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coin-type">Coin Type</Label>
            <Select
              value={selectedCoin.type}
              onValueChange={(value) => updateCoin('type', value)}
            >
              <SelectTrigger id="coin-type">
                <SelectValue placeholder="Select a coin" />
              </SelectTrigger>
              <SelectContent>
                {multisigCoins.map((c) => (
                  <SelectItem key={c.type} value={c.type}>
                    {c.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCoin.type && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={selectedCoin.amount}
                  onChange={(e) => updateCoin('amount', e.target.value)}
                  placeholder="0.00"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => updateCoin('amount', getMaxAmount(selectedCoin.type))}
                >
                  Max
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {getCoinBalance(selectedCoin.type)}
              </p>
              {getLockedAmount(selectedCoin.type) && (
                <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                  <AlertDescription>
                    {getLockedAmount(selectedCoin.type)} {multisigCoins.find(c => c.type === selectedCoin.type)?.symbol} locked in another proposal
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 