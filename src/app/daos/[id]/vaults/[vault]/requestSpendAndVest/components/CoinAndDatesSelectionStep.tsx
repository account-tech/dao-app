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
import { format } from 'date-fns';
import { formatCoinAmount, getMultipleCoinDecimals } from "@/utils/GlobalHelpers";

interface VaultCoin {
  type: string;
  amount: bigint;
  totalBalance: string;
  symbol: string;
  decimals: number;
  displayBalance: number;
}

interface VestingParams {
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
}

interface CoinSelectionStepProps {
  selectedCoins: CoinSelection[];
  onCoinsSelected: (coins: CoinSelection[]) => void;
  coinMetas: Map<string, CoinMeta>;
  setCoinMetas: (metas: Map<string, CoinMeta>) => void;
  vestingParams: VestingParams;
  onVestingParamsChange: (params: VestingParams) => void;
}

export function CoinAndDatesSelectionStep({ 
  selectedCoins, 
  onCoinsSelected,
  coinMetas,
  setCoinMetas,
  vestingParams,
  onVestingParamsChange
}: CoinSelectionStepProps) {
  const [vaultCoins, setVaultCoins] = useState<VaultCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const urlCoinType = searchParams.get('coinType');

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
        setError(null);
        
        const fetchedVaults = await getVaults(currentAccount.address, daoId);
        const vaultData = fetchedVaults?.[vaultId];
        
        if (!vaultData?.coins) {
          setError('Vault not found or has no coins');
          setVaultCoins([]);
          return;
        }

        // Normalize coin types and amounts
        const coinEntries = Object.entries(vaultData.coins).map(([type, amount]) => ({
          type: type.startsWith('0x') ? type : `0x${type}`,
          amount: BigInt(String(amount).replace('n', '')),
        }));

        if (coinEntries.length === 0) {
          setVaultCoins([]);
          return;
        }

        // Get coin decimals efficiently
        const coinTypes = coinEntries.map(coin => coin.type);
        const decimalsMap = await getMultipleCoinDecimals(coinTypes, suiClient);
        
        // Process valid metadata
        const validMetas = new Map<string, CoinMeta>();
        coinMetas.forEach((meta, key) => {
          if (meta) validMetas.set(key, meta);
        });
        setCoinMetas(validMetas);

        // Create formatted coins
        const formattedCoins: VaultCoin[] = coinEntries.map(coin => {
          const meta = validMetas.get(coin.type);
          const decimals = decimalsMap.get(coin.type) ?? 9;
          const totalBalance = formatCoinAmount(coin.amount, decimals);
          const displayBalance = Number(totalBalance);
          
          return {
            type: coin.type,
            amount: coin.amount,
            decimals,
            totalBalance,
            displayBalance,
            symbol: meta?.symbol ?? coin.type.split('::').pop() ?? 'Unknown'
          };
        });

        setVaultCoins(formattedCoins);

        // Initialize selection if needed
        if (selectedCoins.length === 0 && formattedCoins.length > 0) {
          const initialCoin = urlCoinType 
            ? formattedCoins.find(c => c.type === urlCoinType) || formattedCoins[0]
            : formattedCoins[0];
          
          onCoinsSelected([{
            coinType: initialCoin.type,
            amount: 0,
            balance: initialCoin.displayBalance,
            baseBalance: initialCoin.amount
          }]);
        } else if (selectedCoins.length > 0) {
          // Update existing selection with correct balance
          const updatedCoins = selectedCoins.map(selected => {
            const vaultCoin = formattedCoins.find(vc => vc.type === selected.coinType);
            return vaultCoin ? {
              ...selected,
              balance: vaultCoin.displayBalance,
              baseBalance: vaultCoin.amount
            } : selected;
          });
          onCoinsSelected(updatedCoins);
        }

      } catch (err) {
        console.error('Error fetching vault coins:', err);
        setError('Failed to load vault coins');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVaultCoins();
  }, [currentAccount?.address, vaultId, daoId, suiClient, urlCoinType, setCoinMetas]);

  const updateCoinSelection = (coinType: string) => {
    const vaultCoin = vaultCoins.find(vc => vc.type === coinType);
    if (!vaultCoin) return;

    onCoinsSelected([{
      coinType,
      amount: 0,
      balance: vaultCoin.displayBalance,
      baseBalance: vaultCoin.amount
    }]);
  };

  const updateAmount = (amountStr: string) => {
    const coin = selectedCoins[0];
    if (!coin) return;

    const numValue = parseFloat(amountStr) || 0;
    const vaultCoin = vaultCoins.find(vc => vc.type === coin.coinType);
    if (!vaultCoin) return;

    const clampedAmount = Math.min(Math.max(0, numValue), vaultCoin.displayBalance);
    onCoinsSelected([{ ...coin, amount: clampedAmount }]);
  };

  const setMaxAmount = () => {
    const coin = selectedCoins[0];
    const vaultCoin = vaultCoins.find(vc => vc.type === coin?.coinType);
    if (!coin || !vaultCoin) return;

    onCoinsSelected([{ ...coin, amount: vaultCoin.displayBalance }]);
  };

  const handleDateTimeChange = (field: keyof VestingParams, value: string) => {
    const newParams = { ...vestingParams };
    
    if (field === 'startDate' || field === 'endDate') {
      const date = new Date(value);
      const timeField = field === 'startDate' ? vestingParams.startTime : vestingParams.endTime;
      const [hours = 0, minutes = 0] = timeField.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      newParams[field] = date;
    } else {
      newParams[field] = value;
      const dateField = field === 'startTime' ? 'startDate' : 'endDate';
      const date = new Date(newParams[dateField]);
      const [hours = 0, minutes = 0] = value.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      newParams[dateField] = date;
    }
    
    onVestingParamsChange(newParams);
  };

  const getVestingRate = () => {
    const coin = selectedCoins[0];
    if (!coin?.amount || !vestingParams.startDate || !vestingParams.endDate) return null;

    const durationMinutes = (vestingParams.endDate.getTime() - vestingParams.startDate.getTime()) / (1000 * 60);
    if (durationMinutes <= 0) return null;

    const rate = coin.amount / durationMinutes;
    const coinSymbol = vaultCoins.find(c => c.type === coin.coinType)?.symbol || 'tokens';
    
    return `${rate.toFixed(6)} ${coinSymbol} / minute`;
  };

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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const selectedCoin = selectedCoins[0];
  const selectedVaultCoin = selectedCoin ? vaultCoins.find(c => c.type === selectedCoin.coinType) : null;

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
              onValueChange={updateCoinSelection}
            >
              <SelectTrigger id="coin-type">
                <SelectValue placeholder="Select a coin" />
              </SelectTrigger>
              <SelectContent>
                {vaultCoins.map((coin) => (
                  <SelectItem key={coin.type} value={coin.type}>
                    {coin.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCoin && selectedVaultCoin && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={selectedCoin.amount || ''}
                  onChange={(e) => updateAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1"
                  min="0"
                  max={selectedVaultCoin.totalBalance}
                  step="any"
                />
                <Button variant="outline" onClick={setMaxAmount}>
                  Max
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Balance: {selectedVaultCoin.totalBalance} {selectedVaultCoin.symbol}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Vesting Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">From</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="start-date"
                  type="date"
                  value={format(vestingParams.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateTimeChange('startDate', e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <Input
                  id="start-time"
                  type="time"
                  value={vestingParams.startTime}
                  onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">To</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="end-date"
                  type="date"
                  value={format(vestingParams.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateTimeChange('endDate', e.target.value)}
                  min={format(vestingParams.startDate, 'yyyy-MM-dd')}
                />
                <Input
                  id="end-time"
                  type="time"
                  value={vestingParams.endTime}
                  onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {getVestingRate() && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Vesting Rate: {getVestingRate()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 