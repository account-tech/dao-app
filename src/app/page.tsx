"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";

export default function Home() {
  const currentAccount = useCurrentAccount();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {currentAccount?.address ? (
          <p className="font-mono break-all px-4">{currentAccount.address}</p>
        ) : (
          <p className="text-lg">Connect your wallet</p>
        )}
      </div>
    </div>
  );
}
