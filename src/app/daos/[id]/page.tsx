"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";

export default function DaoPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const getOrInitClient = useDaoStore(state => state.getOrInitClient);
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        // Get or init client with the daoId - this will handle switching internally
        const client = await getOrInitClient(currentAccount.address, daoId);
        const metadata = client.getDaoMetadata();
        setDao(metadata);
      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
      } finally {
        setLoading(false);
      }
    };

    initDao();
  }, [currentAccount?.address, daoId, getOrInitClient]);

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-12">
        <h1 className="text-3xl font-bold mb-4">Welcome to DAO Dapp</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to view this DAO</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-12">
        <h1 className="text-3xl font-bold mb-4">DAO Not Found</h1>
        <p className="text-gray-600">The DAO you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white via-60% to-pink-300">
      <div className="container mx-auto py-32 px-4">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">{dao.name}</h1>
          {dao.description && (
            <p className="text-gray-600 text-center max-w-2xl">{dao.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
