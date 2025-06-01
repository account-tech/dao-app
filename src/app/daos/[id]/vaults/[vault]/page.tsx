'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { VaultActions } from "./components/VaultActions";
import { VaultAssets } from "./components/VaultAssets";
import { DepositFromWalletDialog } from "./components/DepositFromWalletDialog";
import { getTokenPrices } from "@/utils/Aftermath";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault } from "lucide-react";
import { useDaoStore } from "@/store/useDaoStore";

interface VaultData {
  coins: Record<string, bigint>;
  formattedCoins?: Record<string, { 
    balance: bigint; 
    formattedBalance: string; 
    symbol: string; 
    decimals: number 
  }>;
}

export default function VaultPage() {
  const params = useParams();
  const router = useRouter();
  const daoId = params.id as string;
  const vaultName = params.vault as string;
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { getVault, getVaultTotalValue, getDaoVotingPowerInfo } = useDaoClient();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [totalValue, setTotalValue] = useState<string>("0.00");
  const [tokenPrices, setTokenPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [hasAuthPower, setHasAuthPower] = useState(false);
  const [authVotingPower, setAuthVotingPower] = useState("0");
  const [votingPower, setVotingPower] = useState("0");
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  useEffect(() => {
    const fetchVaultData = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        
        // Fetch vault data, total value, and voting power info in parallel
        const [data, calculatedTotalValue, votingInfo] = await Promise.all([
          getVault(currentAccount.address, daoId, vaultName, suiClient),
          getVaultTotalValue(currentAccount.address, daoId, vaultName, suiClient),
          getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient)
        ]);
        
        setVaultData(data);
        setTotalValue(calculatedTotalValue);
        setHasAuthPower(votingInfo.hasAuthPower);
        setAuthVotingPower(votingInfo.authVotingPower);
        setVotingPower(votingInfo.votingPower);

        // Fetch token prices for VaultAssets component
        if (data && 'formattedCoins' in data && data.formattedCoins) {
          const coinTypes = Object.keys(data.formattedCoins).map(coinType => {
            return coinType.startsWith('0x') ? coinType : `0x${coinType}`;
          });
          
          if (coinTypes.length > 0) {
            const prices = await getTokenPrices(coinTypes);
            setTokenPrices(prices);
          }
        }
      } catch (error) {
        console.error("Error fetching vault data:", error);
        setVaultData(null);
        setTotalValue("0.00");
        setHasAuthPower(false);
        setAuthVotingPower("0");
        setVotingPower("0");
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [currentAccount?.address, daoId, vaultName, refreshCounter]);

  const handleDepositFromWallet = () => {
    setDepositDialogOpen(true);
  };

  const handleDepositFromDao = () => {
    router.push(`/daos/${daoId}/vaults/${vaultName}/requestWithdrawAndTransferToVault`);
  };

  const handleWithdraw = () => {
    router.push(`/daos/${daoId}/vaults/${vaultName}/requestSpendAndTransfer`);
  };

  const handleVest = () => {
    router.push(`/daos/${daoId}/vaults/${vaultName}/requestSpendAndVest`);
  };

  const handleAirdrop = () => {
    router.push(`/daos/${daoId}/vaults/${vaultName}/requestSpendAndAirdrop`);
  };

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen pt-44">
        <Vault className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-gray-600">Connect your wallet to view this vault</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Main Content Layout Skeleton */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
          {/* Left Column (Assets) Skeleton */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="space-y-4">
              {/* Assets List Skeleton */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Actions) Skeleton */}
          <div className="w-full lg:w-[350px] xl:w-[400px] order-1 lg:order-2">
            <div className="bg-white shadow-md border border-gray-100 rounded-lg">
              <div className="p-6">
                {/* Total Value Skeleton */}
                <div className="mb-6 text-center">
                  <Skeleton className="h-4 w-24 mx-auto mb-2" />
                  <Skeleton className="h-8 w-32 mx-auto" />
                </div>

                {/* Action Buttons Grid Skeleton */}
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vaultData) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen pt-44">
        <Vault className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Vault Not Found</h1>
        <p className="text-gray-600">The vault "{vaultName}" doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Content Layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
        {/* Left Column (Assets) */}
        <div className="flex-1 order-2 lg:order-1">
          <VaultAssets vaultData={vaultData} tokenPrices={tokenPrices} />
        </div>

        {/* Right Column (VaultActions) */}
        <div className="w-full lg:w-[350px] xl:w-[400px] order-1 lg:order-2">
          <VaultActions 
            totalValue={totalValue} 
            vaultName={vaultName}
            onDepositFromWallet={handleDepositFromWallet}
            onDepositFromDao={handleDepositFromDao}
            onWithdraw={handleWithdraw}
            onVest={handleVest}
            onAirdrop={handleAirdrop}
            hasAuthPower={hasAuthPower}
            authVotingPower={authVotingPower}
            votingPower={votingPower}
          />
        </div>
      </div>

      {/* Deposit Dialog */}
      <DepositFromWalletDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        vaultName={vaultName}
      />
    </div>
  );
}
