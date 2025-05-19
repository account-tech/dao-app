import { IntentStatus } from "@account.tech/dao";
import { LucideIcon, Bolt, HelpCircle, Banknote, ArrowUpRight, Clock3, Package, ToggleLeft, Shield, HardDriveDownload, ChevronsUp } from "lucide-react";

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
    'ConfigMultisig': {
      title: 'Config Multisig',
      icon: Bolt
    },
    'SpendAndTransfer': {
      title: 'Spend and Transfer',
      icon: Banknote
    },
    'SpendAndVest': {
      title: 'Spend and Vest',
      icon: Clock3
    },
    'WithdrawAndTransferToVault': {
      title: 'Withdraw and Transfer to Vault',
      icon: ArrowUpRight
    },
    'ConfigDeps': {
      title: 'Config Dependencies',
      icon: Package
    },
    'WithdrawAndVest': {
      title: 'Withdraw and Vest',
      icon: Clock3
    },
    'WithdrawAndTransfer': {
      title: 'Withdraw and Transfer',
      icon: Banknote
    },
    'RestrictPolicy': {
      title: 'Restrict Policy',
      icon: Shield
    },
    'BorrowCap': {
      title: 'Borrow Cap',
      icon: HardDriveDownload
    },
    'UpgradePackage': {
      title: 'Upgrade Package',
      icon: ChevronsUp
    }
  };

  return intentMap[intentType] || {
    title: 'Unknown',
    icon: HelpCircle
  };
}; 