import { getIntentDisplay } from "../helpers/types";
import { IntentStatus } from "@account.tech/dao";
import { Intent } from "@account.tech/core";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Check, Minus, X, Info } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useDaoStore } from "@/store/useDaoStore";
import { handleTxResult, signAndExecute } from "@/utils/tx/Tx";
import { useState, useEffect } from "react";
import { getCoinDecimals, getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProposalCardProps {
  intentKey: string;
  intent: Intent;
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

export function ProposalCard({ intentKey, intent }: ProposalCardProps) {
  const params = useParams();
  const router = useRouter();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { deleteIntent, getIntentStatus, vote, getDaoVotingPowerInfo, getParticipant, getDao } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  const refreshCounterProposals = useDaoStore(state => state.refreshCounterProposals);
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<IntentStatus>({ stage: 'pending', deletable: false });
  const [votingPower, setVotingPower] = useState<string>("0");
  const [isVotingDialogOpen, setIsVotingDialogOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<"yes" | "no" | "abstain" | null>(null);
  const [isQuadratic, setIsQuadratic] = useState(false);
  const [formattedResults, setFormattedResults] = useState<FormattedVoteResults>({
    yes: "0",
    no: "0",
    abstain: "0",
    total: 0
  });
  const [votingQuorum, setVotingQuorum] = useState<number>(0);
  const [minimumVotes, setMinimumVotes] = useState<string>("0");

  // Get voting information from intent
  const voteOutcome = (intent as any).outcome;
  const startTime = voteOutcome?.startTime ? new Date(Number(voteOutcome.startTime)) : null;
  const endTime = voteOutcome?.endTime ? new Date(Number(voteOutcome.endTime)) : null;
  const executionTime = (intent as any).fields?.executionTimes?.[0] ? new Date(Number((intent as any).fields.executionTimes[0])) : null;
  const results: VoteResults = voteOutcome?.results || { yes: "0", no: "0", abstain: "0" };

  useEffect(() => {
    const formatVoteResults = async () => {
      if (!currentAccount?.address || !daoId) return;

      try {
        // Get the DAO and participant info to determine decimals
        const [participant, dao] = await Promise.all([
          getParticipant(currentAccount.address, daoId),
          getDao(currentAccount.address, daoId)
        ]);

        if (!participant) return;

        // Get coin decimals
        const simplifiedAssetType = getSimplifiedAssetType(participant.assetType);
        const decimals = await getCoinDecimals(simplifiedAssetType, suiClient);
        const divisor = BigInt(10) ** BigInt(decimals);

        // Format each vote count
        const formattedYes = (Number(results.yes) / Number(divisor)).toString();
        const formattedNo = (Number(results.no) / Number(divisor)).toString();
        const formattedAbstain = (Number(results.abstain) / Number(divisor)).toString();
        
        // Calculate total votes with decimals
        const total = Number(formattedYes) + Number(formattedNo) + Number(formattedAbstain);

        setFormattedResults({
          yes: formattedYes,
          no: formattedNo,
          abstain: formattedAbstain,
          total
        });

      } catch (error) {
        console.error("Error formatting vote results:", error);
      }
    };

    formatVoteResults();
  }, [currentAccount?.address, daoId, results, refreshCounter]);

  // Calculate percentages using formatted results
  const yesPercentage = formattedResults.total > 0 ? (Number(formattedResults.yes) / formattedResults.total) * 100 : 0;
  const noPercentage = formattedResults.total > 0 ? (Number(formattedResults.no) / formattedResults.total) * 100 : 0;
  const abstainPercentage = formattedResults.total > 0 ? (Number(formattedResults.abstain) / formattedResults.total) * 100 : 0;

  // Calculate total votes and percentages
  const totalVotes = parseInt(results.yes) + parseInt(results.no) + parseInt(results.abstain);

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

  // Format dates
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTimeInfo = () => {
    if (!startTime || !endTime) return null;

    switch (status.stage) {
      case 'pending':
        return (
          <div className="text-sm text-gray-500">
            <span>Starting: {formatDate(startTime)}</span>
          </div>
        );
      case 'open':
        return (
          <div className="text-sm text-gray-500 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  {remainingTime > 0 && (
                    <span>{remainingHours}h {remainingMinutes}m remaining</span>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Started: {formatDate(startTime)}</p>
                  <p>Will close on: {formatDate(endTime)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      case 'closed':
      case 'executable':
        return (
          <div className="text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Started: {formatDate(startTime)}</span>
              <span>Closed: {formatDate(endTime)}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleVote = async (answer: "yes" | "no" | "abstain") => {
    if (!currentAccount || !daoId) {
      toast.error("No account or DAO selected");
      return;
    }
    setIsLoading(true);
    try {
      const tx = new Transaction();
      await vote(
        currentAccount.address,
        daoId,
        tx,
        intentKey,
        answer
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
      refreshClient();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error instanceof Error ? error.message : "Failed to vote");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("outcome", voteOutcome);
    const fetchStatus = async () => {
      if (currentAccount && daoId) {
        try {
          const intentStatus = await getIntentStatus(currentAccount.address, daoId, intentKey);
          console.log('Intent status:', intentStatus);
          setStatus(intentStatus);
        } catch (error) {
          console.error('Error fetching intent status:', error);
        }
      }
    };

    fetchStatus();
  }, [currentAccount, daoId, intentKey, refreshCounter]);

  useEffect(() => {
    const fetchVotingPower = async () => {
      if (!currentAccount?.address || !daoId) return;

      try {
        const powerInfo = await getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient);
        
        setVotingPower(powerInfo.votingPower);
        setIsQuadratic(powerInfo.isQuadratic);
        setVotingQuorum(powerInfo.votingQuorum);
        setMinimumVotes(powerInfo.minimumVotes);

      } catch (error) {
        console.error("Error fetching voting power:", error);
        toast.error("Failed to fetch voting power");
      }
    };

    fetchVotingPower();
  }, [currentAccount?.address, daoId, refreshCounter, refreshCounterProposals]);

  const handleVoteClick = (answer: "yes" | "no" | "abstain") => {
    setSelectedVote(answer);
    setIsVotingDialogOpen(true);
  };

  const handleVoteConfirm = async () => {
    if (!selectedVote) return;
    
    setIsVotingDialogOpen(false);
    await handleVote(selectedVote);
    setSelectedVote(null);
  };

  const handleDelete = async () => {
    if (!currentAccount || !daoId) {
      toast.error("No account or DAO selected");
      return;
    }

    if (!status.deletable) {
      toast.error("This proposal cannot be deleted yet");
      return;
    }

    setIsLoading(true);
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

      refreshClient();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete proposal");
    } finally {
      setIsLoading(false);
    }
  };

  const intentType = (intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') || 'Unknown';
  const intentDisplay = getIntentDisplay(intentType);

  const getStatusStyle = () => {
    switch (status.stage) {
      case 'pending':
        return 'text-yellow-600';
      case 'open':
        return 'text-blue-600';
      case 'closed':
        return 'text-red-600';
      case 'executable':
        return 'text-teal-500';
      default:
        return 'text-yellow-600';
    }
  };

  // Calculate if proposal meets requirements
  const getExecutionRequirements = () => {
    if (status.stage !== 'closed') return null;

    const totalVotesPower = Number(formattedResults.yes) + Number(formattedResults.no);
    const yesRatio = totalVotesPower > 0 ? Number(formattedResults.yes) / totalVotesPower : 0;
    const hasMetQuorum = yesRatio >= votingQuorum;
    const hasMetMinimumVotes = totalVotesPower >= Number(minimumVotes);

    // If all conditions are met but waiting for execution time
    if (hasMetQuorum && hasMetMinimumVotes && executionTime) {
      const now = new Date();
      if (now < executionTime) {
        return (
          <div className="space-y-2 max-w-xs">
            <p className="font-medium mb-2">All conditions met!</p>
            <p>Executable on: {formatDate(executionTime)}</p>
          </div>
        );
      }
      return null;
    }

    // If conditions are not met, show requirements
    if (!hasMetQuorum || !hasMetMinimumVotes) {
      return (
        <div className="space-y-2 max-w-xs">
          <p className="font-medium mb-2">This proposal cannot be executed because:</p>
          <ul className="list-disc ml-4 space-y-1">
            {!hasMetQuorum && (
              <li>
                Quorum not met: {(yesRatio * 100).toFixed(0)}% / {(votingQuorum * 100).toFixed(0)}%
              </li>
            )}
            {!hasMetMinimumVotes && (
              <li>
                Minimum votes not met: {totalVotesPower.toFixed(2)} / {minimumVotes}
              </li>
            )}
          </ul>
        </div>
      );
    }

    return null;
  };

  const getStatusDisplay = () => {
    const baseStatus = status.stage.charAt(0).toUpperCase() + status.stage.slice(1);
    
    if (status.stage === 'closed') {
      const totalVotesPower = Number(formattedResults.yes) + Number(formattedResults.no);
      const yesRatio = totalVotesPower > 0 ? Number(formattedResults.yes) / totalVotesPower : 0;
      const hasMetQuorum = yesRatio >= votingQuorum;
      const hasMetMinimumVotes = totalVotesPower >= Number(minimumVotes);

      if (hasMetQuorum && hasMetMinimumVotes && executionTime) {
        const now = new Date();
        if (now < executionTime) {
          return "Awaiting Execution Time";
        }
      }
    }

    return baseStatus;
  };

  return (
    <div 
      className="bg-white rounded-lg border p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:border-teal-200 transition-colors"
      onClick={() => router.push(`/daos/${daoId}/proposals/${intentKey}`)}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-gray-100">
            <intentDisplay.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{intentDisplay.title}</p>
            <h3 className="font-medium text-sm sm:text-base break-all">{intentKey}</h3>
          </div>
        </div>
        <div className="flex items-center gap-0">
          <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusStyle()}`}>
            {getStatusDisplay()}
          </div>
          {status.stage === 'closed' && getExecutionRequirements() && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {getExecutionRequirements()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Vote Counts */}
      {status.stage !== 'pending' && (
        <>
          <div className="flex flex-wrap gap-3 sm:gap-5 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-teal-500" />
              <span className="text-gray-600">Yes</span>
              <span className="font-medium">{formattedResults.yes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <span className="text-gray-600">Abstain</span>
              <span className="font-medium">{formattedResults.abstain}</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              <span className="text-gray-600">No</span>
              <span className="font-medium">{formattedResults.no}</span>
            </div>
          </div>

          {/* Voting Progress Bar */}
          <div className="flex h-1.5 sm:h-2 overflow-hidden rounded-full">
            {formattedResults.total === 0 ? (
              <div className="w-full bg-gray-100/50" />
            ) : (
              <>
                <div 
                  className="bg-teal-500 mr-0.5 sm:mr-1" 
                  style={{ width: `${yesPercentage}%` }} 
                />
                <div 
                  className="bg-gray-300 mr-0.5 sm:mr-1" 
                  style={{ width: `${abstainPercentage}%` }} 
                />
                <div 
                  className="bg-red-600" 
                  style={{ width: `${noPercentage}%` }} 
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Timer */}
      {status.stage !== 'open' && (
        <div className="text-xs sm:text-sm text-gray-500">
          {status.stage === 'pending' ? (
            <div>
              <span>Starting: {formatDate(startTime)}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span>Started: {formatDate(startTime)}</span>
              <span>Closed: {formatDate(endTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* Voting Buttons and Timer for open proposals */}
      {status.stage === 'open' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => handleVoteClick("yes")}
                      variant="outline"
                      className="w-full text-xs sm:text-sm bg-teal-50 hover:bg-teal-100 border-teal-200"
                      disabled={isLoading || Number(votingPower) === 0}
                    >
                      Yes
                    </Button>
                  </div>
                </TooltipTrigger>
                {Number(votingPower) === 0 && (
                  <TooltipContent>
                    <p>You need to stake tokens to participate in voting</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => handleVoteClick("abstain")}
                      variant="outline"
                      className="w-full text-xs sm:text-sm bg-gray-50 hover:bg-gray-100 border-gray-200"
                      disabled={isLoading || Number(votingPower) === 0}
                    >
                      Abstain
                    </Button>
                  </div>
                </TooltipTrigger>
                {Number(votingPower) === 0 && (
                  <TooltipContent>
                    <p>You need to stake tokens to participate in voting</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => handleVoteClick("no")}
                      variant="outline"
                      className="w-full text-xs sm:text-sm bg-red-50 hover:bg-red-100 border-red-200"
                      disabled={isLoading || Number(votingPower) === 0}
                    >
                      No
                    </Button>
                  </div>
                </TooltipTrigger>
                {Number(votingPower) === 0 && (
                  <TooltipContent>
                    <p>You need to stake tokens to participate in voting</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-xs sm:text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{formatRemainingTime()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Started: {formatDate(startTime)}</p>
                  <p className="text-xs">Will close on: {formatDate(endTime)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {status.deletable && (
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>

      {/* Voting Power Confirmation Dialog */}
      <Dialog open={isVotingDialogOpen} onOpenChange={setIsVotingDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              You are about to vote <span className="font-medium">{selectedVote}</span> on this proposal.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Your voting power:</p>
              <p className="text-2xl font-bold text-gray-900">{votingPower}</p>
              {isQuadratic && (
                <p className="text-xs text-gray-500 mt-1">
                  Using quadratic voting (square root of staked tokens)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsVotingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVoteConfirm}
              disabled={isLoading}
            >
              Confirm Vote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 