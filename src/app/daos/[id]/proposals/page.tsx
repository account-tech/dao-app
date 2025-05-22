'use client';

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useDaoStore } from "@/store/useDaoStore";
import { toast } from "sonner";
import { IntentStatus } from "@account.tech/dao";
import { Intent } from "@account.tech/core";
import { ProposalCard } from "./components/ProposalCard";
import { ProposalFilters } from "./components/ProposalFilters";
import { ProposalStatus } from "./helpers/types";

const ProposalPlaceholder = () => (
  <div className="bg-white/50 rounded-lg border border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-gray-50">
          <div className="w-5 h-5 bg-gray-100 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-5 w-48 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-0">
        <div className="px-3 py-1 rounded-full bg-gray-100 w-20" />
      </div>
    </div>

    <div className="flex flex-wrap gap-3 sm:gap-5">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-100 rounded" />
        <div className="w-16 h-4 bg-gray-100 rounded" />
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-100 rounded" />
        <div className="w-16 h-4 bg-gray-100 rounded" />
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-100 rounded" />
        <div className="w-16 h-4 bg-gray-100 rounded" />
      </div>
    </div>

    <div className="flex h-1.5 sm:h-2 overflow-hidden rounded-full bg-gray-50">
      <div className="bg-gray-100 w-1/2" />
    </div>

    <div className="text-xs sm:text-sm text-gray-500">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
        <div className="w-32 h-4 bg-gray-100 rounded" />
        <div className="w-32 h-4 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
);

export default function ProposalsPage() {
  const currentAccount = useCurrentAccount();
  const params = useParams();
  const daoId = params.id as string;
  const { getIntents, getIntentStatus } = useDaoClient();
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  const refreshCounterProposals = useDaoStore(state => state.refreshCounterProposals);

  const [intents, setIntents] = useState<Record<string, Intent> | undefined>(undefined);
  const [intentStatuses, setIntentStatuses] = useState<Record<string, IntentStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchIntents = async () => {
    if (!currentAccount) {
      setIntents(undefined);
      setIsLoading(false);
      return;
    }

    if (!daoId) {
      setIntents(undefined);
      setIsLoading(false);
      return;
    }

    try {
      const fetchedResult = await getIntents(currentAccount.address, daoId);

      const fetchedIntents = fetchedResult?.intents;

      if (fetchedIntents) {
        setIntents(fetchedIntents);

        const statuses: Record<string, IntentStatus> = {};
        for (const [key, intent] of Object.entries(fetchedIntents)) { 
          try {
            const status = await getIntentStatus(currentAccount.address, daoId, key); 
            statuses[key] = status;
          } catch (error) {
            console.error(`Error fetching status for intent ${key}:`, error);
          }
        }
        setIntentStatuses(statuses);
      } else {
        setIntents(undefined);
        setIntentStatuses({});
      }
    } catch (error) {
      console.error('Error fetching intents:', error);
      toast.error("Failed to fetch proposals");
      setIntents(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchIntents();
  }, [currentAccount?.address, daoId, refreshCounter, refreshCounterProposals]);

  const filteredIntents = intents ? Object.entries(intents)
    // First filter the intents
    .filter(([key, intent]) => {
      const status = intentStatuses[key]?.stage;
      const intentType = (intent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') || 'Unknown';

      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesType = typeFilter === 'all' || intentType === typeFilter;

      return matchesStatus && matchesType;
    })
    // Then sort by creationTime in descending order
    .sort(([, a], [, b]) => {
      const timeA = (a as any).fields?.creationTime ? Number((a as any).fields.creationTime) : 0;
      const timeB = (b as any).fields?.creationTime ? Number((b as any).fields.creationTime) : 0;
      return timeB - timeA; // Descending order (newest first)
    }) : [];

  if (!currentAccount) {
    return <div className="flex justify-center items-center h-screen">Please connect your wallet</div>;
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Proposals</h1>
        </div>
        <div className="space-y-6">
          <ProposalPlaceholder />
          <ProposalPlaceholder />
          <ProposalPlaceholder />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Proposals</h1>
      </div>

      <ProposalFilters
        status={statusFilter}
        type={typeFilter}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
      />

      <div className="space-y-6">
        {intents && filteredIntents.length === 0 ? (
          <div className="relative">
            <div className="opacity-30 space-y-6">
              <ProposalPlaceholder />
              <ProposalPlaceholder />
              <ProposalPlaceholder />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No proposals yet</p>
                <p className="text-sm text-gray-600 mt-2">Be the first to create a proposal for this DAO</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredIntents.map(([key, intent]) => (
              <ProposalCard
                key={key}
                intentKey={key}
                intent={intent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}