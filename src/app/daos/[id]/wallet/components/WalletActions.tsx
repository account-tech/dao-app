import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpFromLine, QrCode, Gift, Clock, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

interface WalletOverviewProps {
  totalValue: string;
  onWithdraw?: () => void;
  onDeposit?: () => void;
  onAirdrop?: () => void;
  onVest?: () => void;
  hasAuthPower?: boolean;
  authVotingPower?: string;
  votingPower?: string;
}

export function WalletOverview({
  totalValue,
  onWithdraw,
  onDeposit,
  onAirdrop,
  onVest,
  hasAuthPower = true,
  authVotingPower = "0",
  votingPower = "0"
}: WalletOverviewProps) {
  const router = useRouter();
  const params = useParams();
  const daoId = params.id as string;

  const actions = [
    {
      label: "Withdraw",
      icon: ArrowUpFromLine,
      onClick: () => router.push(`/daos/${daoId}/wallet/requestWithdrawAndTransfer`),
      className: hasAuthPower 
        ? "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed",
      disabled: !hasAuthPower
    },
    {
      label: "Deposit",
      icon: QrCode,
      onClick: onDeposit,
      className: "bg-teal-100 hover:bg-teal-200 text-teal-700",
      disabled: false
    },
    {
      label: "Airdrop",
      icon: Gift,
      onClick: onAirdrop,
      className: "bg-white hover:bg-gray-50 text-gray-500 border border-gray-200",
      disabled: true,
      comingSoon: true
    },
    {
      label: "Vest",
      icon: Clock,
      onClick: onVest,
      className: "bg-white hover:bg-gray-50 text-gray-500 border border-gray-200",
      disabled: true,
      comingSoon: true
    }
  ];

  return (
    <Card className="bg-white shadow-md border border-gray-100">
      <CardContent className="p-6">
        {/* Total Value Display */}
        <div className="mb-6 text-center">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total wallet</h3>
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
                You need at least {authVotingPower} voting power to withdraw assets. Current: {votingPower}. Stake more tokens to withdraw.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
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