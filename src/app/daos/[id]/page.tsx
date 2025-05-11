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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        // Consider a screen "large height" only if it's both:
        // - taller than 899px AND
        // - wider than 640px (sm breakpoint)
        isLargeHeight: height > 899 && width > 640,
        // Track if we're on mobile
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

export default function DaoPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const getOrInitClient = useDaoStore(state => state.getOrInitClient);
  const { getDaoMetadata, getUserDaos } = useDaoClient();
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSmallHeight, isLargeHeight, isMobile } = useScreenHeight();
  const refreshTrigger = useDaoStore(state => state.refreshTrigger);

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const [fetchingDaoMetadata, userDaos] = await Promise.all([
          getDaoMetadata(currentAccount.address, daoId),
          getUserDaos(currentAccount.address)
        ]);
        
        setDao(fetchingDaoMetadata);
        setIsFollowed(userDaos.some(userDao => userDao.id === daoId));
      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
      } finally {
        setLoading(false);
      }
    };

    initDao();
  }, [currentAccount?.address, daoId, getOrInitClient, refreshTrigger]);

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

  // Check if image URL is valid for Next.js (starts with "/" or "http")
  const isValidImageUrl = dao.image?.startsWith('/') || dao.image?.startsWith('http');

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100">
      {/* Top Section */}
      <div 
        className={`bg-gradient-to-b from-white to-transparent ${
          isSmallHeight ? 'h-[28vh]' : 
          isLargeHeight ? 'h-[15vh]' : 
          isMobile ? 'h-[20vh]' : 
          'h-[18vh]'
        }`}
      />

      {/* DAO Image */}
      <div 
        className="relative z-20 flex md:max-w-none md:px-20" 
        style={{ 
          marginTop: isSmallHeight ? '-4rem' : 
                    isLargeHeight ? '-2.5rem' : 
                    isMobile ? '-3.5rem' : 
                    '-3.25rem',
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

      {/* Main Content Card */}
      <div 
        className="relative" 
        style={{ 
          marginTop: isSmallHeight ? '-2rem' : 
                    isLargeHeight ? '-2rem' : 
                    isMobile ? '-2.25rem' : 
                    '-2.5rem'
        }}
      >
        <div className="px-4 md:px-20 pb-20 min-h-[90vh] pt-12 bg-white rounded-t-[32px]">
          {/* DAO Info */}
          <div className="mb-8">
            <DaoHeader dao={dao} isSmallHeight={isSmallHeight} isFollowed={isFollowed} />
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">
            {/* Left Column (Proposals) */}
            <div className="flex-1 order-2 md:order-1">
              <h2 className="text-xl font-semibold mb-4">Proposals</h2>
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                Proposals coming soon
              </div>
            </div>

            {/* Right Column (UserData + Assets) */}
            <div className="w-full md:w-[350px] lg:w-[450px] order-1 md:order-2 md:-mt-44">
              {/* User Data Section */}
              <UserData daoId={daoId} />

              {/* Assets Section */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Assets</h2>
                <div className="space-y-4">
                  {/* Wallet Preview */}
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <h3 className="font-medium mb-2">Wallet</h3>
                    <WalletPreview />
                  </div>

                  {/* Vaults Square */}
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-pink-200 transition-colors">
                    <h3 className="font-medium mb-2">Vaults</h3>
                    <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
                      Coming soon
                    </div>
                  </div>

                  {/* Kiosks Square */}
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-pink-200 transition-colors">
                    <h3 className="font-medium mb-2">Kiosks</h3>
                    <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
