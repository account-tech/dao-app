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
import { format, addDays } from 'date-fns';
import { cn } from "@/lib/utils";
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
  const [vestingStartOpen, setVestingStartOpen] = useState(false);
  const [vestingEndOpen, setVestingEndOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  
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
      startDate: newDate,
      startTime: time
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
      endDate: newDate,
      endTime: time
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