'use client';

import { useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { Transaction } from "@mysten/sui/transactions";
import { useDaoClient } from "@/hooks/useDaoClient";
import { toast } from "sonner";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useParams } from 'next/navigation';
import { useDaoStore } from '@/store/useDaoStore';
import { getMultipleCoinDecimals } from "@/utils/GlobalHelpers";
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
import { useMediaQuery } from "react-responsive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface DepositFromWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultName: string;
}

interface CoinDeposit {
  type: string;
  amount: string;
}

export function DepositFromWalletDialog({ 
  open, 
  onOpenChange, 
  vaultName, 
}: DepositFromWalletDialogProps) {
  const [coins, setCoins] = useState<CoinDeposit[]>([{ type: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  
  const currentAccount = useCurrentAccount();   
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { depositFromWallet } = useDaoClient();
  const params = useParams();
  const daoId = params.id as string;
  const { refreshClient } = useDaoStore();
  
  const isMobile = useMediaQuery({ maxWidth: 640 });

  const handleAddCoin = () => {
    setCoins([...coins, { type: '', amount: '' }]);
  };

  const handleRemoveCoin = (index: number) => {
    if (coins.length > 1) {
      setCoins(coins.filter((_, i) => i !== index));
    }
  };

  const handleCoinChange = (index: number, field: keyof CoinDeposit, value: string) => {
    const updatedCoins = [...coins];
    updatedCoins[index][field] = value;
    setCoins(updatedCoins);
  };

  const handleDeposit = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    // Validate inputs
    const validCoins = coins.filter(coin => coin.type && coin.amount && parseFloat(coin.amount) > 0);
    if (validCoins.length === 0) {
      toast.error("Please add at least one valid coin deposit");
      return;
    }

    const SUI_TYPE = "0x2::sui::SUI";
    setLoading(true);

    try {
      // Get coin decimals for all coins at once
      const coinTypes = validCoins.map(coin => coin.type);
      const decimalsMap = await getMultipleCoinDecimals(coinTypes, suiClient);

      // Process each coin deposit
      for (const coin of validCoins) {
        console.log('Processing deposit request:', {
          coinType: coin.type,
          requestedAmount: coin.amount,
          vaultName
        });

        // Get all coins of the specified type from the wallet
        const walletCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: coin.type
        });

        console.log('Available coins:', walletCoins.data);
        
        const decimals = decimalsMap.get(coin.type) ?? 9;
        const amountInBaseUnits = BigInt(Math.floor(parseFloat(coin.amount) * Math.pow(10, decimals)));
        
        // Calculate total available balance
        const totalBalance = walletCoins.data.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
        
        console.log('Deposit details:', {
          requestedAmount: amountInBaseUnits.toString(),
          totalAvailable: totalBalance.toString(),
          numberOfCoins: walletCoins.data.length
        });

        // Check if we have enough balance
        if (totalBalance < amountInBaseUnits) {
          throw new Error(`Insufficient balance for ${coin.type}. Required: ${amountInBaseUnits}, Available: ${totalBalance}`);
        }

        // Sort coins by balance in descending order
        const sortedCoins = [...walletCoins.data].sort((a, b) => 
          Number(BigInt(b.balance) - BigInt(a.balance))
        );

        // Create transaction
        const tx = new Transaction();
        tx.setGasBudget(5000000);
        tx.setSender(currentAccount.address);

        // Handle gas payment differently for non-SUI coins
        const isSuiCoin = coin.type === SUI_TYPE;
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

          // Find a SUI coin that has enough balance for gas
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
            coin.type,
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
          const [splitCoin] = tx.splitCoins(tx.gas, [amountInBaseUnits]);

          await depositFromWallet(
            currentAccount.address,
            daoId,
            tx,
            coin.type,
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
      }
      
      // If we got here, all transactions were successful
      refreshClient();
      onOpenChange(false);
      
      // Reset form
      setCoins([{ type: '', amount: '' }]);
      
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const DialogContent_Component = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Deposit coins from your wallet to the <span className="font-medium">{vaultName}</span> vault
        </div>
        
        {coins.map((coin, index) => (
          <div key={index} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Coin {index + 1}</Label>
              {coins.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCoin(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor={`coin-type-${index}`} className="text-sm">Coin Type</Label>
                <Input
                  id={`coin-type-${index}`}
                  placeholder="e.g., 0x2::sui::SUI"
                  value={coin.type}
                  onChange={(e) => handleCoinChange(index, 'type', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor={`coin-amount-${index}`} className="text-sm">Amount</Label>
                <Input
                  id={`coin-amount-${index}`}
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={coin.amount}
                  onChange={(e) => handleCoinChange(index, 'amount', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCoin}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Coin
        </Button>
      </div>
      
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
          disabled={loading}
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
