import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import { useDaoClient } from "@/hooks/useDaoClient"
import { useState, useEffect, useMemo } from "react"
import { Vault, ArrowRight, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface VaultData {
  id: string;
  name: string;
  totalValue?: string;
}

interface VaultSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  daoId: string
  onVaultSelected: (vaultId: string) => void
  title?: string
  description?: string
}

function VaultSelectionContent({ 
  daoId, 
  onVaultSelected, 
  className 
}: { 
  daoId: string; 
  onVaultSelected: (vaultId: string) => void;
  className?: string;
}) {
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultValues, setVaultValues] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const vaultsPerPage = 5;
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { getVaults, getVaultTotalValue } = useDaoClient();

  useEffect(() => {
    const fetchVaults = async () => {
      if (!currentAccount?.address || !daoId) {
        setLoading(false);
        return;
      }
      
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
          
          // Fetch total values for each vault
          const valuePromises = transformedVaults.map(async (vault) => {
            try {
              const value = await getVaultTotalValue(currentAccount.address, daoId, vault.id, suiClient);
              return { vaultId: vault.id, value };
            } catch (error) {
              console.error(`Error fetching value for vault ${vault.id}:`, error);
              return { vaultId: vault.id, value: "0.00" };
            }
          });
          
          const values = await Promise.all(valuePromises);
          const valueMap = new Map(values.map(v => [v.vaultId, v.value]));
          setVaultValues(valueMap);
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
  }, [currentAccount?.address, daoId]);

  // Filter and paginate vaults
  const { filteredVaults, totalPages, paginatedVaults } = useMemo(() => {
    const filtered = vaults.filter(vault =>
      vault.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const total = Math.ceil(filtered.length / vaultsPerPage);
    const startIndex = (currentPage - 1) * vaultsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + vaultsPerPage);
    
    return {
      filteredVaults: filtered,
      totalPages: total,
      paginatedVaults: paginated
    };
  }, [vaults, searchQuery, currentPage, vaultsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-10 w-full" />
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (vaults.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Vault className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No vaults found</p>
        <p className="text-sm text-gray-400 mt-1">Create a vault first to proceed</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search vaults..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-gray-500">
          {filteredVaults.length} {filteredVaults.length === 1 ? 'vault' : 'vaults'} found
        </p>
      )}

      {/* Vaults List */}
      {filteredVaults.length === 0 ? (
        <div className="text-center py-8">
          <Vault className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No vaults found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedVaults.map((vault) => {
            const totalValue = vaultValues.get(vault.id) || vault.totalValue || "0.00";
            
            return (
              <div
                key={vault.id}
                onClick={() => onVaultSelected(vault.id)}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                    <Vault className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" title={vault.name}>
                      {truncateText(vault.name, 25)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ${totalValue}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              
              // Show first page, last page, current page, and pages around current page
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={isCurrentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export function VaultSelectionDialog({ 
  open, 
  onOpenChange, 
  daoId, 
  onVaultSelected,
  title = "Select Vault",
  description = "Choose a vault to proceed with this action."
}: VaultSelectionDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handleVaultSelected = (vaultId: string) => {
    onVaultSelected(vaultId);
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-6 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {description}
            </DialogDescription>
          </DialogHeader>
          <VaultSelectionContent 
            daoId={daoId} 
            onVaultSelected={handleVaultSelected} 
            className="my-4" 
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-xl">{title}</DrawerTitle>
          <DrawerDescription className="text-gray-500">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto flex-1">
          <VaultSelectionContent 
            daoId={daoId} 
            onVaultSelected={handleVaultSelected} 
            className="px-6 pb-0" 
          />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button 
              variant="outline" 
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
} 