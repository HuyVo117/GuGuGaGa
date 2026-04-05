import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,

  signIn: (signData) =>
    set(() => ({
      user: signData,
      isLoggedIn: true,
    })),

  signOut: () =>
    set(() => ({
      user: null,
      isLoggedIn: false,
    })),
}));
