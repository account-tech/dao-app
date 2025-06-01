import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpFromLine, ArrowDownToLine, Clock, Send, ChevronDown, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VaultActionsProps {
  totalValue: string;
  vaultName: string;
  onWithdraw?: () => void;
  onDepositFromWallet?: () => void;
  onDepositFromDao?: () => void;
  onVest?: () => void;
  onAirdrop?: () => void;
  hasAuthPower?: boolean;
  authVotingPower?: string;
  votingPower?: string;
}

export function VaultActions({
  totalValue,
  vaultName,
  onWithdraw,
  onDepositFromWallet,
  onDepositFromDao,
  onVest,
  onAirdrop,
  hasAuthPower = true,
  authVotingPower = "0",
  votingPower = "0"
}: VaultActionsProps) {
  const actions = [
    {
      label: "Withdraw",
      icon: ArrowUpFromLine,
      onClick: onWithdraw,
      className: hasAuthPower 
        ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
      disabled: !hasAuthPower,
      comingSoon: false
    },
    {
      label: "Vest",
      icon: Clock,
      onClick: onVest,
      className: hasAuthPower 
        ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
      disabled: !hasAuthPower,
      comingSoon: false
    },
    {
      label: "Airdrop",
      icon: Send,
      onClick: onAirdrop,
      className: hasAuthPower 
        ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
      disabled: !hasAuthPower,
      comingSoon: false
    }
  ];

  return (
    <Card className="bg-white shadow-md border border-gray-100">
      <CardContent className="p-6">
        {/* Total Value Display */}
        <div className="mb-6 text-center">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total vault value</h3>
          <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            ${totalValue}
          </div>
        </div>

        {/* Voting Power Alert */}
        {!hasAuthPower && (
          <div className="mb-4">
            <Alert className="bg-yellow-50/50 border-yellow-100">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                You need at least {authVotingPower} voting power to manage vault assets. Current: {votingPower}. Stake more tokens to manage vaults.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Withdraw Button */}
          <Button
            onClick={actions[0].onClick}
            disabled={actions[0].disabled}
            className={`h-20 relative group ${actions[0].className} shadow-sm transition-all duration-200 ${!actions[0].disabled && 'hover:scale-[1.02]'} ${actions[0].disabled && 'cursor-not-allowed opacity-60'}`}
          >
            <div className="flex flex-col items-center gap-1.5">
              <ArrowUpFromLine className="w-12 h-12" />
              <span className="text-sm font-medium">Withdraw</span>
              {actions[0].comingSoon && (
                <span className="text-[10px] text-gray-500 absolute bottom-2">coming soon</span>
              )}
            </div>
          </Button>

          {/* Deposit Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                disabled={!hasAuthPower}
                className={`h-20 relative group shadow-sm transition-all duration-200 ${
                  hasAuthPower 
                    ? 'bg-teal-100 hover:bg-teal-200 text-teal-700 hover:scale-[1.02]' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <ArrowDownToLine className="w-12 h-12" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">Deposit</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            {hasAuthPower && (
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={onDepositFromWallet} className="cursor-pointer">
                  From your wallet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDepositFromDao} className="cursor-pointer">
                  From the DAO 
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          {/* Other Action Buttons */}
          {actions.slice(1).map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`h-20 relative group ${action.className} shadow-sm transition-all duration-200 ${!action.disabled && 'hover:scale-[1.02]'} ${action.disabled && 'cursor-not-allowed opacity-60'}`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Icon className="w-12 h-12" />
                  <span className="text-sm font-medium">{action.label}</span>
                  {action.comingSoon && (
                    <span className="text-[10px] text-gray-500 absolute bottom-2">coming soon</span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
