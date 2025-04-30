import { DaoMetadata } from "@account.tech/dao";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useState } from "react";
import { toast } from "sonner";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { useDaoStore } from "@/store/useDaoStore";

interface DaoCardProps {
  dao: DaoMetadata;
  isFollowed?: boolean;
  width?: string;
}

export function DaoCard({ dao, isFollowed = false, width = "265px" }: DaoCardProps) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { followDao, unfollowDao } = useDaoClient();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const triggerRefresh = useDaoStore(state => state.triggerRefresh);
  const resetClient = useDaoStore(state => state.resetClient);

  // Helper function to validate image URL
  const isValidImageUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const handleClick = async () => {
    router.push(`/daos/${dao.id}`);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    const baseStyles = 'px-4 py-1.5 text-sm font-medium rounded-full border transition-all duration-300 ease-in-out';
    
    if (isLoading) {
      return `${baseStyles} border-gray-200 bg-gray-50 cursor-wait min-w-[120px]`;
    }
    if (isFollowed) {
      return isHovering
        ? `${baseStyles} border-red-200 text-red-500 bg-red-50 hover:bg-red-100`
        : `${baseStyles} border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100`;
    }
    return `${baseStyles} border-blue-500 text-blue-500 hover:bg-blue-50`;
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          <span className="text-gray-500">
            {isFollowed ? 'Unfollowing...' : 'Following...'}
          </span>
        </div>
      );
    }
    if (isFollowed) return isHovering ? 'Unfollow' : 'Followed';
    return 'Follow';
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-white rounded-t-2xl rounded-br-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      style={{ width }}
    >
      <div className="p-6">
        {/* Top Section with Image and Follow Button */}
        <div className="flex justify-between items-start">
          {/* Large Square Image */}
          <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
            {isValidImageUrl(dao.image) ? (
              <Image
                src={dao.image}
                alt={dao.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-400">
                {dao.name?.charAt(0)?.toUpperCase() || 'D'}
              </span>
            )}
          </div>

          {/* Follow Button */}
          <button 
            onClick={handleFollowClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            disabled={isLoading}
            className={getButtonStyles()}
          >
            <div className="flex items-center justify-center min-w-[60px]">
              {getButtonText()}
            </div>
          </button>
        </div>

        {/* DAO Info - Fixed Height */}
        <div className="min-h-[75px] mt-5">
          <h3 className="font-semibold text-lg" title={dao.name}>
            {truncateText(dao.name, 30)}
          </h3>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2" title={dao.description}>
            {dao.description || "No description available"}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium">0</div>
            <div className="text-sm text-gray-500">followers</div>
          </div>
          <div>
            <div className="text-sm font-medium">0</div>
            <div className="text-sm text-gray-500">proposals</div>
          </div>
          <div>
            <div className="text-sm font-medium">0</div>
            <div className="text-sm text-gray-500">votes</div>
          </div>
        </div>
      </div>

      {/* Pink Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-200 to-transparent"></div>
    </div>
  );
} 