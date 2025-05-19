import { IntentStatus } from "@account.tech/dao";
import { LucideIcon, Bolt, HelpCircle, ToggleLeft } from "lucide-react";

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
  };

  return intentMap[intentType] || {
    title: 'Unknown',
    icon: HelpCircle
  };
}; 