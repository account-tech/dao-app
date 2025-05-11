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

interface DaoHeaderProps {
  dao: DaoMetadata;
  isSmallHeight: boolean;
  isFollowed?: boolean;
}

export default function DaoHeader({ dao, isSmallHeight, isFollowed = false }: DaoHeaderProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { followDao, unfollowDao } = useDaoClient();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const triggerRefresh = useDaoStore(state => state.triggerRefresh);
  const resetClient = useDaoStore(state => state.resetClient);

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

      resetClient();
      triggerRefresh();
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
    return `${baseStyles} bg-pink-600 text-white hover:bg-pink-700`;
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
      <div className="flex justify-center md:justify-start items-center gap-3 mt-4">
        <div className="flex gap-2">
          <TooltipProvider>
            {/* Twitter */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`p-2 rounded-full transition-colors ${dao.twitter ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300'}`}
                  onClick={() => dao.twitter && window.open(dao.twitter, '_blank')}
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
                  onClick={() => dao.discord && window.open(dao.discord, '_blank')}
                  disabled={!dao.discord}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 12H4.5C4.5 7 7 4 12 4C17 4 19.5 7 19.5 12H15.5"/><path d="M17 12.5C17 15.5 14.5 18 12 18S7 15.5 7 12.5"/><path d="M12 4V3"/></svg>
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
                  onClick={() => dao.telegram && window.open(dao.telegram, '_blank')}
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
                  onClick={() => dao.github && window.open(dao.github, '_blank')}
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
                  onClick={() => dao.website && window.open(dao.website, '_blank')}
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
  );
} 