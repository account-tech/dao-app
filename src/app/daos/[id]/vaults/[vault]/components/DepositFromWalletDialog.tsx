'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from "@mysten/sui/transactions";
import { useDaoClient } from "@/hooks/useDaoClient";
import { toast } from "sonner";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useParams } from 'next/navigation';
import { useDaoStore } from '@/store/useDaoStore';
import { formatCoinAmount, getMultipleCoinDecimals } from "@/utils/GlobalHelpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "react-responsive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface DepositFromWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultName: string;
}

interface WalletCoin {
  type: string;
  balance: bigint;
  totalBalance: string;
  symbol: string;
}

export function DepositFromWalletDialog({ 
  open, 
  onOpenChange, 
  vaultName, 
}: DepositFromWalletDialogProps) {
  const [selectedCoinType, setSelectedCoinType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [walletCoins, setWalletCoins] = useState<WalletCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCoins, setFetchingCoins] = useState(false);
  
  const currentAccount = useCurrentAccount();   
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { depositFromWallet } = useDaoClient();
  const params = useParams();
  const daoId = params.id as string;
  const { refreshClient } = useDaoStore();
  
  const isMobile = useMediaQuery({ maxWidth: 640 });

  useEffect(() => {
    const fetchWalletCoins = async () => {
      if (!currentAccount || !open) return;
      
      try {
        setFetchingCoins(true);
        const allCoins = await suiClient.getAllBalances({
          owner: currentAccount.address
        });

        // Get coin decimals using our optimized helper
        const coinTypes = allCoins.map(coin => coin.coinType);
        const decimalsMap = await getMultipleCoinDecimals(coinTypes, suiClient);
        
        const groupedCoins = allCoins.map(coin => {
          const decimals = decimalsMap.get(coin.coinType) ?? 9;
          const formattedAmount = formatCoinAmount(coin.totalBalance, decimals);
          
          return {
            type: coin.coinType,
            balance: BigInt(coin.totalBalance),
            totalBalance: formattedAmount,
            symbol: coin.coinType.split('::').pop() || 'Unknown'
          };
        });

        setWalletCoins(groupedCoins);
      } catch (error) {
        console.error('Error fetching wallet coins:', error);
        toast.error("Failed to fetch wallet coins");
      } finally {
        setFetchingCoins(false);
      }
    };

    fetchWalletCoins();
  }, [currentAccount, suiClient, open]);

  const getMaxAmount = () => {
    const coin = walletCoins.find(c => c.type === selectedCoinType);
    return coin?.totalBalance || '0';
  };

  const getCoinBalance = () => {
    const coin = walletCoins.find(c => c.type === selectedCoinType);
    if (!coin) return null;
    return `Balance: ${coin.totalBalance}`;
  };

  const handleMaxClick = () => {
    setAmount(getMaxAmount());
  };

  const handleDeposit = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    // Validate inputs
    if (!selectedCoinType || !amount || parseFloat(amount) <= 0) {
      toast.error("Please select a coin and enter a valid amount");
      return;
    }

    const SUI_TYPE = "0x2::sui::SUI";
    setLoading(true);

    try {
      console.log('Processing deposit request:', {
        coinType: selectedCoinType,
        requestedAmount: amount
      });

      // Get all coins of the specified type from the wallet first
      const walletCoins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: selectedCoinType
      });

      console.log('Available coins:', walletCoins.data);
      
      const decimalsMap = await getMultipleCoinDecimals([selectedCoinType], suiClient);
      const decimals = decimalsMap.get(selectedCoinType) ?? 9;
      const amountInBaseUnits = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      
      // Calculate total available balance
      const totalBalance = walletCoins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
      
      console.log('Deposit details:', {
        requestedAmount: amountInBaseUnits.toString(),
        totalAvailable: totalBalance.toString(),
        numberOfCoins: walletCoins.data.length
      });

      // Check if we have enough balance
      if (totalBalance < amountInBaseUnits) {
        throw new Error(`Insufficient balance. Required: ${amountInBaseUnits}, Available: ${totalBalance}`);
      }

      // Sort coins by balance in descending order
      const sortedCoins = [...walletCoins.data].sort((a, b) => 
        Number(BigInt(b.balance) - BigInt(a.balance))
      );

      // Create transaction
      const tx = new Transaction();
      tx.setGasBudget(50000000);
      tx.setSender(currentAccount.address);

      // Handle gas payment differently for non-SUI coins
      const isSuiCoin = selectedCoinType === SUI_TYPE;
      if (!isSuiCoin) {
        // Get SUI coins for gas payment
        const suiCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: SUI_TYPE
        });

        if (suiCoins.data.length === 0) {
          throw new Error("No SUI available for gas payment");
        }

        // Sort SUI coins by balance to find the most suitable one for gas
        const sortedSuiCoins = [...suiCoins.data].sort((a, b) => 
          Number(BigInt(b.balance) - BigInt(a.balance))
        );

        // Find a SUI coin that has enough balance for gas (minimum 5000000 MIST = 0.005 SUI)
        const gasAmount = BigInt(5000000);
        const gasCoin = sortedSuiCoins.find(c => BigInt(c.balance) >= gasAmount);

        if (!gasCoin) {
          throw new Error("No SUI coin with sufficient balance for gas payment");
        }

        // Set gas payment using the selected SUI coin
        tx.setGasPayment([{
          objectId: gasCoin.coinObjectId,
          version: gasCoin.version,
          digest: gasCoin.digest
        }]);

        // For non-SUI coins, merge if needed and split
        if (sortedCoins.length > 1) {
          tx.mergeCoins(
            sortedCoins[0].coinObjectId,
            sortedCoins.slice(1).map(c => c.coinObjectId)
          );
        }
        
        // Split the required amount
        const [splitCoin] = tx.splitCoins(sortedCoins[0].coinObjectId, [amountInBaseUnits]);
        
        await depositFromWallet(
          currentAccount.address,
          daoId,
          tx,
          selectedCoinType,
          vaultName,
          splitCoin
        );
      } else {
        // SUI coin handling
        const coinObjects = await Promise.all(
          sortedCoins.map(coin => 
            suiClient.getObject({
              id: coin.coinObjectId,
              options: { showContent: true }
            })
          )
        );

        tx.setGasPayment(coinObjects.map(obj => ({
          objectId: obj.data!.objectId,
          version: obj.data!.version,
          digest: obj.data!.digest
        })));

        // After gas smashing, all coins will be merged into the first coin
        // We can use tx.gas to reference the merged coin
        const [splitCoin] = tx.splitCoins(tx.gas, [amountInBaseUnits]);

        await depositFromWallet(
          currentAccount.address,
          daoId,
          tx,
          selectedCoinType,
          vaultName,
          splitCoin
        );
      }

      console.log('Executing transaction...');
      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      
      // If we got here, transaction was successful
      refreshClient();
      onOpenChange(false);
      
      // Reset form
      setSelectedCoinType('');
      setAmount('');
      
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const DialogContent_Component = (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Deposit coins from your wallet to the <span className="font-medium">{vaultName}</span> vault
      </div>
      
      {fetchingCoins ? (
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Amount</Label>
            <div className="flex gap-2">
              <Input
                placeholder="0"
                type="number"
                step="0.000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-lg"
              />
              <Select
                value={selectedCoinType}
                onValueChange={setSelectedCoinType}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select">
                    {selectedCoinType ? walletCoins.find(c => c.type === selectedCoinType)?.symbol : 'Select'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {walletCoins.map((coin) => (
                    <SelectItem key={coin.type} value={coin.type}>
                      {coin.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedCoinType && (
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{getCoinBalance()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                className="h-auto p-0 text-teal-600 hover:text-teal-700"
              >
                Max
              </Button>
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDeposit}
          className="flex-1 bg-teal-600 hover:bg-teal-700"
          disabled={loading || fetchingCoins || !selectedCoinType || !amount}
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Deposit
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>Deposit from Wallet</DrawerTitle>
            <DrawerDescription>
              Transfer coins from your wallet to the vault
            </DrawerDescription>
          </DrawerHeader>
          {DialogContent_Component}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit from Wallet</DialogTitle>
          <DialogDescription>
            Transfer coins from your wallet to the vault
          </DialogDescription>
        </DialogHeader>
        {DialogContent_Component}
      </DialogContent>
    </Dialog>
  );
}
