'use client';

import { useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { OwnedData } from "@account.tech/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getMultipleCoinDecimals, formatCoinAmount } from "@/utils/GlobalHelpers";
import { getTokenPrices } from "@/utils/Aftermath";
import { useDaoStore } from "@/store/useDaoStore";

interface TokenPrices {
  [key: string]: {
    price: number;
    priceChange24HoursPercentage: number;
  };
}

const CoinPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
    <div className="space-y-1.5">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
      <div className="h-3 w-20 bg-gray-200 rounded"></div>
    </div>
    <div className="text-right space-y-1.5">
      <div className="h-3 w-12 bg-gray-200 rounded"></div>
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const NFTPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="aspect-square w-full bg-gray-200 rounded-lg mb-2"></div>
    <div className="space-y-1.5">
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ObjectPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="space-y-1.5">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
      <div className="h-3 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function WalletPreview() {
  const params = useParams();
  const router = useRouter();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getOwnedObjects } = useDaoClient();
  const [ownedData, setOwnedData] = useState<OwnedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coinDecimals, setCoinDecimals] = useState<Map<string, number>>(new Map());
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});
  const suiClient = useSuiClient();
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  useEffect(() => {
    const fetchOwnedObjects = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const data = await getOwnedObjects(currentAccount.address, daoId);
        setOwnedData(data);

        if (data.coins && data.coins.length > 0) {
          // Fetch both decimals and prices
          const [decimals, prices] = await Promise.all([
            getMultipleCoinDecimals(
              data.coins.map(coin => coin.type),
              suiClient
            ),
            getTokenPrices(data.coins.map(coin => coin.type))
          ]);

          setCoinDecimals(decimals);
          if (prices) {
            setTokenPrices(prices);
          }
        }
      } catch (error) {
        console.error("Error fetching owned objects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedObjects();
  }, [currentAccount?.address, daoId, refreshCounter]);

  const handleViewWallet = () => {
    router.push(`/daos/${daoId}/wallet`);
  };

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
    <div className="space-y-4">
      <Tabs defaultValue="coins" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="coins"
            className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700"
          >
            Coins ({ownedData.coins?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="nfts"
            className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700"
          >
            NFTs ({ownedData.nfts?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="objects"
            className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700"
          >
            Objects ({ownedData.objects?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coins" className="mt-4">
          <div className="space-y-3">
            {ownedData.coins?.map((coin, index) => {
              const decimals = coinDecimals.get(coin.type) || 9; // Default to 9 if not found
              const formattedAmount = formatCoinAmount(coin.totalAmount || BigInt(0), decimals, 4);
              const symbol = coin.type.split("::").pop() || "Unknown";
              const price = tokenPrices[coin.type]?.price;
              const displayPrice = price === -1 ? 0 : price || 0;
              
              // Calculate total value
              const numericAmount = parseFloat(formattedAmount);
              const totalValue = numericAmount * displayPrice;

              return (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{symbol}</div>
                    <div className="text-sm text-gray-500 font-mono">
                      {formattedAmount}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    $ {totalValue.toFixed(2)}
                  </div>
                </div>
              );
            })}
            {!ownedData.coins?.length && (
              <div className="relative">
                <div className="opacity-30 space-y-3">
                  <CoinPlaceholder />
                  <CoinPlaceholder />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white px-6 py-3 rounded-lg border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <p className="text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No coins yet</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {ownedData.nfts?.slice(0, 2).map((nft, index) => (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden border border-gray-200 hover:border-teal-300 transition-all hover:shadow-md"
              >
                <img
                  src={nft.image}
                  alt={nft.name || "NFT"}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                  <p className="text-white text-xs truncate">
                    {nft.name || nft.type.split('::').pop() || "Unknown NFT"}
                  </p>
                </div>
              </div>
            ))}
            {!ownedData.nfts?.length && (
              <div className="col-span-2 relative">
                <div className="opacity-30 grid grid-cols-2 gap-3">
                  <NFTPlaceholder />
                  <NFTPlaceholder />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white px-6 py-3 rounded-lg border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <p className="text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No NFTs yet</p>
                  </div>
                </div>
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
              <div className="relative">
                <div className="opacity-30 space-y-3">
                  <ObjectPlaceholder />
                  <ObjectPlaceholder />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white px-6 py-3 rounded-lg border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <p className="text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No objects yet</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <Button 
        variant="outline" 
        className="w-full bg-white hover:bg-gray-50 border-gray-200 cursor-pointer"
        onClick={handleViewWallet}
      >
        View Wallet
      </Button>
    </div>
  );
} 