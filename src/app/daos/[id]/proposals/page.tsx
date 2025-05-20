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

export default function ProposalsPage() {
  const currentAccount = useCurrentAccount();
  const params = useParams();
  const daoId = params.id as string;
  const { getIntents, getIntentStatus } = useDaoClient();
  const refreshCounter = useDaoStore(state => state.refreshCounter);

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
  }, [currentAccount?.address, daoId, refreshCounter]);

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
          <div className="text-center py-8 text-gray-500">
            No proposals found
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