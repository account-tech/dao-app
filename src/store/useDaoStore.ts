import { create } from 'zustand'
import { DaoClient } from "@account.tech/dao";
import { NETWORK_TYPE } from "@/constants/network";

/**
 * State interface for the DAO store
 */
interface DaoState {
  /** Current active DAO client instance */
  client: DaoClient | null;
  /** Currently connected wallet address */
  address: string | null;
  /** Currently selected DAO ID */
  daoId: string | null;
  /** Counter to trigger UI refreshes */
  refreshCounter: number;
}

/**
 * Actions interface for the DAO store
 */
interface DaoActions {
  /** Initialize or retrieve a DAO client */
  initClient: (address: string, daoId?: string) => Promise<DaoClient>;
  /** Reset the store state */
  reset: () => void;
  /** Update the connected wallet address */
  setAddress: (address: string | null) => void;
  /** Trigger a UI refresh */
  refresh: () => void;
  /** Refresh the client data and trigger UI refresh */
  refreshClient: () => Promise<void>;
}

const initialState: Omit<DaoState, 'refreshCounter'> = {
  client: null,
  address: null,
  daoId: null,
};

export const useDaoStore = create<DaoState & DaoActions>((set, get) => ({
  ...initialState,
  refreshCounter: 0,

  initClient: async (address: string, daoId?: string) => {
    const state = get();
    
    try {
      // Case 1: No client exists or address changed - need full initialization
      if (!state.client || state.address !== address) {
        console.log("initializing client", address, daoId);
        const client = await DaoClient.init(NETWORK_TYPE, address, daoId);
        set({ 
          client,
          address,
          daoId: daoId || null
        });
        return client;
      }
      
      // Case 2: Client exists, same address, but daoId changed - use switchDao
      if (daoId && state.daoId !== daoId) {
        console.log("switching dao", daoId);
        await state.client.switchDao(daoId);
        set({ daoId });
      }
      
      // Return existing client
      return state.client;
    } catch (error) {
      // Reset state on error but keep refreshCounter
      const { refreshCounter } = get();
      set({ ...initialState, refreshCounter });
      throw error;
    }
  },

  reset: () => {
    // Keep the current refreshCounter when resetting
    const { refreshCounter } = get();
    set({ ...initialState, refreshCounter });
  },

  setAddress: (address) => {
    const { address: currentAddress, refreshCounter } = get();
    if (currentAddress !== address) {
      set({ ...initialState, address, refreshCounter });
    }
  },

  refresh: () => set(state => ({ 
    refreshCounter: state.refreshCounter + 1
  })),

  refreshClient: async () => {
    const state = get();
    if (state.client) {
      try {
        //normally we would just call state.client.refresh() bit its not triggering a loading state
        await state.client.refresh();
        // Reset the client and address
        //set({...initialState})
        // Trigger UI refresh after client refresh
        set(state => ({ refreshCounter: state.refreshCounter + 1 }));
      } catch (error) {
        console.error("Error refreshing client:", error);
        throw error;
      }
    }
  }
}));