"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { Intent } from "@account.tech/core";
import { IntentStatus } from "@account.tech/dao";
import { Button } from "@/components/ui/button";
import { Check, Minus, X, Info, Clock, Trash2, PlayCircle } from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { handleTxResult, signAndExecute } from "@/utils/tx/Tx";
import { useDaoStore } from "@/store/useDaoStore";
import { getCoinDecimals, getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface ProposalInfoProps {
  daoId: string;
  intentKey: string;
}

interface VoteResults {
  yes: string;
  no: string;
  abstain: string;
}

interface FormattedVoteResults {
  yes: string;
  no: string;
  abstain: string;
  total: number;
}

export function ProposalInfo({ daoId, intentKey }: ProposalInfoProps) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { getIntent, getIntentStatus, vote, getDaoVotingPowerInfo, getParticipant, deleteIntent, execute } = useDaoClient();
  const { refreshClient, refreshProposals } = useDaoStore();
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  const [intent, setIntent] = useState<Intent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<IntentStatus>({ stage: 'pending', deletable: false });
  const [votingPower, setVotingPower] = useState<string>("0");
  const [formattedResults, setFormattedResults] = useState<FormattedVoteResults>({
    yes: "0",
    no: "0",
    abstain: "0",
    total: 0
  });
  const [isQuadratic, setIsQuadratic] = useState(false);
  const [votingQuorum, setVotingQuorum] = useState<number>(0);
  const [minimumVotes, setMinimumVotes] = useState<string>("0");
  const [executionTime, setExecutionTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);

  // Calculate remaining time
  const now = new Date();
  const remainingTime = endTime ? endTime.getTime() - now.getTime() : 0;
  const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  const formatRemainingTime = () => {
    if (remainingTime <= 0) return "Time expired";
    
    if (remainingTime < 60000) { // less than 1 minute
      return `${remainingSeconds}s`;
    }
    
    const parts = [];
    if (remainingDays > 0) parts.push(`${remainingDays}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
    
    return parts.join(" ");
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount?.address) return;

      try {
        setIsLoading(true);
        const [fetchedIntent, intentStatus, powerInfo] = await Promise.all([
          getIntent(currentAccount.address, daoId, intentKey),
          getIntentStatus(currentAccount.address, daoId, intentKey),
          getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient)
        ]);

        setIntent(fetchedIntent);
        setStatus(intentStatus);
        setVotingPower(powerInfo.votingPower);
        setIsQuadratic(powerInfo.isQuadratic);
        setVotingQuorum(powerInfo.votingQuorum);
        setMinimumVotes(powerInfo.minimumVotes);

        // Set execution time and end time if available
        if (fetchedIntent) {
          const execTime = (fetchedIntent as any).fields?.executionTimes?.[0];
          const voteEndTime = (fetchedIntent as any).outcome?.endTime;
          const expTime = (fetchedIntent as any).fields?.expirationTime;
          setExecutionTime(execTime ? new Date(Number(execTime)) : null);
          setEndTime(voteEndTime ? new Date(Number(voteEndTime)) : null);
          setExpirationTime(expTime ? new Date(Number(expTime)) : null);
        }

        // Format vote results if intent exists
        if (fetchedIntent) {
          const voteOutcome = (fetchedIntent as any).outcome;
          const results: VoteResults = voteOutcome?.results || { yes: "0", no: "0", abstain: "0" };
          
          // Get decimals for formatting
          const participant = await getParticipant(currentAccount.address, daoId);
          if (participant) {
            const simplifiedAssetType = getSimplifiedAssetType(participant.assetType);
            const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
            const divisor = BigInt(10) ** BigInt(decimals);

            const formattedYes = (Number(results.yes) / Number(divisor)).toString();
            const formattedNo = (Number(results.no) / Number(divisor)).toString();
            const formattedAbstain = (Number(results.abstain) / Number(divisor)).toString();
            const total = Number(formattedYes) + Number(formattedNo) + Number(formattedAbstain);

            setFormattedResults({
              yes: formattedYes,
              no: formattedNo,
              abstain: formattedAbstain,
              total
            });
          }
        }
      } catch (error) {
        console.error("Error fetching proposal data:", error);
        toast.error("Failed to fetch proposal data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentAccount?.address, daoId, intentKey, refreshCounter]);

  const handleVote = async (answer: "yes" | "no" | "abstain") => {
    if (!currentAccount?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const tx = new Transaction();
      await vote(currentAccount.address, daoId, tx, intentKey, answer);

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
      console.error("Error voting:", error);
      toast.error(error instanceof Error ? error.message : "Failed to vote");
    }
  };

  const handleDelete = async () => {
    if (!currentAccount?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const tx = new Transaction();
      await deleteIntent(
        currentAccount.address,
        daoId,
        tx,
        intentKey
      );

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);

      // refresh proposals page without refreshing the proposal page
      refreshProposals();
      
      // Set the previous route to the current proposal page
      
      // Use a small timeout to ensure state updates are processed
      setTimeout(() => {
        router.push(`/daos/${daoId}/proposals`);
      }, 0);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete proposal");
    }
  };

  const handleExecute = async () => {
    if (!currentAccount?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const tx = new Transaction();
      await execute(
        currentAccount.address,
        daoId,
        tx,
        intentKey
      );

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);

      // refresh proposals page without refreshing the proposal page
      refreshProposals();
      
      // Use a small timeout to ensure state updates are processed
      setTimeout(() => {
        router.push(`/daos/${daoId}/proposals`);
      }, 0);
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error(error instanceof Error ? error.message : "Failed to execute proposal");
    }
  };

  // Calculate percentages
  const yesPercentage = formattedResults.total > 0 ? (Number(formattedResults.yes) / formattedResults.total) * 100 : 0;
  const noPercentage = formattedResults.total > 0 ? (Number(formattedResults.no) / formattedResults.total) * 100 : 0;
  const abstainPercentage = formattedResults.total > 0 ? (Number(formattedResults.abstain) / formattedResults.total) * 100 : 0;

  // Calculate execution requirements
  const getExecutionRequirements = () => {
    if (status.stage !== 'failed') return null;

    const totalVotesPower = Number(formattedResults.yes) + Number(formattedResults.no);
    const yesRatio = totalVotesPower > 0 ? Number(formattedResults.yes) / totalVotesPower : 0;
    const hasMetQuorum = yesRatio >= votingQuorum;
    const hasMetMinimumVotes = totalVotesPower >= Number(minimumVotes);

    // If conditions are not met, show requirements
    if (!hasMetQuorum || !hasMetMinimumVotes) {
      // Generate the summary message
      const failureReasons = [];
      if (!hasMetQuorum) {
        failureReasons.push("quorum requirement was not met");
      }
      if (!hasMetMinimumVotes) {
        failureReasons.push("minimum votes requirement was not met");
      }
      const summaryMessage = `The proposal was not accepted because the ${failureReasons.join(" and the ")}.`;

      return (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-gray-500" />
            <h3 className="text-gray-700 font-medium">Execution Requirements</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Quorum Required</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">The quorum is the ratio of YES votes over the total of YES + NO votes (excluding ABSTAIN votes).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-gray-900">{(votingQuorum * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${hasMetQuorum ? 'bg-teal-500' : 'bg-gray-400'}`}
                  style={{ width: `${Math.min((yesRatio / votingQuorum) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Current: {(yesRatio * 100).toFixed(0)}%</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Minimum Votes Required</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">The minimum total voting power needed (YES + NO + ABSTAIN votes combined) for a proposal to be valid.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-gray-900">{minimumVotes}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${hasMetMinimumVotes ? 'bg-teal-500' : 'bg-gray-400'}`}
                  style={{ width: `${Math.min((totalVotesPower / Number(minimumVotes)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Current: {totalVotesPower.toFixed(2)}</p>
            </div>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {summaryMessage}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {status.stage === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your vote</h2>
            <div className="text-sm text-gray-500">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatRemainingTime()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Will close on: {endTime?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => handleVote("yes")}
              variant="outline"
              className="w-full py-6 text-base bg-teal-50 hover:bg-teal-100 border-teal-200"
              disabled={Number(votingPower) === 0}
            >
              Yes
            </Button>
            <Button
              onClick={() => handleVote("abstain")}
              variant="outline"
              className="w-full py-6 text-base bg-gray-50 hover:bg-gray-100 border-gray-200"
              disabled={Number(votingPower) === 0}
            >
              Abstain
            </Button>
            <Button
              onClick={() => handleVote("no")}
              variant="outline"
              className="w-full py-6 text-base bg-red-50 hover:bg-red-100 border-red-200"
              disabled={Number(votingPower) === 0}
            >
              No
            </Button>
          </div>
          {Number(votingPower) === 0 && (
            <p className="text-sm text-gray-500 text-center">
              You need to stake tokens to participate in voting
            </p>
          )}
        </div>
      )}

      {status.stage === 'pending' && intent && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Voting not started</h2>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-4 w-4" />
              <span>
                Votes opening on:{' '}
                {new Date(Number((intent as any).outcome?.startTime)).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {status.stage !== 'pending' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                <span className="text-gray-600">Yes</span>
                <span className="font-medium">{formattedResults.yes}</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Abstain</span>
                <span className="font-medium">{formattedResults.abstain}</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">No</span>
                <span className="font-medium">{formattedResults.no}</span>
              </div>
            </div>

            <div className="flex h-2 overflow-hidden rounded-full">
              {formattedResults.total === 0 ? (
                <div className="w-full bg-gray-100/50" />
              ) : (
                <>
                  <div 
                    className="bg-teal-500 mr-1" 
                    style={{ width: `${yesPercentage}%` }} 
                  />
                  <div 
                    className="bg-gray-300 mr-1" 
                    style={{ width: `${abstainPercentage}%` }} 
                  />
                  <div 
                    className="bg-red-600" 
                    style={{ width: `${noPercentage}%` }} 
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Execution Requirements for Failed Proposals */}
      {status.stage === 'failed' && getExecutionRequirements()}

      {/* Success State with Execution Time */}
      {status.stage === 'success' && executionTime && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-green-700 font-medium mb-2">Proposal Succeeded!</h3>
          <p className="text-green-600 text-sm">
            This proposal will be executable on: {executionTime.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Execute Button for Executable Proposals */}
      {status.stage === 'executable' && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleExecute}
            variant="default"
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Execute Proposal
          </Button>
        </div>
      )}

      {/* Delete Button for Failed Proposals */}
      {status.stage === 'failed' && expirationTime && (
        <div className="mt-6 flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleDelete}
                    disabled={isLoading || (now < expirationTime)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Proposal
                  </Button>
                </div>
              </TooltipTrigger>
              {now < expirationTime && (
                <TooltipContent>
                  <p>Will be deleteable once it expires on: {expirationTime.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
} 