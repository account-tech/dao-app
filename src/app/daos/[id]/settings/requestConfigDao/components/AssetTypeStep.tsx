'use client';

import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getMultipleCoinDecimals, formatCoinAmount, getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import { StepProps } from "../helpers/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";

interface CoinOption {
  type: string;
  balance: string;
  decimals?: number;
  displayBalance?: string;
}

const trimAddress = (address: string, length: number = 10) => {
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const AssetTypeStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [open, setOpen] = useState(false);
  const [coins, setCoins] = useState<CoinOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(formData.assetType || "");
  const originalConfig = useOriginalDaoConfig();

  useEffect(() => {
    const fetchCoins = async () => {
      if (!currentAccount) return;

      try {
        setLoading(true);
        const objects = await suiClient.getAllCoins({
          owner: currentAccount.address,
        });

        // Get unique coin types
        const uniqueCoins = objects.data.reduce((acc: CoinOption[], coin) => {
          const existing = acc.find(c => c.type === coin.coinType);
          if (existing) {
            existing.balance = (BigInt(existing.balance) + BigInt(coin.balance)).toString();
          } else {
            acc.push({
              type: coin.coinType,
              balance: coin.balance,
            });
          }
          return acc;
        }, []);

        // Get decimals for all coin types
        const decimalsMap = await getMultipleCoinDecimals(
          uniqueCoins.map(coin => coin.type),
          suiClient
        );

        // Format balances with correct decimals
        const coinsWithBalances = uniqueCoins.map(coin => ({
          ...coin,
          decimals: decimalsMap.get(coin.type) || 9,
          displayBalance: formatCoinAmount(coin.balance, decimalsMap.get(coin.type) || 9)
        }));

        setCoins(coinsWithBalances);
      } catch (error) {
        console.error('Error fetching coins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [currentAccount, suiClient]);

  useEffect(() => {
    // Update input value when formData.assetType changes
    setInputValue(formData.assetType || "");
  }, [formData.assetType]);

  const handleSelect = (value: string) => {
    const wrappedCoinType = `0x2::coin::Coin<${value}>`;
    updateFormData({ assetType: wrappedCoinType });
    setInputValue(wrappedCoinType);
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    // If the input already contains the wrapper, use it as is
    if (value.startsWith('0x2::coin::Coin<') && value.endsWith('>')) {
      setInputValue(value);
      updateFormData({ assetType: value });
    } else {
      // Otherwise, wrap it
      const wrappedValue = `0x2::coin::Coin<${value}>`;
      setInputValue(wrappedValue);
      updateFormData({ assetType: wrappedValue });
    }
  };

  // Helper function to check if a coin type matches the current asset type
  const isCurrentAssetType = (coinType: string) => {
    const simplifiedCurrent = getSimplifiedAssetType(formData.assetType);
    return coinType === simplifiedCurrent;
  };

  return (
    <div className="space-y-6">
      {/* Current Asset Type Display */}
      <div className="space-y-2">
        <Label>Current Asset Type</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm break-all">
            {trimAddress(originalConfig.assetType, 20)}
          </code>
        </div>
      </div>

      {/* New Asset Type Selection */}
      <div className="space-y-2">
        <Label>Select New Asset Type</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {loading ? (
                <span className="text-gray-500">Loading coins...</span>
              ) : formData.assetType !== originalConfig.assetType ? (
                <span>{trimAddress(getSimplifiedAssetType(formData.assetType))}</span>
              ) : (
                <span>{trimAddress(getSimplifiedAssetType(originalConfig.assetType))}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Search or enter coin type..." 
                value={inputValue}
                onValueChange={handleInputChange}
              />
              <CommandList>
                <CommandEmpty>
                  {inputValue ? (
                    <div className="py-3 px-4">
                      <p>Using custom coin type:</p>
                      <p className="font-mono text-sm mt-1">{inputValue}</p>
                    </div>
                  ) : (
                    <p className="py-3 px-4">No coin found.</p>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {coins.map((coin) => {
                    const isCurrent = isCurrentAssetType(coin.type);
                    return (
                      <CommandItem
                        key={coin.type}
                        value={coin.type}
                        onSelect={() => handleSelect(coin.type)}
                        className={cn(
                          "flex items-center justify-between",
                          isCurrent && "bg-teal-50"
                        )}
                      >
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.assetType === `0x2::coin::Coin<${coin.type}>` ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <span>{trimAddress(coin.type)}</span>
                            {isCurrent && (
                              <span className="text-xs text-teal-600 font-medium">(Selected)</span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-500 ml-8">Balance: {coin.displayBalance}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Warning when asset type is changed */}
      {formData.assetType !== originalConfig.assetType && (
        <Alert variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            Changing the asset type will require all DAO members to unstake their current tokens and stake the new token type after the change is approved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 