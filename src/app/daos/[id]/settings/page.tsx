"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoMetadata, Dao } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import { useDaoClient } from "@/hooks/useDaoClient";

export default function DaoSettingsPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getDaoMetadata, getDao } = useDaoClient();
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [daoParams, setDaoParams] = useState<Dao | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTrigger = useDaoStore(state => state.refreshTrigger);

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const [metadata, params] = await Promise.all([
          getDaoMetadata(currentAccount.address, daoId),
          getDao(currentAccount.address, daoId)
        ]);
        
        setDao(metadata);
        setDaoParams(params);
      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
        setDaoParams(null);
      } finally {
        setLoading(false);
      }
    };

    initDao();
  }, [currentAccount?.address, refreshTrigger]);

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Welcome to DAO Settings</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to manage this DAO</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!dao || !daoParams) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">DAO Not Found</h1>
        <p className="text-gray-600">The DAO you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">DAO Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - DAO Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DAO Name
                </label>
                <input
                  type="text"
                  value={dao.name}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={dao.description}
                  disabled
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Social Links</h2>
            <div className="grid grid-cols-1 gap-4">
              {['twitter', 'discord', 'telegram', 'website'].map((platform) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {platform}
                  </label>
                  <input
                    type="text"
                    value={dao[platform as keyof DaoMetadata] as string || ''}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - DAO Parameters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Governance Parameters</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type
              </label>
              <input
                type="text"
                value={daoParams.assetType}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Voting Power
                </label>
                <input
                  type="text"
                  value={daoParams.authVotingPower.toString()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Voting Power
                </label>
                <input
                  type="text"
                  value={daoParams.maxVotingPower.toString()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Votes Required
                </label>
                <input
                  type="text"
                  value={daoParams.minimumVotes.toString()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voting Quorum
                </label>
                <input
                  type="text"
                  value={`${(Number(daoParams.votingQuorum) / 1_000_000_000).toFixed(2)}%`}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voting Rule
                </label>
                <input
                  type="text"
                  value={daoParams.votingRule === 1 ? "Quadratic" : "Linear"}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unstaking Cooldown
                </label>
                <input
                  type="text"
                  value={(() => {
                    const ms = Number(daoParams.unstakingCooldown);
                    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
                    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
                    
                    const parts = [];
                    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
                    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
                    
                    return parts.join(', ') || '0 minutes';
                  })()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Note: Parameters can only be modified through a DAO config proposal
      </div>
    </div>
  );
}
