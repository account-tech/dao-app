'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { OwnedData } from "@account.tech/core";
import { getMultipleCoinDecimals, formatCoinAmount } from "@/utils/GlobalHelpers";
import { getTokenPrices } from "@/utils/Aftermath";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletOverview } from "./components/WalletOverview";

interface TokenPrices {
  [key: string]: {
    price: number;
    priceChange24HoursPercentage: number;
  };
}

export default function WalletPage() {
  const params = useParams();
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
        const data = await getOwnedObjects(currentAccount.address, daoId);
        setOwnedData(data);

        if (data.coins && data.coins.length > 0) {
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

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600">Please connect your wallet to view this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row md:gap-6 lg:gap-8">
        {/* Left Column (Coins & NFTs) */}
        <div className="flex-1 order-2 md:order-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Coins Section */}
            <div className="col-span-full lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Coins</h2>
              <div className="space-y-4">
                {ownedData?.coins?.map((coin, index) => {
                  const decimals = coinDecimals.get(coin.type) || 9;
                  const formattedAmount = formatCoinAmount(coin.totalAmount || BigInt(0), decimals, 4);
                  const symbol = coin.type.split("::").pop() || "Unknown";
                  const price = tokenPrices[coin.type]?.price;
                  const displayPrice = price === -1 ? 0 : price || 0;
                  const numericAmount = parseFloat(formattedAmount);
                  const totalValue = numericAmount * displayPrice;

                  return (
                    <div key={index} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{symbol}</div>
                        <div className="text-sm text-gray-500">{formattedAmount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">$ {displayPrice.toFixed(4)}</div>
                        <div className="font-medium">$ {totalValue.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
                {!ownedData?.coins?.length && (
                  <div className="text-center text-gray-500 py-8">No coins found</div>
                )}
              </div>
            </div>

            {/* NFTs Section */}
            <div className="col-span-full lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">NFTs</h2>
              <div className="space-y-4">
                {ownedData?.nfts?.map((nft, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-4">
                    <div className="font-medium truncate">{nft.name}</div>
                    <div className="text-sm text-gray-500 truncate">{nft.type.split("::").pop()}</div>
                  </div>
                ))}
                {!ownedData?.nfts?.length && (
                  <div className="text-center text-gray-500 py-8">No NFTs found</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (WalletOverview) */}
        <div className="w-full md:w-[350px] lg:w-[400px] order-1 md:order-2">
          <WalletOverview
            totalValue={
              ownedData?.coins?.reduce((total, coin) => {
                const decimals = coinDecimals.get(coin.type) || 9;
                const formattedAmount = formatCoinAmount(coin.totalAmount || BigInt(0), decimals, 4);
                const price = tokenPrices[coin.type]?.price;
                const displayPrice = price === -1 ? 0 : price || 0;
                const numericAmount = parseFloat(formattedAmount);
                return total + (numericAmount * displayPrice);
              }, 0).toFixed(2) || "0.00"
            }
            onWithdraw={() => console.log("Withdraw clicked")}
            onDeposit={() => console.log("Deposit clicked")}
            onAirdrop={() => console.log("Airdrop clicked")}
            onVest={() => console.log("Vest clicked")}
          />
        </div>
      </div>
    </div>
  );
}
