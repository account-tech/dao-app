import { IntentStatus } from "@account.tech/dao";
import { LucideIcon, Bolt, HelpCircle, ToggleLeft, ArrowUpRight, Vault, DollarSign, Package, Clock } from "lucide-react";

export interface IntentDisplay {
  title: string;
  icon: LucideIcon;
}

export type ProposalStatus = 'all' | IntentStatus['stage'] | 'deletable';

export interface ProposalFilter {
  label: string;
  value: ProposalStatus;
  count: number;
}

export const getIntentDisplay = (intentType: string): IntentDisplay => {
  const intentMap: Record<string, IntentDisplay> = {
    'ToggleUnverifiedAllowed': {
      title: 'Toggle Unverified',
      icon: ToggleLeft
    },
    'ConfigDao': {
      title: 'Config Dao',
      icon: Bolt
    },
    'WithdrawAndTransfer': {
      title: 'Withdraw and Transfer',
      icon: ArrowUpRight
    },
    'WithdrawAndTransferToVault': {
      title: 'Withdraw and Transfer to Vault',
      icon: Vault
    },
    'SpendAndTransfer': {
      title: 'Spend and Transfer',
      icon: DollarSign
    },
    'ConfigDeps': {
      title: 'Config Deps',
      icon: Package
    },
    'SpendAndVest': {
      title: 'Spend and Vest',
      icon: Clock
    }
  };

  return intentMap[intentType] || {
    title: 'Unknown',
    icon: HelpCircle
  };
}; 