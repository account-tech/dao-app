'use client';

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { OwnedData } from "@account.tech/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function WalletPreview() {
  const currentAccount = useCurrentAccount();
  const { getOwnedObjects } = useDaoClient();
  const [ownedData, setOwnedData] = useState<OwnedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnedObjects = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const data = await getOwnedObjects(currentAccount.address);
        setOwnedData(data);
      } catch (error) {
        console.error("Error fetching owned objects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedObjects();
  }, [currentAccount?.address]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!ownedData) {
    return (
      <div className="text-gray-500 text-center py-4">
        No wallet data available
      </div>
    );
  }

  return (
    <Tabs defaultValue="coins" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="coins">
          Coins ({ownedData.coins?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="nfts">
          NFTs ({ownedData.nfts?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="objects">
          Objects ({ownedData.objects?.length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="coins" className="mt-4">
        <div className="space-y-3">
          {ownedData.coins?.map((coin, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{coin.type.split("::").pop()}</div>
              <div className="text-sm text-gray-500">
                Amount: {coin.totalAmount?.toString() || "0"}
              </div>
              <div className="text-xs text-gray-400">
                Instances: {coin.instances?.length || 0}
              </div>
            </div>
          ))}
          {!ownedData.coins?.length && (
            <div className="text-center text-gray-500 py-4">No coins found</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="nfts" className="mt-4">
        <div className="grid grid-cols-2 gap-3">
          {ownedData.nfts?.map((nft, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              {nft.image && (
                <div className="relative w-full aspect-square mb-2 rounded-md overflow-hidden">
                  <Image
                    src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt={nft.name || 'NFT'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="font-medium truncate">{nft.name}</div>
              <div className="text-xs text-gray-400 truncate">
                {nft.type.split("::").pop()}
              </div>
            </div>
          ))}
          {!ownedData.nfts?.length && (
            <div className="col-span-2 text-center text-gray-500 py-4">
              No NFTs found
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="objects" className="mt-4">
        <div className="space-y-3">
          {ownedData.objects?.map((obj, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {obj.type.split("::").pop()}
              </div>
              <div className="text-xs text-gray-400 break-all">
                ID: {obj.ref.objectId}
              </div>
            </div>
          ))}
          {!ownedData.objects?.length && (
            <div className="text-center text-gray-500 py-4">
              No objects found
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
} 