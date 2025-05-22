"use client";

import { useState, useEffect, ReactNode } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { Intent } from "@account.tech/core";
import { intentHandlers } from "../helpers/intentHandlers";
import { Loader2 } from "lucide-react";

interface ProposalChangesProps {
  daoId: string;
  intentKey: string;
}

interface Changes {
  title: string;
  description: ReactNode;
}

export function ProposalChanges({ daoId, intentKey }: ProposalChangesProps) {
  const currentAccount = useCurrentAccount();
  const { getIntent, getunverifiedDepsAllowedBool, getConfigDaoIntentChanges, getAmountsFromWithdrawIntent } = useDaoClient();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Changes | null>(null);
  const [unverifiedDepsAllowed, setUnverifiedDepsAllowed] = useState<boolean | undefined>(undefined);
  const [configChanges, setConfigChanges] = useState<any>(null);
  const [withdrawAmounts, setWithdrawAmounts] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount?.address) return;

      try {
        setIsLoading(true);
        setError(null);

        // First fetch the intent
        const fetchedIntent = await getIntent(currentAccount.address, daoId, intentKey);
        setIntent(fetchedIntent);

        if (!fetchedIntent) {
          throw new Error("Failed to fetch intent");
        }

        // Get the intent type
        const intentType = (fetchedIntent as any).fields?.type_?.split('::').pop()?.replace('Intent', '') || 'Unknown';

        // Fetch additional data based on intent type
        let additionalData = {};
        
        if (intentType === 'ToggleUnverifiedAllowed') {
          const isAllowed = await getunverifiedDepsAllowedBool(currentAccount.address, daoId);
          additionalData = { unverifiedDepsAllowed: isAllowed };
          setUnverifiedDepsAllowed(isAllowed);
        } else if (intentType === 'ConfigDao') {
          const configChangesData = await getConfigDaoIntentChanges(currentAccount.address, daoId, intentKey);
          additionalData = { configChanges: configChangesData };
          setConfigChanges(configChangesData);
        } else if (intentType === 'WithdrawAndTransfer') {
          const amounts = await getAmountsFromWithdrawIntent(currentAccount.address, daoId, intentKey);
          additionalData = { withdrawAmounts: amounts };
          setWithdrawAmounts(amounts);
        }

        // Find and call the appropriate handler with all data
        const handler = intentHandlers[intentType];
        if (handler) {
          const result = handler({
            intent: fetchedIntent,
            daoId,
            ...additionalData
          });
          setChanges(result);
        } else {
          setError(`No handler found for intent type: ${intentType}`);
        }
      } catch (error) {
        console.error("Error fetching intent:", error);
        setError("Failed to fetch proposal details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentAccount?.address, daoId, intentKey]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!changes) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold">Proposed Changes</h2>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">{changes.title}</h3>
        <div className="text-sm text-gray-600">{changes.description}</div>
      </div>
    </div>
  );
}
