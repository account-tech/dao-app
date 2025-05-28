import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { Vault, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VaultData {
  id: string;
  name: string;
  totalValue?: string;
}

interface VaultCardProps {
  vault: VaultData;
  daoId: string;
  width?: string;
}

export function VaultCard({ vault, daoId, width = "265px" }: VaultCardProps) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { getVaultTotalValue } = useDaoClient();
  const [isHovering, setIsHovering] = useState(false);
  const [totalValue, setTotalValue] = useState<string>(vault.totalValue || "0.00");

  useEffect(() => {
    const fetchTotalValue = async () => {
      if (!currentAccount?.address) return;
      
      try {
        const calculatedValue = await getVaultTotalValue(currentAccount.address, daoId, vault.id, suiClient);
        setTotalValue(calculatedValue);
      } catch (error) {
        console.error("Error fetching vault total value:", error);
      }
    };

    fetchTotalValue();
  }, [currentAccount?.address, daoId, vault.id]);

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  const handleClick = () => {
    router.push(`/daos/${daoId}/vaults/${vault.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="group relative bg-white rounded-t-2xl rounded-br-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
      style={{ width }}
    >
      <div className="p-6">
        {/* Top Section with Centered Icon and Menu */}
        <div className="flex justify-between items-start">
          <div className="flex-1" />
          
          {/* Centered Vault Icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Vault className="w-7 h-7 text-white" />
          </div>

          {/* Menu Button */}
          <div className="flex-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Delete Vault</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Vault Name - Centered */}
        <div className="mt-5 text-center">
          <h3 className="font-semibold text-lg" title={vault.name}>
            {truncateText(vault.name, 25)}
          </h3>
        </div>

        {/* Value Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-sm text-gray-500 mb-1">Total Value</div>
          <div className="text-lg font-semibold text-gray-900">
            ${totalValue}
          </div>
        </div>
      </div>

              

      {/* Teal Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-transparent"></div>
      
      {/* Hover Effect Overlay */}
      <div className={`absolute inset-0 bg-teal-50 rounded-t-2xl rounded-br-2xl transition-opacity duration-300 pointer-events-none ${
        isHovering ? 'opacity-5' : 'opacity-0'
      }`} />
    </div>
  );
}
