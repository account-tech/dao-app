import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";
import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export const SelectTypeOfDaoStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [open, setOpen] = useState(false);
  const [coins, setCoins] = useState<CoinOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(formData.coinType || "");

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

  const handleDaoTypeChange = (value: string) => {
    updateFormData({ 
      daoType: value as 'coin' | 'nft',
      coinType: value === 'nft' ? undefined : formData.coinType 
    });
  };

  const selectedCoin = coins.find(coin => coin.type === formData.coinType);

  const handleSelect = (value: string) => {
    const wrappedCoinType = `0x2::coin::Coin<${value}>`;
    updateFormData({ coinType: wrappedCoinType });
    setInputValue(wrappedCoinType);
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    // If the input already contains the wrapper, use it as is
    if (value.startsWith('0x2::coin::Coin<') && value.endsWith('>')) {
      setInputValue(value);
      updateFormData({ coinType: value });
    } else {
      // Otherwise, wrap it
      const wrappedValue = `0x2::coin::Coin<${value}>`;
      setInputValue(wrappedValue);
      updateFormData({ coinType: wrappedValue });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>What type of DAO do you want to create?</Label>
        <RadioGroup
          value={formData.daoType}
          onValueChange={handleDaoTypeChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="coin" id="coin" />
            <Label htmlFor="coin">Coin</Label>
          </div>
          <div className="flex items-center space-x-2 opacity-50">
            <RadioGroupItem value="nft" id="nft" disabled />
            <Label htmlFor="nft">NFT (Coming Soon)</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.daoType === 'coin' && (
        <div className="space-y-2">
          <Label>Search or select coin type</Label>
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
                ) : formData.coinType ? (
                  <span>{trimAddress(getSimplifiedAssetType(formData.coinType))}</span>
                ) : (
                  <span className="text-gray-500">Select or enter coin type...</span>
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
                    {coins.map((coin) => (
                      <CommandItem
                        key={coin.type}
                        value={coin.type}
                        onSelect={() => handleSelect(coin.type)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.coinType === `0x2::coin::Coin<${coin.type}>` ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{trimAddress(getSimplifiedAssetType(coin.type))}</span>
                        </div>
                        <span className="text-gray-500 ml-8">Balance: {coin.displayBalance}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedCoin && (
            <p className="text-sm text-gray-500">
              Balance: {selectedCoin.displayBalance}
            </p>
          )}
        </div>
      )}
    </div>
  );
};