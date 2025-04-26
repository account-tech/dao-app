"use client";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";
import { useDisconnectWallet, useCurrentAccount, ConnectModal } from '@mysten/dapp-kit';

const Navbar = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  const handleDisconnect = () => {
    disconnect(undefined, {
      onSuccess: () => console.log('disconnected')
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white/75 backdrop-blur-lg">
      <div className="px-4">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center">
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
