'use client';

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useParams, useRouter } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault } from "lucide-react";
import { useDaoStore } from "@/store/useDaoStore";

interface VaultData {
  id: string;
  name: string;
  totalValue?: string;
}

const VaultPlaceholder = () => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex justify-center mb-4">
      <Skeleton className="h-12 w-12 rounded-lg" />
    </div>
    <div className="text-center space-y-2">
      <Skeleton className="h-4 w-16 mx-auto" />
      <Skeleton className="h-3 w-12 mx-auto" />
      <Skeleton className="h-4 w-14 mx-auto" />
    </div>
  </div>
);

export default function VaultsPreview() {
  const params = useParams();
  const router = useRouter();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getVaults } = useDaoClient();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshCounter = useDaoStore(state => state.refreshCounter);

  useEffect(() => {
    const fetchVaults = async () => {
      if (!currentAccount?.address) return;
      
      try {
        setLoading(true);
        const vaultsData = await getVaults(currentAccount.address, daoId);
        
        if (vaultsData && typeof vaultsData === 'object' && Object.keys(vaultsData).length > 0) {
          const transformedVaults: VaultData[] = Object.entries(vaultsData).map(([vaultName]) => ({
            id: vaultName,
            name: vaultName,
            totalValue: "0.00",
          }));
          setVaults(transformedVaults);
        } else {
          setVaults([]);
        }
      } catch (error) {
        console.error("Error fetching vaults:", error);
        setVaults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, [currentAccount?.address, daoId, refreshCounter]);

  const handleViewVaults = () => {
    router.push(`/daos/${daoId}/vaults`);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {vaults.slice(0, 2).map((vault) => (
          <div key={vault.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            {/* Vault Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Vault className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {/* Vault Info */}
            <div className="text-center">
              <div className="font-medium text-sm truncate mb-2" title={vault.name}>
                {vault.name}
              </div>
              <div className="text-xs text-gray-500 mb-1">Total Value</div>
              <div className="text-sm font-semibold text-gray-900">
                ${vault.totalValue || '0.00'}
              </div>
            </div>
          </div>
        ))}
        
        {vaults.length === 0 && (
          <div className="col-span-2 relative">
            <div className="opacity-30 grid grid-cols-2 gap-3">
              <VaultPlaceholder />
              <VaultPlaceholder />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white px-6 py-3 rounded-lg border border-gray-200/50 shadow-sm backdrop-blur-sm">
                <p className="text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No vaults yet</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        className="w-full bg-white hover:bg-gray-50 border-gray-200 cursor-pointer"
        onClick={handleViewVaults}
      >
        View Vaults
      </Button>
    </div>
  );
}
