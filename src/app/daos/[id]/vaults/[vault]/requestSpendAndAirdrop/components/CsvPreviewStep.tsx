'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useParams } from 'next/navigation';
import { CoinMeta } from '@polymedia/suitcase-core';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDaoClient } from "@/hooks/useDaoClient";
import { CoinSelection, Recipient } from '../helpers/types';
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

interface CsvPreviewStepProps {
  selectedCoins: CoinSelection[];
  onCoinsSelected: (coins: CoinSelection[]) => void;
  coinMetas: Map<string, CoinMeta>;
  setCoinMetas: (metas: Map<string, CoinMeta>) => void;
  recipients: Recipient[];
}

export function CsvPreviewStep({
  selectedCoins,
  onCoinsSelected,
  coinMetas,
  setCoinMetas,
  recipients
}: CsvPreviewStepProps) {
  const [vaultCoins, setVaultCoins] = useState<VaultCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Calculate total amount from recipients
  const totalAmount = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);

  useEffect(() => {
    const fetchVaultCoins = async () => {
      if (!currentAccount?.address || !vaultId || !daoId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedVaults = (await getVaults(currentAccount.address, daoId));
        
        if (!fetchedVaults || !fetchedVaults[vaultId]) {
          console.warn('Vault not found:', vaultId);
          return;
        }

        const vaultData = Object.entries(fetchedVaults[vaultId].coins || {}).map(([type, amount]) => ({
          type: type.startsWith('0x') ? type : `0x${type}`,
          amount: BigInt(String(amount).replace('n', '')),
        }));

        const coinTypes = vaultData.map(coin => coin.type);
        const decimalsMap = await getMultipleCoinDecimals(coinTypes, suiClient);
        
        const validMetas = new Map<string, CoinMeta>();
        coinMetas.forEach((meta, key) => {
          if (meta !== null) {
            validMetas.set(key, meta);
          }
        });
        setCoinMetas(validMetas);

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
            amount: totalAmount, // Set the total amount from CSV
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
  }, [currentAccount?.address, vaultId, daoId, suiClient, setCoinMetas, totalAmount]);

  const updateSelectedCoin = (coinType: string) => {
    const vaultCoin = vaultCoins.find(vc => vc.type === coinType);
    if (vaultCoin) {
      onCoinsSelected([{
        coinType: coinType,
        amount: totalAmount,
        balance: vaultCoin.displayBalance,
        baseBalance: vaultCoin.baseAmount
      }]);
    }
  };

  const getMaxAmount = (coinType: string) => {
    const coin = vaultCoins.find(c => c.type === coinType);
    return coin?.totalBalance || '0';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-[200px]" />
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
          <CardTitle className="text-base font-medium">CSV Upload Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Coin Type for Distribution</Label>
            <Select
              value={selectedCoin?.coinType || ''}
              onValueChange={updateSelectedCoin}
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

          {selectedCoin && (
            <>
              <div className="space-y-2">
                <Label>Distribution Summary</Label>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm">Total Recipients: {recipients.length}</p>
                  <p className="text-sm">Total Amount: {totalAmount} {vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol}</p>
                  <p className="text-sm text-muted-foreground">Available Balance: {getMaxAmount(selectedCoin.coinType)} {vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol}</p>
                </div>
              </div>

              {totalAmount > Number(getMaxAmount(selectedCoin.coinType)) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    The total amount from your CSV ({totalAmount}) exceeds the available balance of {getMaxAmount(selectedCoin.coinType)} {vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Recipients Preview</Label>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                      <span className="text-sm font-mono">{recipient.address.slice(0, 6)}...{recipient.address.slice(-4)}</span>
                      <span className="text-sm">{recipient.amount} {vaultCoins.find(c => c.type === selectedCoin.coinType)?.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 