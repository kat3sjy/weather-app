import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  areas: string[];
  goals: string;
  experienceLevel: string;
  bio: string;
  location: string;
  createdAt: string;
  avatarUrl?: string;
}

interface UserState {
  user: User | null;
  setUser: (u: User) => void;
  clearUser: () => void;
}

const STORAGE_KEY = 'technova_user_v1';

const useUserBase = create<UserState>(set => ({
  user: null,
  setUser: (u) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
    set({ user: u });
  },
  clearUser: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    set({ user: null });
  }
}));

const UserStoreContext = createContext<typeof useUserBase | null>(null);

export function UserStoreProvider({children}:{children:React.ReactNode}) {
  // Hydrate once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        if (parsed && parsed.id) {
          useUserBase.getState().setUser(parsed);
        }
      }
    } catch {}
  }, []);
  return <UserStoreContext.Provider value={useUserBase}>{children}</UserStoreContext.Provider>;
}

export function useUserStore<T>(selector?: (s: UserState) => T): T extends undefined ? UserState : T;
export function useUserStore(selector?: any) {
  const ctx = useContext(UserStoreContext);
  if (!ctx) throw new Error('useUserStore must be used within provider');
  return selector ? ctx(selector) : ctx();
}
