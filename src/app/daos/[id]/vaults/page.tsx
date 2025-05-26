'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useMediaQuery } from "react-responsive";
import { useDaoClient } from "@/hooks/useDaoClient";
import { VaultCard } from "./components/VaultCard";
import { VaultCreationDialog } from "./components/VaultCreationDialog";
import { Button } from "@/components/ui/button";
import { Search, Plus, Vault } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDaoStore } from "@/store/useDaoStore";

interface VaultData {
  id: string;
  name: string;
  totalValue?: string;
}

function VaultCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border w-full sm:w-[48%] md:w-[265px] h-80 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="p-3 bg-gray-50 rounded-lg space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="pt-4 border-t space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-6 mx-auto" />
            <Skeleton className="h-3 w-12 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Search Skeleton */}
      <Skeleton className="h-10 w-full md:w-96" />
      
      {/* Results Count Skeleton */}
      <Skeleton className="h-4 w-24" />
      
      {/* Cards Grid Skeleton */}
      <div className="flex flex-wrap gap-4">
        {Array(6).fill(0).map((_, i) => (
          <VaultCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function VaultsPage() {
  const params = useParams();
  const daoId = params.id as string;
  const currentAccount = useCurrentAccount();
  const { getVaults } = useDaoClient();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 768 });

  const getCardWidth = () => {
    if (isMobile) return "100%";
    if (isTablet) return "49%";
    return "265px";
  };

  useEffect(() => {
    let mounted = true;

    const fetchVaults = async () => {
      if (!currentAccount?.address || !daoId) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        if (mounted) setLoading(true);
        const vaultsData = await getVaults(currentAccount.address, daoId);
        
        if (mounted) {
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
        }
      } catch (error) {
        console.error("Error fetching vaults:", error);
        if (mounted) setVaults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVaults();

    return () => { mounted = false; };
  }, [currentAccount?.address, daoId, refreshCounter]);

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen pt-44">
        <Vault className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-gray-600">Connect your wallet to view vaults</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  const filteredVaults = vaults.filter(vault =>
    vault.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateVault = () => setShowCreateDialog(true);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Treasury Vaults</h1>
            <p className="text-gray-600">Manage and monitor your DAO's vaults</p>
          </div>
          <Button onClick={handleCreateVault} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Vault
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96 mb-8">
          <input
            type="text"
            placeholder="Search vaults..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={vaults.length === 0}
            className={`w-full pl-10 pr-4 py-3 md:py-2 border rounded-lg ${
              vaults.length === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'focus:ring-2 focus:ring-teal-500 focus:border-transparent'
            }`}
          />
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
            vaults.length === 0 ? 'text-gray-300' : 'text-gray-400'
          }`} />
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-6">
          {filteredVaults.length} {filteredVaults.length === 1 ? 'vault' : 'vaults'}
        </p>

        {/* Vaults Grid */}
        <div className="flex flex-wrap gap-4">
          {filteredVaults.map((vault) => (
            <VaultCard key={vault.id} vault={vault} daoId={daoId} width={getCardWidth()} />
          ))}
        </div>

        {/* Empty State */}
        {filteredVaults.length === 0 && !loading && (
          <div className="relative">
            <div className="opacity-30 flex flex-wrap gap-4">
              {Array(6).fill(0).map((_, i) => (
                <VaultCardSkeleton key={i} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-start justify-center pt-24">
              <div className="text-center bg-white px-8 py-5 rounded-xl border border-gray-200/50 shadow-sm backdrop-blur-sm">
                {searchQuery ? (
                  <>
                    <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No vaults found</p>
                    <p className="text-sm text-gray-600 mt-2">Try adjusting your search terms</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">No vaults yet</p>
                    <p className="text-sm text-gray-600 mt-2">Create your first vault to start managing DAO assets</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vault Creation Dialog */}
      <VaultCreationDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
