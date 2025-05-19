import { getIntentDisplay } from "../helpers/types";
import { IntentStatus } from "@account.tech/dao";
import { Intent } from "@account.tech/core";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useDaoStore } from "@/store/useDaoStore";
import { handleTxResult, signAndExecute } from "@/utils/tx/Tx";
import { useState, useEffect } from "react";

interface ProposalCardProps {
  intentKey: string;
  intent: Intent;
}

export function ProposalCard({ intentKey, intent }: ProposalCardProps) {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { deleteIntent, execute, getIntentStatus } = useDaoClient();
  const { refreshClient} = useDaoStore();
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<IntentStatus>({ stage: 'pending', deletable: false });

  useEffect(() => {
    const fetchStatus = async () => {
      if (currentAccount && daoId) {
        try {
          const intentStatus = await getIntentStatus(currentAccount.address, daoId, intentKey);
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

  const hasUserApproved = currentAccount && (intent as any).outcome?.approved?.includes(currentAccount.address);
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
    <div 
      className="group relative flex flex-col xl:flex-row xl:items-center gap-4 py-4 px-6 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 hover:border-black transition-colors"
    >
      {/* Mobile Layout (default to xl) */}
      <div className="flex flex-col gap-4 w-full xl:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-gray-100 shrink-0">
              <intentDisplay.icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col md:hidden">
              <span className="text-sm font-medium">
                {intentKey}
              </span>
            </div>
            <span className="text-xs text-gray-600">
              {intentDisplay.title}
            </span>
          </div>
          
          <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle()}`}>
            {status.stage.charAt(0).toUpperCase() + status.stage.slice(1)}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:pl-8">
          <div className="hidden md:flex md:flex-col">
            <span className="text-sm font-medium">
              {intentKey}
            </span>
          </div>

          <div className="flex items-center gap-2 md:justify-end">
            {!hasUserApproved ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                }} 
                variant="default" 
                size="sm"
                disabled={isLoading}
                className="flex-1 md:flex-initial md:w-[120px]"
              >
                Approve
              </Button>
            ) : (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                }} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
                className="flex-1 md:flex-initial md:w-[120px]"
              >
                Disapprove
              </Button>
            )}
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleExecute();
              }} 
              variant="default" 
              size="sm"
              disabled={isLoading || status.stage !== 'executable'}
              className="flex-1 md:flex-initial md:w-[120px]"
            >
              {(intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') === 'UpgradePackage' ? 'Configure' :
               (intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') === 'BorrowCap' ? 'Configure' :
               'Execute'}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              variant="ghost"
              size="sm"
              disabled={isLoading || !status.deletable}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout (xl and above) */}
      <div className="hidden xl:flex items-center gap-4 w-full">
        
        <div className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyle()} w-24 shrink-0 text-left`}>
          {status.stage.charAt(0).toUpperCase() + status.stage.slice(1)}
        </div>

        <div className="flex items-center gap-2 w-72 shrink-0">
          <div className="p-1 rounded bg-gray-100">
            <intentDisplay.icon className="h-5 w-5" />
          </div>
          <span className="whitespace-nowrap">{intentDisplay.title}</span>
        </div>

        <div className="flex items-center gap-2 min-w-0 w-32 shrink-0">
          <span className="text-sm truncate block" title={intentKey}>
            {intentKey}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {!hasUserApproved ? (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
              }} 
              variant="default" 
              size="sm"
              disabled={isLoading}
              className="w-[85px]"
            >
              Approve
            </Button>
          ) : (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
              }} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
              className="w-[85px]"
            >
              Disapprove
            </Button>
          )}

          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleExecute();
            }} 
            variant="default" 
            size="sm"
            disabled={isLoading || status.stage !== 'executable'}
          >
            {(intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') === 'UpgradePackage' ? 'Configure' :
             (intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') === 'BorrowCap' ? 'Configure' :
             'Execute'}
          </Button>

          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }} 
            variant="ghost" 
            size="icon"
            disabled={isLoading || !status.deletable}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </div>
    </div>
  );
} 