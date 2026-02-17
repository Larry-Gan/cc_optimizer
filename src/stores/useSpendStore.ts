import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultSpendProfile, STORAGE_KEYS } from "../lib/defaults";
import type { SpendProfile } from "../types/spend";

interface SpendState {
  profiles: SpendProfile[];
  activeProfileId: string;
  upsertProfile: (profile: SpendProfile) => void;
  setActiveProfile: (id: string) => void;
  updateCategorySpend: (categoryId: string, amount: number) => void;
  resetToDefault: () => void;
}

export const useSpendStore = create<SpendState>()(
  persist(
    (set, get) => ({
      profiles: [defaultSpendProfile],
      activeProfileId: defaultSpendProfile.id,
      upsertProfile: (profile) =>
        set((state) => {
          const existing = state.profiles.find((p) => p.id === profile.id);
          return {
            profiles: existing
              ? state.profiles.map((p) => (p.id === profile.id ? profile : p))
              : [...state.profiles, profile],
          };
        }),
      setActiveProfile: (id) => set({ activeProfileId: id }),
      updateCategorySpend: (categoryId, amount) =>
        set((state) => {
          const active = state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0];
          const updated: SpendProfile = {
            ...active,
            monthlySpend: {
              ...active.monthlySpend,
              [categoryId]: Math.max(0, amount),
            },
          };
          return {
            profiles: state.profiles.map((p) => (p.id === updated.id ? updated : p)),
          };
        }),
      resetToDefault: () => set({ profiles: [defaultSpendProfile], activeProfileId: defaultSpendProfile.id }),
    }),
    { name: STORAGE_KEYS.spend },
  ),
);

export function useActiveSpendProfile(): SpendProfile {
  return useSpendStore((state) => {
    return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0];
  });
}
