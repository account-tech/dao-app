"use client";

import { ConnectModal } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';

export function UnconnectedView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-md text-center px-4">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
          Welcome to DAO Dapp
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Connect your wallet to get started with decentralized governance
        </p>
        <ConnectModal
          trigger={
            <Button 
              variant="default"
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-pink-600 border-0 text-white hover:from-pink-600 hover:to-pink-700"
            >
              Connect Wallet
            </Button>
          }
        />
      </div>
    </div>
  );
} 