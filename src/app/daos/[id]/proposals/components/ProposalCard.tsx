import { getIntentDisplay } from "../helpers/types";
import { IntentStatus } from "@account.tech/dao";
import { Intent } from "@account.tech/core";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight, Clock } from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useDaoStore } from "@/store/useDaoStore";
import { handleTxResult, signAndExecute } from "@/utils/tx/Tx";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalCardProps {
  intentKey: string;
  intent: Intent;
}

interface VoteResults {
  yes: string;
  no: string;
  abstain: string;
}

export function ProposalCard({ intentKey, intent }: ProposalCardProps) {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { deleteIntent, execute, getIntentStatus, vote } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<IntentStatus>({ stage: 'pending', deletable: false });

  // Get voting information from intent
  const voteOutcome = (intent as any).outcome;
  const startTime = voteOutcome?.startTime ? new Date(Number(voteOutcome.startTime)) : null;
  const endTime = voteOutcome?.endTime ? new Date(Number(voteOutcome.endTime)) : null;
  const results: VoteResults = voteOutcome?.results || { yes: "0", no: "0", abstain: "0" };

  // Calculate total votes and percentages
  const totalVotes = parseInt(results.yes) + parseInt(results.no) + parseInt(results.abstain);
  const yesPercentage = totalVotes > 0 ? (parseInt(results.yes) / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (parseInt(results.no) / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (parseInt(results.abstain) / totalVotes) * 100 : 0;

  // Calculate remaining time
  const now = new Date();
  const remainingTime = endTime ? endTime.getTime() - now.getTime() : 0;
  const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

  const formatRemainingTime = () => {
    if (remainingTime <= 0) return "Time expired";
    
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

  const handleExecute = async () => {
    if (!currentAccount || !daoId) {
      toast.error("No account or DAO selected");
      return;
    }
    setIsLoading(true);
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

      refreshClient();
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error(error instanceof Error ? error.message : "Failed to execute proposal");
    } finally {
      setIsLoading(false);
    }
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
        return 'text-green-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-gray-100">
            <intentDisplay.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{intentDisplay.title}</p>
            <h3 className="font-medium">{intentKey}</h3>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle()}`}>
          {status.stage.charAt(0).toUpperCase() + status.stage.slice(1)}
        </div>
      </div>

      {/* Vote Counts */}
      {status.stage !== 'pending' && (
        <>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Yes {results.yes}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              Abstain {results.abstain}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              No {results.no}
            </span>
          </div>

          {/* Voting Progress Bar */}
          <div className="flex h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${yesPercentage}%` }} 
            />
            <div 
              className="bg-gray-300" 
              style={{ width: `${abstainPercentage}%` }} 
            />
            <div 
              className="bg-red-500" 
              style={{ width: `${noPercentage}%` }} 
            />
          </div>
        </>
      )}

      {/* Timer */}
      {status.stage !== 'open' && renderTimeInfo()}

      {/* Voting Buttons and Timer for open proposals */}
      {status.stage === 'open' && (
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-2 flex-1">
            <Button
              onClick={() => handleVote("yes")}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 border-green-200"
              disabled={isLoading}
            >
              Yes
            </Button>
            <Button
              onClick={() => handleVote("abstain")}
              variant="outline"
              className="bg-gray-50 hover:bg-gray-100 border-gray-200"
              disabled={isLoading}
            >
              Abstain
            </Button>
            <Button
              onClick={() => handleVote("no")}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 border-red-200"
              disabled={isLoading}
            >
              No
            </Button>
          </div>
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
                  <p>Started: {formatDate(startTime)}</p>
                  <p>Will close on: {formatDate(endTime)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {status.stage === 'executable' && (
          <Button 
            onClick={handleExecute}
            disabled={isLoading}
            variant="default"
            size="sm"
          >
            Execute
          </Button>
        )}
        {status.deletable && (
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            variant="ghost"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 