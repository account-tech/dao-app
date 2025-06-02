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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDaoClient } from "@/hooks/useDaoClient";
import { CoinSelection } from '../helpers/types';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { formatCoinAmount, getMultipleCoinDecimals } from "@/utils/GlobalHelpers";

interface AssetCoin {
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

interface VestingParams {
  startDate: Date;
  endDate: Date;
}

interface CoinAndDatesSelectionStepProps {
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
}: CoinAndDatesSelectionStepProps) {
  const [assetCoins, setAssetCoins] = useState<AssetCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedObjects, setLockedObjects] = useState<string[]>([]);
  const [initialSelectionDone, setInitialSelectionDone] = useState(false);
  const [vestingStartOpen, setVestingStartOpen] = useState(false);
  const [vestingEndOpen, setVestingEndOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const params = useParams();
  const { getOwnedObjects, getLockedObjects } = useDaoClient();
  const daoId = params.id as string;

  useEffect(() => {
    const fetchAssetCoins = async () => {
      if (!currentAccount || !daoId) return;
      
      try {
        setIsLoading(true);
        
        const ownedObjects = await getOwnedObjects(currentAccount.address, daoId);
        
        if (!ownedObjects?.coins) {
          console.warn('No coins found in DAO');
          return;
        }

        // Get locked objects for checking
        const lockedObjectIds = await getLockedObjects(currentAccount.address, daoId);
        setLockedObjects(lockedObjectIds);

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

        setAssetCoins(formattedCoins);

      } catch (error) {
        console.error('Error fetching asset coins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssetCoins();
  }, [currentAccount, setCoinMetas, suiClient, daoId]);

  useEffect(() => {
    if (!initialSelectionDone && !isLoading && assetCoins.length > 0 && selectedCoins.length === 0) {
      const coinType = searchParams.get('coinType');
      if (coinType) {
        const coin = assetCoins.find(c => c.type === coinType);
        if (coin) {
          onCoinsSelected([{
            coinType: coin.type,
            amount: 0,
            balance: coin.displayBalance,
            baseBalance: coin.baseAmount,
            availableBalance: coin.displayBalance
          }]);
        }
      } else {
        // Only auto-select first coin if no coinType in URL
        const firstCoin = assetCoins[0];
        onCoinsSelected([{
          coinType: firstCoin.type,
          amount: 0,
          balance: firstCoin.displayBalance,
          baseBalance: firstCoin.baseAmount,
          availableBalance: firstCoin.displayBalance
        }]);
      }
      setInitialSelectionDone(true);
    }
  }, [assetCoins, isLoading, initialSelectionDone, searchParams, onCoinsSelected, selectedCoins.length]);

  const updateCoin = (field: keyof CoinSelection, value: string | number) => {
    const coin = selectedCoins[0];
    if (field === 'coinType') {
      const assetCoin = assetCoins.find(c => c.type === value);
      if (!assetCoin) return;

      const availableAmount = assetCoin.availableAmount || BigInt(0);
      const formattedAvailable = Number(formatCoinAmount(availableAmount, assetCoin.decimals || 9, 10));

      onCoinsSelected([{ 
        coinType: value as string,
        amount: 0,
        balance: Number(assetCoin.totalBalance),
        baseBalance: assetCoin.baseAmount,
        availableBalance: formattedAvailable
      }]);
    } else if (field === 'amount') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const assetCoin = assetCoins.find(c => c.type === coin.coinType);
      if (assetCoin && !isNaN(numValue)) {
        const finalAmount = Math.min(Math.max(0, numValue), assetCoin.displayBalance);
        onCoinsSelected([{ 
          ...coin,
          amount: finalAmount
        }]);
      }
    }
  };

  const handleMaxAmount = () => {
    const coin = selectedCoins[0];
    const assetCoin = assetCoins.find(c => c.type === coin.coinType);
    if (assetCoin) {
      onCoinsSelected([{
        ...coin,
        amount: assetCoin.displayBalance
      }]);
    }
  };

  const getMaxAmount = (coinType: string) => {
    const coin = assetCoins.find(c => c.type === coinType);
    if (!coin || !coin.decimals) return '0';
    // If all coins are locked, return 0
    if (coin.lockedAmount && coin.lockedAmount >= coin.baseAmount) {
      return '0';
    }
    return formatCoinAmount(coin.availableAmount || BigInt(0), coin.decimals, 10);
  };

  const getCoinBalance = (coinType: string) => {
    const coin = assetCoins.find(c => c.type === coinType);
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

  const validateVestingDates = (startDate: Date, endDate: Date): string[] => {
    const now = new Date();
    const warnings: string[] = [];

    if (startDate.getTime() <= now.getTime()) {
      warnings.push("Warning: Vesting start time should be in the future for optimal vesting setup.");
    }

    if (endDate.getTime() <= startDate.getTime()) {
      warnings.push("Warning: Vesting end time must be after start time.");
    }

    const duration = endDate.getTime() - startDate.getTime();
    const minDuration = 60 * 60 * 1000; // 1 hour
    if (duration < minDuration) {
      warnings.push("Warning: Vesting period should be at least 1 hour for meaningful distribution.");
    }

    return warnings;
  };

  const handleVestingStartDateChange = (date: Date | undefined) => {
    if (!date) return;

    const newDate = new Date(date);
    newDate.setHours(vestingParams.startDate.getHours());
    newDate.setMinutes(vestingParams.startDate.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    const warnings = validateVestingDates(newDate, vestingParams.endDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    onVestingParamsChange({
      ...vestingParams,
      startDate: newDate
    });
  };

  const handleVestingStartTimeChange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(vestingParams.startDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    const warnings = validateVestingDates(newDate, vestingParams.endDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    onVestingParamsChange({
      ...vestingParams,
      startDate: newDate
    });
  };

  const handleVestingEndDateChange = (date: Date | undefined) => {
    if (!date) return;

    const newDate = new Date(date);
    newDate.setHours(vestingParams.endDate.getHours());
    newDate.setMinutes(vestingParams.endDate.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    const warnings = validateVestingDates(vestingParams.startDate, newDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    onVestingParamsChange({
      ...vestingParams,
      endDate: newDate
    });
  };

  const handleVestingEndTimeChange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(vestingParams.endDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    const warnings = validateVestingDates(vestingParams.startDate, newDate);
    setDateError(warnings.length > 0 ? warnings.join("\n") : null);

    onVestingParamsChange({
      ...vestingParams,
      endDate: newDate
    });
  };

  // Generate time options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const TimeSelect = ({ 
    date, 
    onTimeChange 
  }: { 
    date: Date, 
    onTimeChange: (time: string) => void 
  }) => {
    const currentHour = date.getHours().toString().padStart(2, '0');
    const currentMinute = date.getMinutes().toString().padStart(2, '0');

    return (
      <div className="flex gap-1">
        <Select
          value={currentHour}
          onValueChange={(hour) => onTimeChange(`${hour}:${currentMinute}`)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>

        <span className="flex items-center">:</span>

        <Select
          value={currentMinute}
          onValueChange={(minute) => onTimeChange(`${currentHour}:${minute}`)}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {minutes.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const getVestingRate = () => {
    const coin = selectedCoins[0];
    if (!coin?.amount || !vestingParams.startDate || !vestingParams.endDate) return null;

    const durationMinutes = (vestingParams.endDate.getTime() - vestingParams.startDate.getTime()) / (1000 * 60);
    if (durationMinutes <= 0) return null;

    const rate = coin.amount / durationMinutes;
    const coinSymbol = assetCoins.find(c => c.type === coin.coinType)?.symbol || 'tokens';
    
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

  const coin = selectedCoins[0] || { coinType: '', amount: 0 };
  const selectedAssetCoin = coin.coinType ? assetCoins.find(c => c.type === coin.coinType) : null;
  const hasLockedAmount = selectedAssetCoin?.lockedAmount !== undefined && selectedAssetCoin.lockedAmount > BigInt(0);

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
              value={coin.coinType}
              onValueChange={(value) => updateCoin('coinType', value)}
            >
              <SelectTrigger id="coin-type">
                <SelectValue placeholder="Select a coin" />
              </SelectTrigger>
              <SelectContent>
                {assetCoins.map((c) => (
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
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    value={coin.amount || ''}
                    onChange={(e) => updateCoin('amount', e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                    min="0"
                    step="1"
                    max={getMaxAmount(coin.coinType)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleMaxAmount}
                  >
                    Max
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getCoinBalance(coin.coinType)}
                </p>
              </div>

              {hasLockedAmount && (
                <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                  <AlertDescription>
                    {formatCoinAmount(selectedAssetCoin.lockedAmount!, selectedAssetCoin.decimals || 9, 10)} {selectedAssetCoin.symbol} locked in another proposal
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Vesting Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dateError && (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="whitespace-pre-line">{dateError}</AlertDescription>
            </Alert>
          )}

          {/* Vesting Start Date and Time */}
          <div className="space-y-2">
            <Label>Vesting Start Date & Time</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover open={vestingStartOpen} onOpenChange={setVestingStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !vestingParams.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vestingParams.startDate ? format(vestingParams.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={vestingParams.startDate}
                    onSelect={handleVestingStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2 h-12 px-3 border rounded-md">
                <Clock className="h-4 w-4 text-gray-500" />
                <TimeSelect
                  date={vestingParams.startDate} 
                  onTimeChange={handleVestingStartTimeChange}
                />
              </div>
            </div>
          </div>

          {/* Vesting End Date and Time */}
          <div className="space-y-2">
            <Label>Vesting End Date & Time</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Popover open={vestingEndOpen} onOpenChange={setVestingEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !vestingParams.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vestingParams.endDate ? format(vestingParams.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={vestingParams.endDate}
                    onSelect={handleVestingEndDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2 h-12 px-3 border rounded-md">
                <Clock className="h-4 w-4 text-gray-500" />
                <TimeSelect 
                  date={vestingParams.endDate} 
                  onTimeChange={handleVestingEndTimeChange}
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