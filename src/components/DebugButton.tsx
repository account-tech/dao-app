"use client";

import { Button } from "@/components/ui/button";
import { useDaoStore } from "@/store/useDaoStore";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useEffect, useState } from "react";

export function DebugButton() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { client, currentAddress } = useDaoStore();
  const { getDao } = useDaoClient();
  const [walletObjects, setWalletObjects] = useState<any[]>([]);

  // Add useEffect for initial fetch
  useEffect(() => {
    const fetchAllObjects = async () => {
      if (!currentAccount) return;

      try {
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          options: {
            showContent: true,
            showType: true,
          }
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
    console.log('Current Account:', currentAccount?.address);
    console.log('Store State:', {
      currentAddress,
      hasClient: !!client,
    });
    console.log('Full Client:', client);

    // Add DAO information
    if (currentAccount?.address) {
      try {
        const daoInfo = await getDao(currentAccount.address);
        console.log('Current DAO Information:', daoInfo);
      } catch (error) {
        console.error('Error fetching DAO information:', error);
      }
    }

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