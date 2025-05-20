import { Intent } from "@account.tech/core";
import { ReactNode } from "react";

interface IntentHandlerProps {
  intent: Intent;
  daoId: string;
  unverifiedDepsAllowed?: boolean;
}

interface HandlerResult {
  title: string;
  description: ReactNode;
}

export function handleToggleUnverifiedAllowed({ unverifiedDepsAllowed }: IntentHandlerProps): HandlerResult {
  return {
    title: "Toggle Unverified Dependencies",
    description: (
      <span>
        This proposal plans to{' '}
        <span className={unverifiedDepsAllowed ? 'text-red-600 font-medium' : 'text-teal-600 font-medium'}>
          {unverifiedDepsAllowed ? 'disable' : 'allow'}
        </span>
        {' '}unverified dependencies
      </span>
    ),
  };
}

// Add more handlers here as needed
export const intentHandlers: Record<string, (props: IntentHandlerProps) => HandlerResult> = {
  ToggleUnverifiedAllowed: handleToggleUnverifiedAllowed,
  // Add more mappings as we add more handlers
}; 