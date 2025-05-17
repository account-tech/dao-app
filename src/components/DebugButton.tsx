"use client";

import { Button } from "@/components/ui/button";
import { useDaoStore } from "@/store/useDaoStore";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useEffect, useState } from "react";

export function DebugButton() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { client } = useDaoStore();
  const { getDao } = useDaoClient();
  const [walletObjects, setWalletObjects] = useState<any[]>([]);

  // Add useEffect for initial fetch
  useEffect(() => {
    const fetchAllObjects = async () => {
      if (!currentAccount) return;

      try {
        const objects = await suiClient.getAllCoins({
          owner: currentAccount.address,
        });
        setWalletObjects(objects.data);
      } catch (error) {
        console.error('Error fetching all objects:', error);
      }
    };

    fetchAllObjects();
  }, [currentAccount, suiClient]);

  const handleDebugClick = async () => {
    console.log('=== Debug Information ===');
    console.log(walletObjects);
    console.log('Full Client:', client);
    console.log('=====================');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 size-12 rounded-full bg-black hover:bg-gray-800 text-white"
      onClick={handleDebugClick}
    >
      🐛
    </Button>
  );
} 