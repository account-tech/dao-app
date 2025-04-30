"use client";

import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDisconnectWallet, useCurrentAccount, ConnectModal } from '@mysten/dapp-kit';
import { useNavigationStore } from "@/store/navigationStore";
import { useEffect } from "react";

const Navbar = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const pathname = usePathname();
  const router = useRouter();
  const { setPreviousRoute } = useNavigationStore();

  // Store the current path when it changes
  useEffect(() => {
    setPreviousRoute(pathname);
  }, [pathname, setPreviousRoute]);

  const handleDisconnect = () => {
    disconnect(undefined, {
      onSuccess: () => console.log('disconnected')
    });
  };

  const handleBack = () => {
    router.back();
  };

  const isHomePage = pathname === "/";

  // Hide navbar on home page when disconnected
  if (isHomePage && !currentAccount?.address) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white backdrop-blur-lg">
      <div className="px-4">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center">
            {isHomePage ? (
              <Button
                size="icon"
                variant="ghost"
                asChild
                className="h-8 w-8"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
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
