"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { getCoinDecimals, formatCoinAmount } from "@/utils/tx/GlobalHelpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useDaoStore } from "@/store/useDaoStore";

export default function UserData({ daoId }: { daoId: string }) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { getParticipant, getDao, stake } = useDaoClient();
  const [votingPower, setVotingPower] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState("");
  const [decimals, setDecimals] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [totalStaked, setTotalStaked] = useState<string>("0");
  const resetClient = useDaoStore(state => state.resetClient);
  const triggerRefresh = useDaoStore(state => state.triggerRefresh);

  useEffect(() => {
    const fetchVotingPower = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        
        // Fetch participant and dao data
        const participant = await getParticipant(currentAccount.address, daoId);
        const dao = await getDao(currentAccount.address, daoId);

        if (!participant || !dao) {
          throw new Error("Failed to fetch participant or dao data");
        }

        // Get coin decimals for the asset type
        const fetchedDecimals = await getCoinDecimals(participant.assetType);
        setDecimals(fetchedDecimals);
        
        // Format available balance
        setAvailableBalance(formatCoinAmount(participant.coinBalance || BigInt(0), fetchedDecimals));

        // Calculate total staked amount
        let totalStakedValue = BigInt(0);
        if (participant.staked && Array.isArray(participant.staked)) {
          totalStakedValue = participant.staked.reduce((acc, stake) => {
            // Only count stakes for this specific DAO
            if (stake.daoAddr === daoId) {
              return acc + BigInt(stake.value);
            }
            return acc;
          }, BigInt(0));
        }
        setTotalStaked(formatCoinAmount(totalStakedValue, fetchedDecimals));
        
        // Calculate voting power based on voting rule
        const isQuadratic = dao.votingRule === 1;
        const power = isQuadratic 
          ? Math.sqrt(Number(formatCoinAmount(totalStakedValue, fetchedDecimals)))
          : formatCoinAmount(totalStakedValue, fetchedDecimals);
        
        setVotingPower(typeof power === 'number' ? power.toFixed(2) : power);
      } catch (error) {
        console.error("Error calculating voting power:", error);
        setVotingPower("0.00");
        setAvailableBalance("0.00");
        setTotalStaked("0.00");
      } finally {
        setLoading(false);
      }
    };

    fetchVotingPower();
  }, [currentAccount?.address]);

  const handleStake = async () => {
    if (!currentAccount?.address || !stakeAmount || isNaN(Number(stakeAmount))) return;

    try {
      setIsStaking(true);
      // Convert amount to bigint considering decimals
      const bigintAmount = BigInt(Math.floor(Number(stakeAmount) * Math.pow(10, decimals)));
      console.log("Bigint amount:", bigintAmount);
      
      // Get transaction from stake function
      const tx = await stake(currentAccount.address, bigintAmount);

      // Sign and execute transaction
      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);

      // Reset client and trigger refresh
      resetClient();
      triggerRefresh();
      
      // Clear input and close dialog
      setStakeAmount("");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error staking:", error);
      toast.error(error instanceof Error ? error.message : "Failed to stake tokens");
    } finally {
      setIsStaking(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-white shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-white shadow">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Voting Power</span>
          <span className="font-semibold">{votingPower}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total Staked</span>
          <span className="font-semibold">{totalStaked}</span>
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-4">
            Stake Tokens
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake Tokens</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Available: {availableBalance}</span>
                <span>Staked: {totalStaked}</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount to stake</Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  value={stakeAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || Number(value) <= Number(availableBalance)) {
                      setStakeAmount(value);
                    }
                  }}
                  placeholder="Enter amount"
                  max={availableBalance}
                />
              </div>
            </div>
            <Button 
              onClick={handleStake} 
              disabled={!stakeAmount || isStaking || isNaN(Number(stakeAmount)) || Number(stakeAmount) > Number(availableBalance)}
            >
              {isStaking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Staking...</span>
                </div>
              ) : (
                "Stake"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
