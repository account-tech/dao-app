'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoinMeta } from '@polymedia/suitcase-core';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaoClient } from "@/hooks/useDaoClient";
import { CoinSelection } from '../helpers/types';
import { formatCoinAmount, getMultipleCoinDecimals } from "@/utils/GlobalHelpers";

interface VaultCoin {
  type: string;
  amount: bigint;
  totalBalance?: string;
  symbol?: string;
  decimals?: number;
  baseAmount: bigint;
  displayBalance: number;
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
  const [vaultCoins, setVaultCoins] = useState<VaultCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const urlCoinType = searchParams.get('coinType');

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const params = useParams();
  const { getVaults } = useDaoClient();
  const daoId = params.id as string;
  const vaultParam = typeof params.vault === 'string' 
    ? decodeURIComponent(params.vault) 
    : Array.isArray(params.vault) 
    ? decodeURIComponent(params.vault[0]) 
    : '';
  const vaultId = vaultParam.replace('$vault', '');

  useEffect(() => {
    const fetchVaultCoins = async () => {
      if (!currentAccount || !vaultId) return;
      
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
          const formattedAmount = formatCoinAmount(coin.amount, decimals, 10);
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

        // Initialize with URL coinType if present, otherwise use first coin
        if (selectedCoins.length === 0) {
          let coinToSelect;
          if (urlCoinType) {
            coinToSelect = formattedCoins.find(c => c.type === urlCoinType);
          }
          if (!coinToSelect && formattedCoins.length > 0) {
            coinToSelect = formattedCoins[0];
          }
          
          if (coinToSelect) {
            onCoinsSelected([{
              coinType: coinToSelect.type,
              amount: 0,
              balance: coinToSelect.displayBalance,
              baseBalance: coinToSelect.baseAmount
            }]);
          }
        }

      } catch (error) {
        console.error('Error fetching vault coins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultCoins();
  }, [currentAccount, vaultId, setCoinMetas, suiClient, daoId, urlCoinType]);

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
    } else {
      newCoin.amount = Number(value);
    }
    onCoinsSelected([newCoin]);
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
              value={selectedCoin?.coinType || ''}
              onValueChange={(value) => updateCoin('coinType', value)}
            >
              <SelectTrigger id="coin-type">
                <SelectValue placeholder="Select a coin" />
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
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={selectedCoin.amount || ''}
                  onChange={(e) => updateCoin('amount', e.target.value)}
                  placeholder="0.00"
                  className="flex-1"
                  min="0"
                  max={getMaxAmount(selectedCoin.coinType)}
                />
                <Button
                  variant="outline"
                  onClick={() => updateCoin('amount', Number(getMaxAmount(selectedCoin.coinType)))}
                >
                  Max
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {getCoinBalance(selectedCoin.coinType)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 