"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoMetadata, Dao } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import { useDaoClient } from "@/hooks/useDaoClient";
import { getSimplifiedAssetType, getCoinDecimals, formatCoinAmount } from "@/utils/GlobalHelpers";
import { Copy, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { DependenciesSection } from "./components/DependenciesSection";
import { SettingsSkeletonLoader } from "./components/SettingsSkeletonLoader";

// Helper function from VotingQuorumStep
const getCurrentPercentage = (value: bigint): number => {
  const percentage = Number(value) / 10000000; // Convert from 1e9 scale to percentage
  return percentage < 1 ? 0 : percentage; // Return 0 if less than 1%
};

const formatUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export default function DaoSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getDaoMetadata, getDao, getParticipant } = useDaoClient();
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [daoParams, setDaoParams] = useState<Dao | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAuthPower, setHasAuthPower] = useState(false);
  const [votingPower, setVotingPower] = useState<string>("0");
  const refreshTrigger = useDaoStore(state => state.refreshTrigger);

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const [metadata, params, participant] = await Promise.all([
          getDaoMetadata(currentAccount.address, daoId),
          getDao(currentAccount.address, daoId),
          getParticipant(currentAccount.address, daoId)
        ]);
        
        setDao(metadata);
        setDaoParams(params);

        if (!participant || !params) {
          throw new Error("Failed to fetch participant or dao data");
        }

        // Calculate total staked amount
        let totalStakedValue = BigInt(0);
        if (participant.staked && Array.isArray(participant.staked)) {
          totalStakedValue = participant.staked.reduce((acc, stake) => {
            if (stake.daoAddr === daoId) {
              return acc + BigInt(stake.value);
            }
            return acc;
          }, BigInt(0));
        }

        // Get decimals for the asset type
        const simplifiedAssetType = getSimplifiedAssetType(participant.assetType);
        const fetchedDecimals = await getCoinDecimals(simplifiedAssetType);
        
        // Calculate voting power based on the rule
        const isQuadraticVoting = params.votingRule === 1;
        const stakedAmount = Number(formatCoinAmount(totalStakedValue, fetchedDecimals));
        
        let power: string | number;
        if (isQuadraticVoting) {
          power = Math.sqrt(stakedAmount);
        } else {
          power = stakedAmount;
        }
        
        const formattedPower = Number(power).toFixed(2);
        setVotingPower(formattedPower);
        
        // Check if user has enough voting power for auth actions
        setHasAuthPower(Number(formattedPower) >= Number(params.authVotingPower));

      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
        setDaoParams(null);
        setHasAuthPower(false);
        setVotingPower("0");
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
    return <SettingsSkeletonLoader />;
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
      <h1 className="text-3xl font-bold mb-8 text-gray-900 text-center">DAO Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - DAO Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">Basic Information</h2>
            <div className="space-y-6">
              {/* DAO Image */}
              <div className="flex justify-center mb-6">
                <div className="relative overflow-hidden border-4 border-white shadow-lg bg-white w-20 h-20 rounded-2xl">
                  {dao.image && (dao.image?.startsWith('/') || dao.image?.startsWith('http')) ? (
                    <img
                      src={dao.image}
                      alt={`${dao.name} logo`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">🏛️</span>
                    </div>
                  )}
                </div>
              </div>

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
            <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">Social Links</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-2 items-center">
                <TooltipProvider>
                  {/* Twitter */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className={`px-2 rounded-full transition-colors ${dao.twitter ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                        onClick={() => dao.twitter && window.open(formatUrl(dao.twitter), '_blank')}
                        disabled={!dao.twitter}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dao.twitter ? 'Twitter' : 'Twitter not set'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="text"
                  value={dao.twitter || ''}
                  disabled
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div className="flex gap-2 items-center">
                <TooltipProvider>
                  {/* Discord */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className={`p-2 rounded-full transition-colors ${dao.discord ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                        onClick={() => dao.discord && window.open(formatUrl(dao.discord), '_blank')}
                        disabled={!dao.discord}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                        </svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dao.discord ? 'Discord' : 'Discord not set'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="text"
                  value={dao.discord || ''}
                  disabled
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div className="flex gap-2 items-center">
                <TooltipProvider>
                  {/* Telegram */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className={`p-2 rounded-full transition-colors ${dao.telegram ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                        onClick={() => dao.telegram && window.open(formatUrl(dao.telegram), '_blank')}
                        disabled={!dao.telegram}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2z"/></svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dao.telegram ? 'Telegram' : 'Telegram not set'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="text"
                  value={dao.telegram || ''}
                  disabled
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div className="flex gap-2 items-center">
                <TooltipProvider>
                  {/* GitHub */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className={`p-2 rounded-full transition-colors ${dao.github ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                        onClick={() => dao.github && window.open(formatUrl(dao.github), '_blank')}
                        disabled={!dao.github}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dao.github ? 'GitHub' : 'GitHub not set'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="text"
                  value={dao.github || ''}
                  disabled
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div className="flex gap-2 items-center">
                <TooltipProvider>
                  {/* Website */}
                  <Tooltip>   
                    <TooltipTrigger asChild>
                      <button 
                        className={`p-2 rounded-full transition-colors ${dao.website ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                        onClick={() => dao.website && window.open(formatUrl(dao.website), '_blank')}
                        disabled={!dao.website}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dao.website ? 'Website' : 'Website not set'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="text"
                  value={dao.website || ''}
                  disabled
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - DAO Parameters */}
        <div className="bg-white rounded-lg shadow p-6 relative">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">Governance Parameters</h2>
          <div className="space-y-6 pb-16">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Asset Type
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The token type used for governance in this DAO. This determines what tokens can be staked for voting power.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={(() => {
                    const fullType = getSimplifiedAssetType(daoParams.assetType);
                    if (fullType.length <= 42) return fullType;
                    return `${fullType.slice(0, 20)}...${fullType.slice(-20)}`;
                  })()}
                  disabled
                  className="w-full px-3 py-2 pr-10 border rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => {
                    const type = getSimplifiedAssetType(daoParams.assetType);
                    navigator.clipboard.writeText(type);
                    toast.success("Asset type copied to clipboard");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-teal-500 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Auth Voting Power
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Auth voting power required to create proposals and participate in key DAO activities.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={daoParams.authVotingPower.toString()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Voting Power
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Maximum voting power any single member can have, preventing concentration of power.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={daoParams.maxVotingPower.toString()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Votes Required
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The minimum number of votes needed for a proposal to be considered valid.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={daoParams.minimumVotes.toString()}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Voting Rule
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {daoParams.votingRule === 1 
                            ? "Quadratic voting: voting power scales as the square root of tokens staked, promoting fair distribution."
                            : "Linear voting: voting power is directly proportional to tokens staked."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={daoParams.votingRule === 1 ? "Quadratic" : "Linear"}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Unstaking Cooldown
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">The waiting period required after unstaking tokens before they can be claimed.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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

            {/* Voting Quorum with Slider */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Voting Quorum
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The minimum ratio of "Yes" votes to total votes required for a proposal to pass. Calculated as: Yes votes / (Yes votes + No votes).</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-6 pt-2">
                <Slider
                  value={[getCurrentPercentage(daoParams.votingQuorum)]}
                  max={100}
                  min={0}
                  step={1}
                  disabled
                />
                <div className="text-center">
                  <span className="text-2xl font-bold text-teal-600">
                    {getCurrentPercentage(daoParams.votingQuorum)}%
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    For a proposal to pass, at least {getCurrentPercentage(daoParams.votingQuorum)}% of all votes must be "Yes" votes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(`/daos/${daoId}/settings/requestConfigDao`)}
                    disabled={!hasAuthPower}
                    className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Request DAO Configuration
                  </button>
                </TooltipTrigger>
                {!hasAuthPower && (
                  <TooltipContent>
                    <p>You need to stake more DAO tokens to reach the required voting power of {daoParams.authVotingPower}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Alert className={`border shadow-none ${!hasAuthPower ? 'bg-yellow-50/50 border-yellow-100' : 'bg-teal-50/50 border-teal-100'}`}>
              <Info className={!hasAuthPower ? 'h-4 w-4 text-yellow-600' : 'h-4 w-4 text-teal-600'} />
              <AlertDescription className={!hasAuthPower ? 'text-yellow-800 text-sm' : 'text-teal-800 text-sm'}>
                {!hasAuthPower 
                  ? `You need at least ${daoParams.authVotingPower} voting power to request configuration changes. Current: ${votingPower}. Stake more tokens to request configuration changes.`
                  : "You have enough voting power to request configuration changes"}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Dependencies Section */}
      <div className="mt-8">
        <DependenciesSection 
          daoId={daoId} 
          hasAuthPower={hasAuthPower}
          authVotingPower={daoParams.authVotingPower}
          votingPower={votingPower}
        />
      </div>
    </div>
  );
}
