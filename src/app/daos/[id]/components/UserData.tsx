"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { getCoinDecimals } from "@/utils/tx/GlobalHelpers";

export default function UserData({ daoId }: { daoId: string }) {
  const currentAccount = useCurrentAccount();
  const { getParticipant, getDao } = useDaoClient();
  const [votingPower, setVotingPower] = useState<string>("0");
  const [loading, setLoading] = useState(true);

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
        const decimals = await getCoinDecimals(participant.assetType);
        
        // Calculate actual coin balance using decimals
        const actualBalance = Number(participant.coinBalance) / Math.pow(10, decimals);
        
        // Calculate voting power based on voting rule
        const isQuadratic = dao.votingRule === 1;
        const power = isQuadratic ? Math.sqrt(actualBalance) : actualBalance;
        
        setVotingPower(power.toFixed(2));
      } catch (error) {
        console.error("Error calculating voting power:", error);
        setVotingPower("0");
      } finally {
        setLoading(false);
      }
    };

    fetchVotingPower();
  }, [currentAccount?.address, daoId, getParticipant, getDao]);

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
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Voting Power</span>
        <span className="font-semibold">{votingPower}</span>
      </div>
    </div>
  );
}
