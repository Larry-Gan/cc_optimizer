import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sectionOpenState: Record<string, boolean>;
  setSectionOpen: (id: string, isOpen: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sectionOpenState: {},
      setSectionOpen: (id, isOpen) =>
        set((state) => ({
          sectionOpenState: {
            ...state.sectionOpenState,
            [id]: isOpen,
          },
        })),
    }),
    {
      name: "cc-optimizer-ui-v1",
    }
  )
);
