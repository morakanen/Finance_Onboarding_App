// stores/useOnboardingStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOnboardingStore = create(
  persist(
    (set) => ({
      data: {},
      setData: (step, values) => set((state) => ({
        data: { ...state.data, [step]: values }
      })),
      clear: () => set({ data: {} }),
    }),
    { name: 'onboarding-store' }
  )
);