"use client";

import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDisconnectWallet, useCurrentAccount, ConnectModal } from '@mysten/dapp-kit';
import { useNavigationStore } from "@/store/navigationStore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const pathname = usePathname();
  const router = useRouter();

  const isDaoPage = pathname.startsWith('/daos/');
  
  // Special pages that should use white background instead of transparent
  const specialPages = [
    '/settings/requestConfigDao',
    '/settings/requestToggleUnverifiedDeps',
    '/wallet/requestWithdrawAndTransfer',
    '/requestWithdrawAndTransferToVault',
    '/requestSpendAndTransfer',
    '/settings/requestConfigDeps',
    '/requestSpendAndVest',
    '/requestSpendAndAirdrop'
  ];
  
  const isSpecialPage = specialPages.some(page => pathname.includes(page));

  const handleDisconnect = () => {
    disconnect(undefined, {
      onSuccess: () => console.log('disconnected')
    });
  };

  const handleBack = () => {
    // Split the current path into segments
    const segments = pathname.split('/').filter(Boolean);
    
    // If we're at root or have no segments, go home
    if (segments.length <= 1) {
      return router.push('/');
    }

    // Remove the last segment and reconstruct the path
    const previousPath = '/' + segments.slice(0, -1).join('/');
    console.log("Going back to:", previousPath);
    router.push(previousPath);
  };

  const isHomePage = pathname === "/";

  // Hide navbar on home page when disconnected
  if (isHomePage && !currentAccount?.address) {
    return null;
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0",
      isDaoPage && !isSpecialPage
        ? "z-10 bg-transparent" 
        : "z-50 border-b bg-white"
    )}>
      <div className="px-6">
        <div className={cn(
          "flex items-center justify-between",
          isDaoPage && !isSpecialPage ? "h-22" : "h-12"
        )}>
          <div className={cn(
            "flex gap-2",
            isDaoPage && !isSpecialPage ? "flex-col items-start pt-4" : "flex-row items-center"
          )}>
            <Button
              size="icon"
              variant="ghost"
              asChild
              className={cn(
                isDaoPage && !isSpecialPage ? "h-10 w-10" : "h-8 w-8"
              )}
            >
              <Link href="/">
                <Home className={cn(
                  isDaoPage && !isSpecialPage ? "h-5 w-5" : "h-4 w-4"
                )} />
              </Link>
            </Button>
            {!isHomePage && (
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  isDaoPage && !isSpecialPage ? "h-10 w-10" : "h-8 w-8"
                )}
                onClick={handleBack}
              >
                <ArrowLeft className={cn(
                  isDaoPage && !isSpecialPage ? "h-5 w-5" : "h-4 w-4"
                )} />
              </Button>
            )}
          </div>
          
          <div className="flex items-center">
            {currentAccount?.address ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            ) : (
              <ConnectModal
                trigger={
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                  >
                    Connect Wallet
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
