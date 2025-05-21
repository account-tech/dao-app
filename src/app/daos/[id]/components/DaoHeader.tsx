import { DaoMetadata } from "@account.tech/dao";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useState } from "react";
import { toast } from "sonner";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useDaoStore } from "@/store/useDaoStore";
import { Bolt } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface DaoHeaderProps {
  dao: DaoMetadata;
  isSmallHeight: boolean;
  isFollowed?: boolean;
}

export default function DaoHeader({ dao, isSmallHeight, isFollowed = false }: DaoHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { followDao, unfollowDao } = useDaoClient();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshClient } = useDaoStore();

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handleFollowClick = async () => {
    if (!currentAccount?.address || isLoading) return;

    try {
      setIsLoading(true);
      let tx;
      
      if (isFollowed) {
        tx = await unfollowDao(currentAccount.address, dao.id);
      } else {
        tx = await followDao(currentAccount.address, dao.id);
      }

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      refreshClient();

    } catch (error) {
      console.error("Error following/unfollowing DAO:", error);
      toast.error(error instanceof Error ? error.message : "Failed to follow/unfollow DAO");
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = 'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ease-in-out';
    
    if (isLoading) {
      return `${baseStyles} bg-gray-100 cursor-wait min-w-[120px]`;
    }
    if (isFollowed) {
      return isHovering
        ? `${baseStyles} bg-red-50 text-red-500 hover:bg-red-100`
        : `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200`;
    }
    return `${baseStyles} bg-teal-500 text-white hover:bg-teal-600`;
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>
            {isFollowed ? 'Unfollowing...' : 'Following...'}
          </span>
        </div>
      );
    }
    if (isFollowed) return isHovering ? 'Unfollow' : 'Following';
    return 'Follow';
  };

  const handleSettingsClick = () => {
    router.push(`/daos/${daoId}/settings`);
  };

  return (
    <div className="mb-6 md:text-left text-center">
      <h1 className={`font-bold mb-2 ${isSmallHeight ? 'text-xl' : 'text-2xl'}`}>
        {dao.name}
      </h1>
      {dao.description && (
        <p className="text-gray-600 mt-2 text-sm">{dao.description}</p>
      )}

      {/* Statistics Bar */}
      <div className="flex justify-center md:justify-start gap-8 mt-6 text-sm">
        <div className="text-center">
          <div className="font-semibold">0</div>
          <div className="text-gray-600">proposals</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">0</div>
          <div className="text-gray-600">votes</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">0</div>
          <div className="text-gray-600">followers</div>
        </div>
      </div>

      {/* Social Links and Follow Button */}
      <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row justify-center md:justify-start items-center md:items-start gap-3 mt-4">
        <div className="flex gap-2">
          <TooltipProvider>
            {/* Twitter */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-2 rounded-full transition-colors ${dao.twitter ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
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
        </div>

        <div className="flex items-center gap-3 mt-3 lg:mt-0">
          {/* Settings Button */}
          <button
            onClick={handleSettingsClick}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out"
          >
            <Bolt className="w-4 h-4" />
            Settings
          </button>

          {/* Follow Button */}
          <button
            onClick={handleFollowClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            disabled={isLoading || !currentAccount?.address}
            className={getButtonStyles()}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
} 