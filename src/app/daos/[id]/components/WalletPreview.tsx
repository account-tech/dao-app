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

interface TokenPrices {
  [key: string]: {
    price: number;
    priceChange24HoursPercentage: number;
  };
}

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

  useEffect(() => {
    const fetchOwnedObjects = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const data = await getOwnedObjects(currentAccount.address);
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
  }, [currentAccount?.address]);

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