import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatDock = create(
  persist(
    (set) => ({
      isChatDocked: false,
      toggleChatDock: () => set((state) => ({ isChatDocked: !state.isChatDocked })),
      setChatDock: (val) => set({ isChatDocked: val }),
    }),
    {
      name: 'chat-dock-storage',
    }
  )
);
