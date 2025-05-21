import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Clock } from "lucide-react";

interface WalletOverviewProps {
  totalValue: string;
  onWithdraw?: () => void;
  onDeposit?: () => void;
  onAirdrop?: () => void;
  onVest?: () => void;
}

export function WalletOverview({
  totalValue,
  onWithdraw,
  onDeposit,
  onAirdrop,
  onVest
}: WalletOverviewProps) {
  const actions = [
    {
      label: "Withdraw",
      icon: ArrowUpFromLine,
      onClick: onWithdraw,
      className: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
    },
    {
      label: "Deposit",
      icon: ArrowDownToLine,
      onClick: onDeposit,
      className: "bg-teal-500 hover:bg-teal-600 text-white"
    },
    {
      label: "Airdrop",
      icon: Gift,
      onClick: onAirdrop,
      className: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
    },
    {
      label: "Vest",
      icon: Clock,
      onClick: onVest,
      className: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
    }
  ];

  return (
    <Card className="bg-white shadow-md border border-gray-100">
      <CardContent className="p-6">
        {/* Total Value Display */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total wallet</h3>
          <div className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            ${totalValue}
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                className={`h-20 relative group ${action.className} shadow-sm transition-all duration-200 hover:scale-[1.02]`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 