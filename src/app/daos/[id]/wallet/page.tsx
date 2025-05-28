'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { OwnedData } from "@account.tech/core";
import { getMultipleCoinDecimals, formatCoinAmount } from "@/utils/GlobalHelpers";
import { getTokenPrices } from "@/utils/Aftermath";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletOverview } from "./components/WalletActions";
import { WalletAssets } from "./components/WalletAssets";
import { QrCode } from "./components/QrCode";


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
  const { getOwnedObjects, getDaoVotingPowerInfo } = useDaoClient();
  const [ownedData, setOwnedData] = useState<OwnedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coinDecimals, setCoinDecimals] = useState<Map<string, number>>(new Map());
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});
  const [hasAuthPower, setHasAuthPower] = useState(false);
  const [authVotingPower, setAuthVotingPower] = useState("0");
  const [votingPower, setVotingPower] = useState("0");
  const suiClient = useSuiClient();
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  useEffect(() => {
    const fetchOwnedObjects = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        
        // Fetch both owned objects and voting power info
        const [data, votingInfo] = await Promise.all([
          getOwnedObjects(currentAccount.address, daoId),
          getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient)
        ]);
        
        setOwnedData(data);
        setHasAuthPower(votingInfo.hasAuthPower);
        setAuthVotingPower(votingInfo.authVotingPower);
        setVotingPower(votingInfo.votingPower);

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
        console.error("Error fetching data:", error);
        setHasAuthPower(false);
        setAuthVotingPower("0");
        setVotingPower("0");
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
        {/* Loading state that matches the actual layout */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
          {/* Left Column (Assets) Skeleton */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="w-full">
              {/* Tabs skeleton */}
              <div className="grid w-full grid-cols-3 mb-6">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md mx-1" />
                <Skeleton className="h-10 rounded-md" />
              </div>
              
              {/* Assets content skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Right Column (WalletOverview) Skeleton */}
          <div className="w-full lg:w-[350px] xl:w-[400px] order-1 lg:order-2">
            <div className="bg-white rounded-lg border p-6 space-y-6">
              {/* Total value skeleton */}
              <div className="text-center space-y-2">
                <Skeleton className="h-6 w-24 mx-auto" />
                <Skeleton className="h-8 w-32 mx-auto" />
              </div>
              
              {/* Action buttons skeleton */}
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calculateTotalValue = () => {
    return ownedData?.coins?.reduce((total, coin) => {
      const decimals = coinDecimals.get(coin.type) || 9;
      const formattedAmount = formatCoinAmount(coin.totalAmount || BigInt(0), decimals, 4);
      const price = tokenPrices[coin.type]?.price;
      const displayPrice = price === -1 ? 0 : price || 0;
      const numericAmount = parseFloat(formattedAmount);
      return total + (numericAmount * displayPrice);
    }, 0).toFixed(2) || "0.00";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Content Layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
        {/* Left Column (Assets) */}
        <div className="flex-1 order-2 lg:order-1">
          <WalletAssets
            ownedData={ownedData}
            coinDecimals={coinDecimals}
            tokenPrices={tokenPrices}
          />
        </div>

        {/* Right Column (WalletOverview) */}
        <div className="w-full lg:w-[350px] xl:w-[400px] order-1 lg:order-2">
          <WalletOverview
            totalValue={calculateTotalValue()}
            onWithdraw={() => console.log("Withdraw clicked")}
            onDeposit={() => setQrCodeOpen(true)}
            onAirdrop={() => console.log("Airdrop clicked")}
            onVest={() => console.log("Vest clicked")}
            hasAuthPower={hasAuthPower}
            authVotingPower={authVotingPower}
            votingPower={votingPower}
          />
        </div>
      </div>

      {currentAccount?.address && (
        <QrCode
          open={qrCodeOpen}
          onOpenChange={setQrCodeOpen}
          accountId={daoId}
        />
      )}
    </div>
  );
}
