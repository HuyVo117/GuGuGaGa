import { create } from "zustand";

export const useAdminUiStore = create((set) => ({
  activeTab: "dashboard",
  setActiveTab: (activeTab) => set({ activeTab }),
}));
