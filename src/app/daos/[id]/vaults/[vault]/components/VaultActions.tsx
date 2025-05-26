import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpFromLine, ArrowDownToLine, Settings, TrendingUp } from "lucide-react";

interface VaultActionsProps {
  totalValue: string;
  vaultName: string;
  onWithdraw?: () => void;
  onDeposit?: () => void;
  onManage?: () => void;
  onAnalytics?: () => void;
}

export function VaultActions({
  totalValue,
  vaultName,
  onWithdraw,
  onDeposit,
  onManage,
  onAnalytics
}: VaultActionsProps) {
  const actions = [
    {
      label: "Withdraw",
      icon: ArrowUpFromLine,
      onClick: onWithdraw,
      className: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
      disabled: true,
      comingSoon: true
    },
    {
      label: "Deposit",
      icon: ArrowDownToLine,
      onClick: onDeposit,
      className: "bg-teal-100 hover:bg-teal-200 text-teal-700",
      disabled: true,
      comingSoon: true
    },
    {
      label: "Manage",
      icon: Settings,
      onClick: onManage,
      className: "bg-white hover:bg-gray-50 text-gray-500 border border-gray-200",
      disabled: true,
      comingSoon: true
    },
    {
      label: "Analytics",
      icon: TrendingUp,
      onClick: onAnalytics,
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
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total vault value</h3>
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
