'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { VaultActions } from "./components/VaultActions";
import { VaultAssets } from "./components/VaultAssets";
import { DepositFromWalletDialog } from "./components/DepositFromWalletDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault } from "lucide-react";
import { useDaoStore } from "@/store/useDaoStore";

interface VaultData {
  coins: Record<string, bigint>;
}

export default function VaultPage() {
  const params = useParams();
  const daoId = params.id as string;
  const vaultName = params.vault as string;
  const currentAccount = useCurrentAccount();
  const { getVault } = useDaoClient();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  useEffect(() => {
    const fetchVaultData = async () => {
      if (!currentAccount?.address) return;

      try {
        setLoading(true);
        const data = await getVault(currentAccount.address, daoId, vaultName);
        setVaultData(data);
      } catch (error) {
        console.error("Error fetching vault data:", error);
        setVaultData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [currentAccount?.address, daoId, vaultName, refreshCounter]);

  const handleDepositFromWallet = () => {
    setDepositDialogOpen(true);
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
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          {/* Actions Skeleton */}
          <Skeleton className="h-48 w-full" />
          
          {/* Assets Skeleton */}
          <Skeleton className="h-96 w-full" />
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

  // Calculate total value (simplified for now)
  const totalValue = "0.00"; // TODO: Calculate from coins when price data is available

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Content Layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 xl:gap-8">
        {/* Left Column (Assets) */}
        <div className="flex-1 order-2 lg:order-1">
          <VaultAssets vaultData={vaultData} />
        </div>

        {/* Right Column (VaultActions) */}
        <div className="w-full lg:w-[350px] xl:w-[400px] order-1 lg:order-2">
          <VaultActions 
            totalValue={totalValue} 
            vaultName={vaultName}
            onDepositFromWallet={handleDepositFromWallet}
            onDepositFromDao={() => console.log("Deposit from DAO clicked")}
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
