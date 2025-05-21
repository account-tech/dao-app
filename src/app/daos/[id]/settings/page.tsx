"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { DaoMetadata, Dao } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import { useDaoClient } from "@/hooks/useDaoClient";
import { getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import { Copy, Info} from "lucide-react";
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
import { BasicInformationSection } from "./components/BasicInformationSection";

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
  const suiClient = useSuiClient();
  const { getDaoMetadata, getDao, getDaoVotingPowerInfo } = useDaoClient();
  const [dao, setDao] = useState<DaoMetadata | null>(null);
  const [daoParams, setDaoParams] = useState<Dao | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingPowerInfo, setVotingPowerInfo] = useState<{
    votingPower: string;
    authVotingPower: string;
    maxVotingPower: string;
    minimumVotes: string;
    hasAuthPower: boolean;
    isQuadratic: boolean;
  }>({
    votingPower: "0",
    authVotingPower: "0",
    maxVotingPower: "0",
    minimumVotes: "0",
    hasAuthPower: false,
    isQuadratic: false
  });
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  useEffect(() => {
    const initDao = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const [metadata, params, powerInfo] = await Promise.all([
          getDaoMetadata(currentAccount.address, daoId),
          getDao(currentAccount.address, daoId),
          getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient)
        ]);
        
        setDao(metadata);
        setDaoParams(params);
        setVotingPowerInfo(powerInfo);

      } catch (error) {
        console.error("Error initializing dao:", error);
        setDao(null);
        setDaoParams(null);
        setVotingPowerInfo({
          votingPower: "0",
          authVotingPower: "0",
          maxVotingPower: "0",
          minimumVotes: "0",
          hasAuthPower: false,
          isQuadratic: false
        });
      } finally {
        setLoading(false);
      }
    };

    initDao();
  }, [currentAccount?.address, refreshCounter]);

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
        {/* Left Section - Basic Information & Social Links */}
        <BasicInformationSection 
          dao={dao} 
          hasAuthPower={votingPowerInfo.hasAuthPower}
          authVotingPower={votingPowerInfo.authVotingPower}
          userAddr={currentAccount.address}
          daoId={daoId}
        />

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
                  value={votingPowerInfo.authVotingPower}
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
                  value={votingPowerInfo.maxVotingPower}
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
                  value={votingPowerInfo.minimumVotes}
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
                          {votingPowerInfo.isQuadratic 
                            ? "Quadratic voting: voting power scales as the square root of tokens staked, promoting fair distribution."
                            : "Linear voting: voting power is directly proportional to tokens staked."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <input
                  type="text"
                  value={votingPowerInfo.isQuadratic ? "Quadratic" : "Linear"}
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
                    disabled={!votingPowerInfo.hasAuthPower}
                    className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Request DAO Configuration
                  </button>
                </TooltipTrigger>
                {!votingPowerInfo.hasAuthPower && (
                  <TooltipContent>
                    <p>You need to stake more DAO tokens to reach the required voting power of {votingPowerInfo.authVotingPower}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Alert className={`border shadow-none ${!votingPowerInfo.hasAuthPower ? 'bg-yellow-50/50 border-yellow-100' : 'bg-teal-50/50 border-teal-100'}`}>
              <Info className={!votingPowerInfo.hasAuthPower ? 'h-4 w-4 text-yellow-600' : 'h-4 w-4 text-teal-600'} />
              <AlertDescription className={!votingPowerInfo.hasAuthPower ? 'text-yellow-800 text-sm' : 'text-teal-800 text-sm'}>
                {!votingPowerInfo.hasAuthPower 
                  ? `You need at least ${votingPowerInfo.authVotingPower} voting power to request configuration changes. Current: ${votingPowerInfo.votingPower}. Stake more tokens to request configuration changes.`
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
          hasAuthPower={votingPowerInfo.hasAuthPower}
          authVotingPower={votingPowerInfo.authVotingPower}
          votingPower={votingPowerInfo.votingPower}
        />
      </div>
    </div>
  );
}
