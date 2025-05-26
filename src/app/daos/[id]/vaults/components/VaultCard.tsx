import { useState } from "react";
import { useRouter } from "next/navigation";
import { Vault, TrendingUp, Calendar, MoreVertical } from "lucide-react";
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
  description?: string;
  totalValue?: string;
  assetCount?: number;
  createdAt?: string;
  status?: 'active' | 'inactive';
}

interface VaultCardProps {
  vault: VaultData;
  daoId: string;
  width?: string;
}

export function VaultCard({ vault, daoId, width = "265px" }: VaultCardProps) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

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
        {/* Top Section with Icon and Menu */}
        <div className="flex justify-between items-start">
          {/* Vault Icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Vault className="w-7 h-7 text-white" />
          </div>

          {/* Menu Button */}
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
              <DropdownMenuItem>Manage Assets</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vault Info - Fixed Height */}
        <div className="min-h-[75px] mt-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg" title={vault.name}>
              {truncateText(vault.name, 25)}
            </h3>
            <div className={`w-2 h-2 rounded-full ${
              vault.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          <p className="text-sm text-gray-600 line-clamp-2" title={vault.description}>
            {vault.description || "No description available"}
          </p>
        </div>

        {/* Value Display */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Value</span>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900 mt-1">
            ${vault.totalValue || '0.00'}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm font-medium">{vault.assetCount || 0}</div>
            <div className="text-sm text-gray-500">assets</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <div className="text-xs text-gray-500">
                {formatDate(vault.createdAt)}
              </div>
            </div>
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
