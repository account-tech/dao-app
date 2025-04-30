import { create } from 'zustand';

type NavigationStore = {
  previousRoute: string;
  setPreviousRoute: (route: string) => void;
};

export const useNavigationStore = create<NavigationStore>((set) => ({
  previousRoute: '/',
  setPreviousRoute: (route) => set({ previousRoute: route }),
})); 