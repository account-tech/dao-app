"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { Intent } from "@account.tech/core";
import { IntentStatus } from "@account.tech/dao";
import { Clock, Info } from "lucide-react";
import { getIntentDisplay } from "@/app/daos/[id]/proposals/helpers/types";
import { useDaoStore } from "@/store/useDaoStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalDetailsProps {
  daoId: string;
  intentKey: string;
}

export function ProposalDetails({ daoId, intentKey }: ProposalDetailsProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { getIntent, getIntentStatus } = useDaoClient();
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  const [intent, setIntent] = useState<Intent | null>(null);
  const [status, setStatus] = useState<IntentStatus>({ stage: 'pending', deletable: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount?.address) return;

      try {
        setIsLoading(true);
        const [fetchedIntent, intentStatus] = await Promise.all([
          getIntent(currentAccount.address, daoId, intentKey),
          getIntentStatus(currentAccount.address, daoId, intentKey)
        ]);

        setIntent(fetchedIntent);
        setStatus(intentStatus);
      } catch (error) {
        console.error("Error fetching proposal data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentAccount?.address, daoId, refreshCounter]);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>;
  }

  if (!intent) {
    return <div>Proposal not found</div>;
  }

  const intentType = (intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') || 'Unknown';
  const intentDisplay = getIntentDisplay(intentType);
  const creator = (intent as any).fields?.creator || 'Unknown';
  const description = (intent as any).fields?.description || 'No description provided';
  
  // Get voting information from intent
  const voteOutcome = (intent as any).outcome;
  const startTime = voteOutcome?.startTime ? new Date(Number(voteOutcome.startTime)) : null;
  const endTime = voteOutcome?.endTime ? new Date(Number(voteOutcome.endTime)) : null;
  const executionTime = (intent as any).fields?.executionTimes?.[0] ? new Date(Number((intent as any).fields.executionTimes[0])) : null;

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

  const getStatusStyle = () => {
    switch (status.stage) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'open':
        return 'text-blue-600 bg-blue-50';
      case 'closed':
        return 'text-red-600 bg-red-50';
      case 'executable':
        return 'text-teal-500 bg-teal-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getTimeDisplay = () => {
    if (!startTime || !endTime) return null;

    switch (status.stage) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Starting: {formatDate(startTime)}</span>
          </div>
        );
      case 'open':
        const now = new Date();
        const remainingTime = endTime.getTime() - now.getTime();
        const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        const remainingHours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        
        let timeDisplay;
        if (remainingTime <= 0) {
          timeDisplay = 'Ending soon';
        } else if (remainingTime < 60000) { // less than 1 minute
          timeDisplay = `${remainingSeconds}s remaining`;
        } else {
          const parts = [];
          if (remainingDays > 0) parts.push(`${remainingDays}d`);
          if (remainingHours > 0) parts.push(`${remainingHours}h`);
          if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
          timeDisplay = `${parts.join(' ')} remaining`;
        }
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{timeDisplay}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Started: {formatDate(startTime)}</p>
                <p>Ends: {formatDate(endTime)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'closed':
      case 'executable':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Started: {formatDate(startTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Ended: {formatDate(endTime)}</span>
            </div>
            {executionTime && status.stage === 'executable' && (
              <div className="flex items-center gap-2 text-teal-600">
                <Info className="h-4 w-4" />
                <span>Executable from: {formatDate(executionTime)}</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header with Type and Status */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-gray-100">
            <intentDisplay.icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-medium">{intentDisplay.title}</h2>
            <p className="text-sm text-gray-600">Type: {intentType}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle()}`}>
          {status.stage.charAt(0).toUpperCase() + status.stage.slice(1)}
        </div>
      </div>

      {/* Intent Key */}
      <div>
        <p className="text-sm text-gray-600 mb-1">Intent Key</p>
        <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">{intentKey}</p>
      </div>

      {/* Creator */}
      <div>
        <p className="text-sm text-gray-600 mb-1">Created by</p>
        <p className="font-mono text-sm break-all">{creator}</p>
      </div>

      {/* Description */}
      <div>
        <p className="text-sm text-gray-600 mb-1">Description</p>
        <p className="text-sm whitespace-pre-wrap">{description}</p>
      </div>

      {/* Timing Information */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Timing</p>
        {getTimeDisplay()}
        {/* Expiration Time */}
        {(intent as any).fields?.expirationTime && (
          <div className="mt-2">
            {(() => {
              const expirationTime = new Date(Number((intent as any).fields.expirationTime));
              const now = new Date();
              const hasExpired = now > expirationTime;
              
              return (
                <div className={`flex items-center gap-2 ${hasExpired ? 'text-red-600' : 'text-gray-600'}`}>
                  <Clock className="h-4 w-4" />
                  <span>
                    {hasExpired 
                      ? `Expired on: ${formatDate(expirationTime)}`
                      : `Will expire on: ${formatDate(expirationTime)}`
                    }
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
