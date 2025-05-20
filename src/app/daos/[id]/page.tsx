"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import { useDaoClient } from "@/hooks/useDaoClient";
import UserData from "./components/UserData";
import DaoHeader from "./components/DaoHeader";
import Image from "next/image";
import WalletPreview from "@/app/daos/[id]/components/WalletPreview";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProposalCard } from "./proposals/components/ProposalCard";
import { Intent } from "@account.tech/core";
import { IntentStatus } from "@account.tech/dao";

// Custom hook for height-based media queries
const useScreenHeight = () => {
  const [screenState, setScreenState] = useState({
    isSmallHeight: false,
    isLargeHeight: false,
    isMobile: false
  });

  useEffect(() => {
    const checkDimensions = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      setScreenState({
        isSmallHeight: height < 768,
        isLargeHeight: height > 899 && width > 640,
        isMobile: width <= 640
      });
    };

    // Initial check
    checkDimensions();

    // Add event listener
    window.addEventListener('resize', checkDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', checkDimensions);
  }, []);

  return screenState;
};

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

export default function DaoPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getDaoMetadata, getUserDaos, getIntents, getIntentStatus } = useDaoClient();
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSmallHeight, isLargeHeight, isMobile } = useScreenHeight();
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  const router = useRouter();

  // New state for proposals
  const [recentProposals, setRecentProposals] = useState<Array<[string, Intent]>>([]);
  const [intentStatuses, setIntentStatuses] = useState<Record<string, IntentStatus>>({});

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        
        // Fetch metadata and user daos in parallel
        const [fetchedDaoMetadata, userDaos, fetchedIntents] = await Promise.all([
          getDaoMetadata(currentAccount.address, daoId),
          getUserDaos(currentAccount.address),
          getIntents(currentAccount.address, daoId)
        ]);
        
        setDao(fetchedDaoMetadata);
        setIsFollowed(userDaos.some(userDao => userDao.id === daoId));

        // Process intents if they exist
        if (fetchedIntents?.intents) {
          // Sort intents by creation time and take the first 3
          const sortedIntents = Object.entries(fetchedIntents.intents)
            .sort(([, a], [, b]) => {
              const timeA = (a as any).fields?.creationTime ? Number((a as any).fields.creationTime) : 0;
              const timeB = (b as any).fields?.creationTime ? Number((b as any).fields.creationTime) : 0;
              return timeB - timeA; // Newest first
            })
            .slice(0, 4);

          setRecentProposals(sortedIntents);

          // Fetch statuses for the recent proposals
          const statuses: Record<string, IntentStatus> = {};
          for (const [key] of sortedIntents) {
            try {
              const status = await getIntentStatus(currentAccount.address, daoId, key);
              statuses[key] = status;
            } catch (error) {
              console.error(`Error fetching status for intent ${key}:`, error);
            }
          }
          setIntentStatuses(statuses);
        }
      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
      } finally {
        setLoading(false);
      }
    };

    initDao();
  }, [currentAccount?.address, daoId, refreshCounter]);

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Welcome to DAO Dapp</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to view this DAO</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

  // Check if image URL is valid for Next.js (starts with "/" or "http")
  const isValidImageUrl = dao.image?.startsWith('/') || dao.image?.startsWith('http');

  return (
    <>
      {/* DAO Image */}
      <div 
        className="relative z-20 flex md:max-w-none mb-8" 
        style={{ 
          marginTop: isSmallHeight ? '-5rem' : 
                    isLargeHeight ? '-5.5rem' : 
                    isMobile ? '-5.5rem' : 
                    '-5.25rem',
        }}
      >
        <div className={`
          relative overflow-hidden border-4 border-white shadow-lg bg-white
          mx-auto md:mx-0
          ${isSmallHeight ? 'w-16 h-16 rounded-xl' : 'w-20 h-20 rounded-2xl'}
        `}>
          {dao.image && isValidImageUrl ? (
            <Image
              src={dao.image}
              alt={dao.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className={isSmallHeight ? 'text-xl' : 'text-2xl'}>🏛️</span>
            </div>
          )}
        </div>
      </div>

      {/* DAO Info */}
      <div className="mb-8">
        <DaoHeader dao={dao} isSmallHeight={isSmallHeight} isFollowed={isFollowed} />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">
        {/* Left Column (Proposals) */}
        <div className="flex-1 order-2 mt-8 md:mt-0 md:order-1">
          <h2 className="text-xl font-semibold mb-4">Recent Proposals</h2>
          <div className="rounded-lg">
            <div className="space-y-2">
              {recentProposals.length > 0 ? (
                <>
                  {recentProposals.map(([key, intent]) => (
                    <ProposalCard
                      key={key}
                      intentKey={key}
                      intent={intent}
                    />
                  ))}
                  <div className="p-4 border-t border-gray-100">
                    <Button
                      onClick={() => router.push(`/daos/${daoId}/proposals`)}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      View All Proposals
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
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
              )}
            </div>
          </div>
        </div>

        {/* Right Column (UserData + Assets) */}
        <div className="w-full md:w-[350px] lg:w-[450px] order-1 md:order-2 md:-mt-52">
          {/* User Data Section */}
          <UserData daoId={daoId} />

          {/* Assets Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Assets</h2>
            <div className="space-y-4">
              {/* Wallet Preview */}
              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <h3 className="font-medium mb-2">Wallet</h3>
                <WalletPreview />
              </div>

              {/* Vaults Square */}
              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <h3 className="font-medium mb-2">Vaults</h3>
                <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
                  Coming soon
                </div>
              </div>

              {/* Kiosks Square */}
              <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <h3 className="font-medium mb-2">Kiosks</h3>
                <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
