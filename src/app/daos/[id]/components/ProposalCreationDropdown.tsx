import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useEffect, useState, useRef } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { ArrowUpRight, Bolt, ToggleLeft } from "lucide-react";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

function TruncatedText({ text, className = "" }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(
          textRef.current.scrollWidth > textRef.current.clientWidth
        );
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text]);

  if (!isTruncated) {
    return (
      <span ref={textRef} className={`truncate ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span ref={textRef} className={`truncate ${className}`}>
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-800 text-white">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ProposalCreationDropdownProps {
  daoId: string;
}

export function ProposalCreationDropdown({ daoId }: ProposalCreationDropdownProps) {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { getDaoVotingPowerInfo } = useDaoClient();
  const [hasAuthPower, setHasAuthPower] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authVotingPower, setAuthVotingPower] = useState("0");
  const [votingPower, setVotingPower] = useState("0");

  useEffect(() => {
    const checkVotingPower = async () => {
      if (!currentAccount?.address) return;
      
      try {
        setIsLoading(true);
        const votingInfo = await getDaoVotingPowerInfo(currentAccount.address, daoId, suiClient);
        setHasAuthPower(votingInfo.hasAuthPower);
        setAuthVotingPower(votingInfo.authVotingPower);
        setVotingPower(votingInfo.votingPower);
      } catch (error) {
        console.error("Error checking voting power:", error);
        setHasAuthPower(false);
        setAuthVotingPower("0");
        setVotingPower("0");
      } finally {
        setIsLoading(false);
      }
    };

    checkVotingPower();
  }, [currentAccount?.address, daoId]);

  const proposalOptions = [
    {
      label: "Configure DAO",
      path: `/daos/${daoId}/settings/requestConfigDao`,
      icon: Bolt,
    },
    {
      label: "Toggle Unverified Dependencies",
      path: `/daos/${daoId}/settings/requestToggleUnverifiedDeps`,
      icon: ToggleLeft,
    },
    {
      label: "Withdraw and Transfer",
      path: `/daos/${daoId}/wallet/requestWithdrawAndTransfer`,
      icon: ArrowUpRight,
    },
  ];

    if (!hasAuthPower && !isLoading) {
    // Show disabled button with tooltip when user doesn't have enough voting power
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-gray-300 text-gray-500 cursor-not-allowed">
              + New Proposal
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white">
            <p>You need at least {authVotingPower} voting power to create proposals. Current: {votingPower}. Stake more tokens to create proposals.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show working dropdown when user has enough voting power
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="bg-teal-500 text-white hover:bg-teal-600 disabled:bg-gray-300"
          disabled={isLoading}
        >
          + New Proposal
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-1">
        {proposalOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.path}
              className="flex items-center gap-3 px-3 h-11 cursor-pointer hover:bg-gray-50 rounded-md"
              onClick={() => router.push(option.path)}
            >
              <div className="flex-shrink-0 p-1.5 rounded-md bg-gray-100/80">
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
              <TruncatedText 
                text={option.label}
                className="font-medium text-sm text-gray-700"
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 