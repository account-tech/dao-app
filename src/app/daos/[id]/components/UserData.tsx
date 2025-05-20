"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { getCoinDecimals, formatCoinAmount, getCoinMeta, getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useDaoStore } from "@/store/useDaoStore";
import UserDataSkeleton from "./UserDataSkeleton";

interface StakePosition {
  daoAddr: string;
  value: bigint;
}

interface UnstakingPosition {
  assetType: string;
  daoAddr: string;
  id: string;
  unstaked: bigint | null;
  value: bigint;
}

interface ClaimPosition {
  daoAddr: string;
  value: bigint;
}

export default function UserData({ daoId }: { daoId: string }) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { getParticipant, getDao, stake, unstake, claim, getDaoVotingPowerInfo, getVoteStakeInfo, retrieveVotes } = useDaoClient();
  const [votingPower, setVotingPower] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [decimals, setDecimals] = useState(0);
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<string>("0");
  const [totalStaked, setTotalStaked] = useState<string>("0");
  const [totalUnstaking, setTotalUnstaking] = useState<string>("0");
  const [unstakingPositions, setUnstakingPositions] = useState<UnstakingPosition[]>([]);
  const [totalClaimable, setTotalClaimable] = useState<string>("0");
  const { refreshClient} = useDaoStore();
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isQuadratic, setIsQuadratic] = useState(false);
  const [authVotingPower, setAuthVotingPower] = useState<string>("0");
  const [maxVotingPower, setMaxVotingPower] = useState<string>("0");
  const [hasAuthPower, setHasAuthPower] = useState(false);
  const [coinSymbol, setCoinSymbol] = useState<string>("");
  const [lockedInVotes, setLockedInVotes] = useState<string>("0");
  const [retrievableVotes, setRetrievableVotes] = useState<string>("0");
  const [isRetrieving, setIsRetrieving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        
        // Fetch participant and dao data
        const participant = await getParticipant(currentAccount.address, daoId);
        const dao = await getDao(currentAccount.address, daoId);

        if (!participant || !dao) {
          throw new Error("Failed to fetch participant or dao data");
        }

        // Get simplified asset type and use it for metadata
        const simplifiedAssetType = getSimplifiedAssetType(participant.assetType);
        
        // Get coin metadata for symbol
        const coinMeta = await getCoinMeta(simplifiedAssetType, suiClient);
        setCoinSymbol(coinMeta?.symbol || (simplifiedAssetType.split("::").pop() ?? 'UNKNOWN'));

        // Get coin decimals for the asset type
        const fetchedDecimals = await getCoinDecimals(simplifiedAssetType, suiClient);
        setDecimals(fetchedDecimals);
        
        // Format available balance
        setAvailableBalance(formatCoinAmount(participant.coinBalance || BigInt(0), fetchedDecimals));

        // Calculate total staked amount
        let totalStakedValue = BigInt(0);
        if (participant.staked && Array.isArray(participant.staked)) {
          totalStakedValue = participant.staked.reduce((acc: bigint, stake: StakePosition) => {
            if (stake.daoAddr === daoId) {
              return acc + stake.value;
            }
            return acc;
          }, BigInt(0));
        }
        setTotalStaked(formatCoinAmount(totalStakedValue, fetchedDecimals));

        // Get voting power info and vote stake info in parallel
        const [votingPowerInfo, voteStakeInfo] = await Promise.all([
          getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient),
          getVoteStakeInfo(currentAccount.address, daoId, suiClient)
        ]);

        setVotingPower(votingPowerInfo.votingPower);
        setAuthVotingPower(votingPowerInfo.authVotingPower);
        setMaxVotingPower(votingPowerInfo.maxVotingPower);
        setHasAuthPower(votingPowerInfo.hasAuthPower);
        setIsQuadratic(votingPowerInfo.isQuadratic);

        setLockedInVotes(voteStakeInfo.lockedInVotes);
        setRetrievableVotes(voteStakeInfo.retrievableVotes);

        // Calculate total unstaking amount and store positions
        let totalUnstakingValue = BigInt(0);
        const currentPositions: UnstakingPosition[] = [];
        
        if (participant.unstaked && Array.isArray(participant.unstaked)) {
          participant.unstaked.forEach((unstakePos: UnstakingPosition) => {
            if (unstakePos.daoAddr === daoId) {
              totalUnstakingValue += unstakePos.value;
              currentPositions.push(unstakePos);
            }
          });
        }
        
        setTotalUnstaking(formatCoinAmount(totalUnstakingValue, fetchedDecimals));
        setUnstakingPositions(currentPositions);
        
        // Calculate total claimable amount
        let totalClaimableValue = BigInt(0);
        if (participant.claimable && Array.isArray(participant.claimable)) {
          participant.claimable.forEach((claim: ClaimPosition) => {
            if (claim.daoAddr === daoId) {
              totalClaimableValue += claim.value;
            }
          });
        }
        setTotalClaimable(formatCoinAmount(totalClaimableValue, fetchedDecimals));
      } catch (error) {
        console.error("Error fetching data:", error);
        setVotingPower("0.00");
        setAvailableBalance("0.00");
        setTotalStaked("0.00");
        setTotalUnstaking("0.00");
        setTotalClaimable("0.00");
        setUnstakingPositions([]);
        setAuthVotingPower("0");
        setMaxVotingPower("0");
        setHasAuthPower(false);
        setIsQuadratic(false);
        setCoinSymbol("");
        setLockedInVotes("0");
        setRetrievableVotes("0");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentAccount?.address, refreshCounter, daoId]);

  // Format date to mm/dd/yyyy hour:minutes
  const formatUnstakeDate = (timestamp: bigint | null) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if unstaking position is ready to claim
  const isReadyToClaim = (timestamp: bigint | null) => {
    if (!timestamp) return false;
    return Date.now() >= Number(timestamp);
  };

  const handleStake = async () => {
    if (!currentAccount?.address || !stakeAmount || isNaN(Number(stakeAmount))) return;

    try {
      setIsStaking(true);
      const bigintAmount = BigInt(Math.floor(Number(stakeAmount) * Math.pow(10, decimals)));
      const tx = await stake(currentAccount.address, bigintAmount);

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      refreshClient();

      setStakeAmount("");
      setStakeDialogOpen(false);
    } catch (error) {
      console.error("Error staking:", error);
      toast.error(error instanceof Error ? error.message : "Failed to stake tokens");
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!currentAccount?.address || !unstakeAmount || isNaN(Number(unstakeAmount))) return;

    try {
      setIsUnstaking(true);
      const bigintAmount = BigInt(Math.floor(Number(unstakeAmount) * Math.pow(10, decimals)));
      const tx = await unstake(currentAccount.address, bigintAmount);

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      refreshClient();
      
      setUnstakeAmount("");
      setUnstakeDialogOpen(false);
    } catch (error) {
      console.error("Error unstaking:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unstake tokens");
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaim = async () => {
    if (!currentAccount?.address) return;

    try {
      setIsClaiming(true);
      const tx = await claim(currentAccount.address);

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      refreshClient();
    } catch (error) {
      console.error("Error claiming tokens:", error);
      toast.error(error instanceof Error ? error.message : "Failed to claim tokens");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRetrieveVotes = async () => {
    if (!currentAccount?.address) return;

    try {
      setIsRetrieving(true);
      const tx = new Transaction();
      const modifiedTx = await retrieveVotes(currentAccount.address, daoId, tx);

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx: modifiedTx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      refreshClient();
    } catch (error) {
      console.error("Error retrieving votes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to retrieve votes");
    } finally {
      setIsRetrieving(false);
    }
  };

  // Helper function to format amount with symbol
  const formatWithSymbol = (amount: string) => {
    return `${amount} ${coinSymbol}`;
  };

  if (loading) {
    return <UserDataSkeleton />;
  }

  return (
    <div className="p-4 rounded-lg bg-white shadow">
      <div className="space-y-4">
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Voting Power</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 text-white p-3 max-w-xs">
                    <p className="mb-3 text-sm">
                      {isQuadratic 
                        ? "Your voting power is calculated as the square root of your staked tokens, promoting fair voting distribution."
                        : "Your voting power is equal to your staked tokens."}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <p className="text-yellow-200">Minimum required: {authVotingPower}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400" />
                        <p className="text-teal-200">Maximum allowed: {maxVotingPower}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-xl bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                {votingPower}
              </span>
              <span className="text-xs text-gray-400">/ {maxVotingPower}</span>
            </div>
          </div>

          <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute h-full w-0.5 bg-yellow-400 z-10"
              style={{ 
                left: `${(Number(authVotingPower) / Number(maxVotingPower)) * 100}%`,
                display: Number(votingPower) < Number(authVotingPower) ? 'block' : 'none'
              }}
            />
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-600 transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(100, (Number(votingPower) / Number(maxVotingPower)) * 100)}%` 
              }}
            />
          </div>

          {Number(votingPower) === 0 && (
            <Alert className="mt-4 bg-teal-50 text-teal-800 border-teal-200">
              <AlertDescription className="text-sm">
                Stake tokens to increase your voting power and participate in DAO decisions.
                {Number(availableBalance) > 0 && " You have tokens available to stake!"}
              </AlertDescription>
            </Alert>
          )}

          {Number(votingPower) > 0 && !hasAuthPower && (
            <Alert className="mt-4 bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertDescription className="text-sm">
                You need at least {authVotingPower} voting power to create proposals and participate in key DAO activities. 
                {Number(availableBalance) > 0 
                  ? " Consider staking more tokens to reach this threshold!"
                  : " Acquire and stake more tokens to reach this threshold."}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Staking Information */}
        <div className="mt-6 space-y-4">
          {/* Main Staking Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Total Staked</span>
                <span className="text-lg font-semibold">{formatWithSymbol(totalStaked)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Available to Claim</span>
                <span className={`text-lg font-semibold ${Number(totalClaimable) > 0 ? 'text-green-600' : ''}`}>
                  {formatWithSymbol(totalClaimable)}
                </span>
              </div>
            </div>
          </div>

          {/* Votes Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Locked in Votes</span>
                <span className="text-lg font-semibold">{formatWithSymbol(lockedInVotes)}</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Retrievable from Votes</span>
                <span className={`text-lg font-semibold ${Number(retrievableVotes) > 0 ? 'text-green-600' : ''}`}>
                  {formatWithSymbol(retrievableVotes)}
                </span>
              </div>
            </div>
          </div>

          {/* Unstaking Positions Section - Only show if there are positions */}
          {unstakingPositions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Unstaking Process</span>
                <span className="text-xs text-gray-400">{unstakingPositions.length} active</span>
              </div>
              <div className="space-y-2">
                {unstakingPositions.map((position) => (
                  <div key={position.id} className="bg-white rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>{formatWithSymbol(formatCoinAmount(position.value, decimals))}</span>
                      {position.unstaked ? (
                        isReadyToClaim(position.unstaked) ? (
                          <span className="text-green-600 font-medium">Ready to claim</span>
                        ) : (
                          <span className="text-gray-600">
                            Ready {formatUnstakeDate(position.unstaked)}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">Processing...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1 bg-white hover:bg-gray-50"
                >
                  Stake
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stake Tokens</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Available: {formatWithSymbol(availableBalance)}</span>
                      <span>Staked: {formatWithSymbol(totalStaked)}</span>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stake-amount">Amount to stake</Label>
                      <div className="relative">
                        <Input
                          id="stake-amount"
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
                          className="pr-16"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="absolute right-0 top-0 h-full px-3 text-xs font-medium text-teal-600 hover:text-teal-700"
                          onClick={() => setStakeAmount(availableBalance)}
                        >
                          MAX
                        </Button>
                      </div>
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

            <Dialog open={unstakeDialogOpen} onOpenChange={setUnstakeDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="flex-1 bg-white hover:bg-gray-50"
                  disabled={Number(totalStaked) === 0}
                >
                  Unstake
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unstake Tokens</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Available to unstake: {formatWithSymbol(totalStaked)}</span>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unstake-amount">Amount to unstake</Label>
                      <div className="relative">
                        <Input
                          id="unstake-amount"
                          type="number"
                          step={`0.${"0".repeat(decimals - 1)}1`}
                          value={unstakeAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Ensure we don't exceed available amount with decimal precision
                            const maxAmount = Math.floor(Number(totalStaked) * Math.pow(10, decimals)) / Math.pow(10, decimals);
                            if (value === "" || Number(value) <= maxAmount) {
                              setUnstakeAmount(value);
                            }
                          }}
                          placeholder="Enter amount"
                          max={Math.floor(Number(totalStaked) * Math.pow(10, decimals)) / Math.pow(10, decimals)}
                          className="pr-16"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="absolute right-0 top-0 h-full px-3 text-xs font-medium text-teal-600 hover:text-teal-700"
                          onClick={() => {
                            // Set max amount with proper decimal precision
                            const maxAmount = Math.floor(Number(totalStaked) * Math.pow(10, decimals)) / Math.pow(10, decimals);
                            setUnstakeAmount(maxAmount.toString());
                          }}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleUnstake} 
                    disabled={!unstakeAmount || isUnstaking || isNaN(Number(unstakeAmount)) || Number(unstakeAmount) > Number(totalStaked)}
                  >
                    {isUnstaking ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Unstaking...</span>
                      </div>
                    ) : (
                      "Unstake"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Claim and Retrieve Buttons - Only show if there's something to claim/retrieve */}
          <div className="space-y-2 mt-4">
            {Number(totalClaimable) > 0 && (
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                {isClaiming ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Claiming...</span>
                  </div>
                ) : (
                  "Claim Available Tokens"
                )}
              </Button>
            )}

            {Number(retrievableVotes) > 0 && (
              <Button
                onClick={handleRetrieveVotes}
                disabled={isRetrieving}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                {isRetrieving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Retrieving...</span>
                  </div>
                ) : (
                  "Retrieve from votes"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
