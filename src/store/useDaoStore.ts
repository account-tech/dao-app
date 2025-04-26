import { create } from 'zustand'
import { DaoClient } from "@account.tech/dao";
import { NETWORK_TYPE } from "@/constants/network";

interface DaoState {
  currentDaoId: string | null;
  client: DaoClient | null;
  refreshTrigger: number;
  currentAddress: string | null;
  setClient: (client: DaoClient) => void;
  resetClient: () => void;
  setCurrentAddress: (address: string | null) => void;
  getOrInitClient: (userAddr: string, daoId?: string) => Promise<DaoClient>;
  triggerRefresh: () => void;
}

export const useDaoStore = create<DaoState>((set, get) => ({
  currentDaoId: null,
  client: null,
  refreshTrigger: 0,
  currentAddress: null,
  setClient: (client) => set({ client }),
  resetClient: () => {
    set({ client: null, currentDaoId: null });
  },
  setCurrentAddress: (address) => {
    const currentAddress = get().currentAddress
    // If address changed, reset the client
    if (currentAddress !== address) {
      set({ client: null, currentAddress: address, currentDaoId: null })
    }
  },
  getOrInitClient: async (userAddr: string, daoId?: string) => {
    const { client, currentAddress, currentDaoId } = get()

    // If address changed, daoId changed, or no client exists, create new one
    if (
      currentAddress !== userAddr || 
      !client || 
      (daoId && currentDaoId !== daoId)
    ) {
      try {
        console.log("Creating new client for:", userAddr, "daoId:", daoId);
        const newClient = await DaoClient.init(NETWORK_TYPE, userAddr, daoId)
        set({ 
          client: newClient, 
          currentAddress: userAddr,
          currentDaoId: daoId || null
        })
        return newClient
      } catch (error) {
        console.error("Error initializing DaoClient:", error)
        throw error
      }
    }

    // If daoId is provided but different from current, switch to it
    if (daoId && client && client.dao?.id !== daoId) {
      try {
        console.log("Switching client to daoId:", daoId);
        await client.switchDao(daoId);
        set({ currentDaoId: daoId });
      } catch (error) {
        console.error("Error switching dao:", error);
        throw error;
      }
    }

    return client
  },
  triggerRefresh: () => {
    set(state => ({ refreshTrigger: state.refreshTrigger + 1 }));
  }
}))