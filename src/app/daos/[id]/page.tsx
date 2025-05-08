"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import UserData from "./components/UserData";
import Image from "next/image";

// Custom hook for height-based media queries
const useScreenHeight = () => {
  const [isSmallHeight, setIsSmallHeight] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      setIsSmallHeight(window.innerHeight < 768);
    };

    // Initial check
    checkHeight();

    // Add event listener
    window.addEventListener('resize', checkHeight);

    // Cleanup
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  return isSmallHeight;
};

export default function DaoPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const getOrInitClient = useDaoStore(state => state.getOrInitClient);
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const isSmallHeight = useScreenHeight();

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
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

  // Check if image URL is valid for Next.js (starts with "/" or "http")
  const isValidImageUrl = dao.image?.startsWith('/') || dao.image?.startsWith('http');

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100">
      {/* Top Section */}
      <div 
        className={`bg-gradient-to-b from-white to-transparent ${
          isSmallHeight ? 'h-[25vh]' : 'h-[15vh]'
        }`}
      />

      {/* DAO Image - Left-aligned on md screens, centered on smaller screens */}
      <div 
        className="relative z-20 flex md:container md:mx-auto md:px-6" 
        style={{ 
          marginTop: isSmallHeight ? '-4rem' : '-3.25rem',
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
          marginTop: isSmallHeight ? '-1rem' : '-1.2rem'
        }}
      >
        <div className="absolute inset-x-0 -top-6 h-6 bg-white rounded-t-[32px]" />
        <div className="bg-white px-6 pb-20 min-h-[90vh] pt-12">
          {/* DAO Info */}
          <div className="mb-8 md:container md:mx-auto">
            <div className="md:max-w-2xl text-center md:text-left">
              <h1 className={`font-bold mb-2 ${isSmallHeight ? 'text-xl' : 'text-2xl'}`}>
                {dao.name}
              </h1>
              {dao.description && (
                <p className="text-gray-600 mt-2 text-sm">{dao.description}</p>
              )}
              
              {/* User Data Section */}
              <div className="mt-6">
                <UserData daoId={daoId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
