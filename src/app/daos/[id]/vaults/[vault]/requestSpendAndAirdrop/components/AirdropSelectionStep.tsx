'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoinMeta } from '@polymedia/suitcase-core';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaoClient } from "@/hooks/useDaoClient";
import { CoinSelection, Recipient } from '../helpers/types';
import { formatCoinAmount, getMultipleCoinDecimals } from "@/utils/GlobalHelpers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VaultCoin {
  type: string;
  amount: bigint;
  totalBalance?: string;
  symbol?: string;
  decimals?: number;
  baseAmount: bigint;
  displayBalance: number;
}

interface AirDropSelectionStepProps {
  selectedCoins: CoinSelection[];
  onCoinsSelected: (coins: CoinSelection[]) => void;
  coinMetas: Map<string, CoinMeta>;
  setCoinMetas: (metas: Map<string, CoinMeta>) => void;
  recipients: Recipient[];
  onRecipientsUpdated: (recipients: Recipient[]) => void;
}

type DistributionMode = 'total' | 'per_address';

export function AirDropSelectionStep({ 
  selectedCoins, 
  onCoinsSelected,
  coinMetas,
  setCoinMetas,
  recipients,
  onRecipientsUpdated
}: AirDropSelectionStepProps) {
  const [vaultCoins, setVaultCoins] = useState<VaultCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('total');
  const [amount, setAmount] = useState<string>('');

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const params = useParams();
  const { getVaults } = useDaoClient();
  
  const daoId = params.id as string;
  const vaultId = typeof params.vault === 'string' 
    ? decodeURIComponent(params.vault) 
    : Array.isArray(params.vault) 
    ? decodeURIComponent(params.vault[0]) 
    : '';

  useEffect(() => {
    const fetchVaultCoins = async () => {
      if (!currentAccount?.address || !vaultId || !daoId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Fetch vault data
        const fetchedVaults = (await getVaults(currentAccount.address, daoId));
        
        if (!fetchedVaults || !fetchedVaults[vaultId]) {
          console.warn('Vault not found:', vaultId);
          return;
        }

        // Transform vault coins and ensure 0x prefix
        const vaultData = Object.entries(fetchedVaults[vaultId].coins || {}).map(([type, amount]) => ({
          type: type.startsWith('0x') ? type : `0x${type}`,
          amount: BigInt(String(amount).replace('n', '')),
        }));

        // Get coin decimals using our optimized helper
        const coinTypes = vaultData.map(coin => coin.type);
        const decimalsMap = await getMultipleCoinDecimals(coinTypes, suiClient);
        
        // Get metadata for symbols
        const validMetas = new Map<string, CoinMeta>();
        coinMetas.forEach((meta, key) => {
          if (meta !== null) {
            validMetas.set(key, meta);
          }
        });
        setCoinMetas(validMetas);

        // Format coins with metadata and decimals
        const formattedCoins = vaultData.map(coin => {
          const meta = validMetas.get(coin.type);
          const decimals = decimalsMap.get(coin.type) ?? 9;
          const formattedAmount = formatCoinAmount(coin.amount, decimals);
          const displayBalance = Number(formattedAmount);
          
          return {
            ...coin,
            decimals,
            baseAmount: coin.amount,
            totalBalance: formattedAmount,
            displayBalance,
            symbol: meta?.symbol ?? coin.type.split('::').pop()
          };
        });

        setVaultCoins(formattedCoins);

        // Initialize with first coin if no coin is selected
        if (selectedCoins.length === 0 && formattedCoins.length > 0) {
          const firstCoin = formattedCoins[0];
          onCoinsSelected([{
            coinType: firstCoin.type,
            amount: 0,
            balance: firstCoin.displayBalance,
            baseBalance: firstCoin.baseAmount
          }]);
        }

      } catch (error) {
        console.error('Error fetching vault coins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultCoins();
  }, [currentAccount?.address, vaultId, daoId, suiClient, setCoinMetas]);

  const updateRecipientAmounts = (totalAmount: number, perAddressAmount: number) => {
    const updatedRecipients = recipients.map(recipient => ({
      ...recipient,
      amount: perAddressAmount
    }));
    onRecipientsUpdated(updatedRecipients);
  };

  const updateCoin = (field: 'coinType' | 'amount', value: string | number) => {
    const newCoin = { ...selectedCoins[0] };
    
    if (field === 'coinType') {
      const vaultCoin = vaultCoins.find(vc => vc.type === value);
      Object.assign(newCoin, {
        coinType: value as string,
        balance: vaultCoin ? vaultCoin.displayBalance : 0,
        baseBalance: vaultCoin ? vaultCoin.baseAmount : BigInt(0),
        amount: 0
      });
      setAmount('');
      // Reset recipient amounts when coin changes
      updateRecipientAmounts(0, 0);
    } else {
      const numValue = Number(value);
      const totalAmount = distributionMode === 'total' ? numValue : numValue * recipients.length;
      const perAddressAmount = distributionMode === 'total' ? numValue / recipients.length : numValue;
      
      // Store the per-address amount in the coin
      newCoin.amount = perAddressAmount;
      setAmount(value.toString());
      
      // Update recipient amounts
      updateRecipientAmounts(totalAmount, perAddressAmount);
    }
    
    onCoinsSelected([newCoin]);
  };

  const handleDistributionModeChange = (mode: DistributionMode) => {
    setDistributionMode(mode);
    if (amount && selectedCoins[0]) {
      const numAmount = Number(amount);
      const newCoin = { ...selectedCoins[0] };
      
      // When switching modes, we need to recalculate based on the current amount
      const totalAmount = mode === 'total' ? numAmount : numAmount * recipients.length;
      const perAddressAmount = mode === 'total' ? numAmount / recipients.length : numAmount;
      
      // Store the per-address amount in the coin
      newCoin.amount = perAddressAmount;
      onCoinsSelected([newCoin]);
      
      // Update recipient amounts when mode changes
      updateRecipientAmounts(totalAmount, perAddressAmount);
    }
  };

  const getMaxAmount = (coinType: string) => {
    const coin = vaultCoins.find(c => c.type === coinType);
    return coin?.totalBalance || '0';
  };

  const getCoinBalance = (coinType: string) => {
    const coin = vaultCoins.find(c => c.type === coinType);
    if (!coin) return null;
    return `Balance: ${coin.totalBalance} ${coin.symbol}`;
  };

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

  const selectedCoin = selectedCoins[0];
  const recipientCount = recipients.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Set coins and amounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>1. Coin</Label>
            <Select
              value={selectedCoin?.coinType || ''}
              onValueChange={(value) => updateCoin('coinType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select coin" />
              </SelectTrigger>
              <SelectContent>
                {vaultCoins.map((c) => (
                  <SelectItem key={c.type} value={c.type}>
                    {c.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCoin?.coinType && (
            <div className="space-y-4">
              <div>
                <Label>2. Amount</Label>
                <div className="mt-2">
                  <Tabs
                    defaultValue="total"
                    value={distributionMode}
                    onValueChange={(value) => handleDistributionModeChange(value as DistributionMode)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-black">
                      <TabsTrigger value="total" className="text-white data-[state=active]:text-black">Total</TabsTrigger>
                      <TabsTrigger value="per_address" className="text-white data-[state=active]:text-black">Per address</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => updateCoin('amount', e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                    min="0"
                    max={distributionMode === 'total' 
                      ? getMaxAmount(selectedCoin.coinType)
                      : Number(getMaxAmount(selectedCoin.coinType)) / recipientCount
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const maxTotal = Number(getMaxAmount(selectedCoin.coinType));
                      const value = distributionMode === 'total' 
                        ? maxTotal 
                        : maxTotal / recipientCount;
                      setAmount(value.toString());
                      updateCoin('amount', value);
                    }}
                  >
                    Max
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getCoinBalance(selectedCoin.coinType)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {distributionMode === 'total' 
                    ? `Total: ${Number(amount)} ${selectedCoin?.coinType ? vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol : ''} (${(Number(amount) / recipientCount).toFixed(4)} per address)`
                    : `Total: ${(Number(amount) * recipientCount).toFixed(4)} ${selectedCoin?.coinType ? vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol : ''} (${Number(amount)} per address)`
                  }
                </p>
                {selectedCoin && amount && (
                  distributionMode === 'total' 
                    ? Number(amount) > Number(getMaxAmount(selectedCoin.coinType))
                    : (Number(amount) * recipientCount) > Number(getMaxAmount(selectedCoin.coinType))
                ) && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>
                      The total amount exceeds the available balance of {getMaxAmount(selectedCoin.coinType)} {vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 