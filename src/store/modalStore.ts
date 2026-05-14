import { create } from 'zustand';

interface ModalStore {
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
}));
