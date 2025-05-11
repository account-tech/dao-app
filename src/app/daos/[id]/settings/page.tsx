"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import { useDaoClient } from "@/hooks/useDaoClient";

export default function DaoSettingsPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getDaoMetadata } = useDaoClient();
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTrigger = useDaoStore(state => state.refreshTrigger);

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const fetchingDaoMetadata = await getDaoMetadata(currentAccount.address, daoId);
        setDao(fetchingDaoMetadata);
      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">DAO Not Found</h1>
        <p className="text-gray-600">The DAO you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">DAO Settings</h1>

      {/* Basic Information Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
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

      {/* Social Links Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Social Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twitter
            </label>
            <input
              type="text"
              value={dao.twitter || ''}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discord
            </label>
            <input
              type="text"
              value={dao.discord || ''}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telegram
            </label>
            <input
              type="text"
              value={dao.telegram || ''}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="text"
              value={dao.website || ''}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Voting Settings Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Voting Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Voting Power
            </label>
            <input
              type="text"
              value="25"
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
              value="Simple Majority"
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Note: Settings management functionality coming soon
      </div>
    </div>
  );
}
