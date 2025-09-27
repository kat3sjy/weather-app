import React, { createContext, useContext, useEffect } from 'react';
import { type ReactNode } from 'react';
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
  // Connection / networking additions
  connections?: string[]; // accepted connection user IDs
  incomingRequests?: string[]; // user IDs who requested to connect with this user
  outgoingRequests?: string[]; // user IDs this user has requested
  contact?: string; // gated contact info (email / handle)
}

interface UserState {
  // Current authenticated user id & derived object
  user: User | null;
  users: User[]; // directory
  setUser: (u: User) => void; // update current user object
  registerUser: (u: User) => void; // add new user and set as current
  clearUser: () => void;
  logout: () => void; // alias for clarity
  sendConnectionRequest: (targetId: string) => void;
  acceptConnectionRequest: (sourceId: string) => void;
  rejectConnectionRequest: (sourceId: string) => void;
  cancelConnectionRequest: (targetId: string) => void;
  removeConnection: (targetId: string) => void;
  getUserByUsername: (username: string) => User | undefined;
}

const STORAGE_KEY_SINGLE = 'technova_user_v1'; // legacy single-user key
const STORAGE_KEY_MULTI = 'technova_users_v1';

interface PersistShape {
  users: User[];
  currentUserId: string | null;
}

interface SetUser {
  (u: User): void;
}

interface ClearUser {
  (): void;
}

interface UseUserBase extends UserState {}

const useUserBase = create((set: (partial: Partial<UserState>) => void, get: () => UserState): UserState => ({
  user: null,
  users: [],
  setUser: (u: User) => {
    // Update current user in directory
    const state = get();
    const users = state.users.map(ex => ex.id === u.id ? { ...ex, ...u } : ex);
    persist({ users, currentUserId: u.id });
    set({ user: { ...u }, users });
  },
  registerUser: (u: User) => {
    const state = get();
    const withDefaults: User = {
      ...u,
      connections: u.connections || [],
      incomingRequests: u.incomingRequests || [],
      outgoingRequests: u.outgoingRequests || [],
      contact: u.contact || `${u.username}@example.com`
    };
    const users = [...state.users, withDefaults];
    persist({ users, currentUserId: withDefaults.id });
    set({ users, user: withDefaults });
  },
  clearUser: () => {
    const state = get();
    persist({ users: state.users, currentUserId: null });
    set({ user: null });
  },
  logout: () => {
    const state = get();
    persist({ users: state.users, currentUserId: null });
    set({ user: null });
  },
  sendConnectionRequest: (targetId: string) => {
    const { user, users } = get();
    if (!user || user.id === targetId) return;
    const alreadyConnected = user.connections?.includes(targetId);
    const pending = user.outgoingRequests?.includes(targetId);
    const target = users.find(u => u.id === targetId);
    if (!target) return;
    // If target already requested this user, auto-accept (mutual request)
    const targetRequestedAlready = target.outgoingRequests?.includes(user.id) || target.incomingRequests?.includes(user.id);
    let updatedUsers;
    if (targetRequestedAlready) {
      updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            incomingRequests: (u.incomingRequests||[]).filter(id => id !== targetId),
            connections: [...new Set([...(u.connections||[]), targetId])],
            outgoingRequests: (u.outgoingRequests||[]).filter(id => id !== targetId)
          };
        }
        if (u.id === targetId) {
          return {
            ...u,
            incomingRequests: (u.incomingRequests||[]).filter(id => id !== user.id),
            outgoingRequests: (u.outgoingRequests||[]).filter(id => id !== user.id),
            connections: [...new Set([...(u.connections||[]), user.id])]
          };
        }
        return u;
      });
    } else {
      if (alreadyConnected || pending) return;
      updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return { ...u, outgoingRequests: [...(u.outgoingRequests||[]), targetId] };
        }
        if (u.id === targetId) {
          return { ...u, incomingRequests: [...(u.incomingRequests||[]), user.id] };
        }
        return u;
      });
    }
    persistCurrentUserId(user.id, updatedUsers);
    set({ users: updatedUsers, user: updatedUsers.find(u => u.id === user.id) || null });
  },
  acceptConnectionRequest: (sourceId: string) => {
    const { user, users } = get();
    if (!user) return;
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          incomingRequests: (u.incomingRequests || []).filter(id => id !== sourceId),
          connections: [...new Set([...(u.connections||[]), sourceId])]
        };
      }
      if (u.id === sourceId) {
        return {
          ...u,
            outgoingRequests: (u.outgoingRequests || []).filter(id => id !== user.id),
            connections: [...new Set([...(u.connections||[]), user.id])]
        };
      }
      return u;
    });
    persistCurrentUserId(user.id, updatedUsers);
    set({ users: updatedUsers, user: updatedUsers.find(u => u.id === user.id) || null });
  },
  rejectConnectionRequest: (sourceId: string) => {
    const { user, users } = get();
    if (!user) return;
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, incomingRequests: (u.incomingRequests || []).filter(id => id !== sourceId) };
      }
      if (u.id === sourceId) {
        return { ...u, outgoingRequests: (u.outgoingRequests || []).filter(id => id !== user.id) };
      }
      return u;
    });
    persistCurrentUserId(user.id, updatedUsers);
    set({ users: updatedUsers, user: updatedUsers.find(u => u.id === user.id) || null });
  },
  cancelConnectionRequest: (targetId: string) => {
    const { user, users } = get();
    if (!user) return;
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, outgoingRequests: (u.outgoingRequests || []).filter(id => id !== targetId) };
      }
      if (u.id === targetId) {
        return { ...u, incomingRequests: (u.incomingRequests || []).filter(id => id !== user.id) };
      }
      return u;
    });
    persistCurrentUserId(user.id, updatedUsers);
    set({ users: updatedUsers, user: updatedUsers.find(u => u.id === user.id) || null });
  },
  removeConnection: (targetId: string) => {
    const { user, users } = get();
    if (!user) return;
    if (!(user.connections || []).includes(targetId)) return;
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, connections: (u.connections || []).filter(id => id !== targetId) };
      }
      if (u.id === targetId) {
        return { ...u, connections: (u.connections || []).filter(id => id !== user.id) };
      }
      return u;
    });
    persistCurrentUserId(user.id, updatedUsers);
    set({ users: updatedUsers, user: updatedUsers.find(u => u.id === user.id) || null });
  },
  getUserByUsername: (username: string) => {
    const { users } = get();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }
}));

function persist(data: PersistShape) {
  try { localStorage.setItem(STORAGE_KEY_MULTI, JSON.stringify(data)); } catch {}
}

function persistCurrentUserId(currentUserId: string | null, users: User[]) {
  persist({ users, currentUserId });
}

const UserStoreContext = createContext(null as unknown as ReturnType<typeof useUserBase>);

interface ProviderProps { children?: any }
export function UserStoreProvider({ children }: ProviderProps) {
  // Hydrate once on mount
  useEffect(() => {
    try {
      // Migration: if multi-user store exists load it, else migrate legacy single user if present
      const multiRaw = localStorage.getItem(STORAGE_KEY_MULTI);
      if (multiRaw) {
        const parsed = JSON.parse(multiRaw) as PersistShape;
        if (parsed && Array.isArray(parsed.users)) {
          let { users, currentUserId } = parsed;
          // Ensure defaults for connection arrays
          users = users.map(u => ({
            ...u,
            connections: u.connections || [],
            incomingRequests: u.incomingRequests || [],
            outgoingRequests: u.outgoingRequests || [],
            contact: u.contact || `${u.username}@example.com`
          }));
          // Seed sample users if only one user exists to allow connecting
          if (users.length < 2) {
            const samples: User[] = [
              {
                id: 'sample-1', username: 'aisha', firstName: 'Aisha', lastName: 'K', areas: ['Esports'], goals: 'Grow shoutcasting skills',
                experienceLevel: 'Early Career', bio: 'Caster & community builder.', location: 'Remote', createdAt: new Date().toISOString(),
                connections: [], incomingRequests: [], outgoingRequests: [], contact: 'aisha@example.com'
              },
              {
                id: 'sample-2', username: 'naomi', firstName: 'Naomi', lastName: 'P', areas: ['VR/AR'], goals: 'Ship immersive prototype',
                experienceLevel: 'Student', bio: 'VR dev & hackathon fan.', location: 'Seattle', createdAt: new Date().toISOString(),
                connections: [], incomingRequests: [], outgoingRequests: [], contact: 'naomi@example.com'
              }
            ];
            users = [...users, ...samples];
          }
          persist({ users, currentUserId });
          const current = users.find(u => u.id === currentUserId) || null;
          useUserBase.setState({ users, user: current });
          return;
        }
      }
      const legacyRaw = localStorage.getItem(STORAGE_KEY_SINGLE);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as User;
        if (legacy && legacy.id) {
          const migrated: User = {
            ...legacy,
            connections: [], incomingRequests: [], outgoingRequests: [], contact: `${legacy.username}@example.com`
          };
          // seed samples
          const samples: User[] = [
            migrated,
            {
              id: 'sample-1', username: 'aisha', firstName: 'Aisha', lastName: 'K', areas: ['Esports'], goals: 'Grow shoutcasting skills',
              experienceLevel: 'Early Career', bio: 'Caster & community builder.', location: 'Remote', createdAt: new Date().toISOString(),
              connections: [], incomingRequests: [], outgoingRequests: [], contact: 'aisha@example.com'
            },
            {
              id: 'sample-2', username: 'naomi', firstName: 'Naomi', lastName: 'P', areas: ['VR/AR'], goals: 'Ship immersive prototype',
              experienceLevel: 'Student', bio: 'VR dev & hackathon fan.', location: 'Seattle', createdAt: new Date().toISOString(),
              connections: [], incomingRequests: [], outgoingRequests: [], contact: 'naomi@example.com'
            }
          ];
          persist({ users: samples, currentUserId: migrated.id });
          useUserBase.setState({ users: samples, user: migrated });
        }
      } else {
        // Initial seed (no users yet) create sample directory only; user remains null until onboarding
        const samples: User[] = [
          {
            id: 'sample-1', username: 'aisha', firstName: 'Aisha', lastName: 'K', areas: ['Esports'], goals: 'Grow shoutcasting skills',
            experienceLevel: 'Early Career', bio: 'Caster & community builder.', location: 'Remote', createdAt: new Date().toISOString(),
            connections: [], incomingRequests: [], outgoingRequests: [], contact: 'aisha@example.com'
          },
          {
            id: 'sample-2', username: 'naomi', firstName: 'Naomi', lastName: 'P', areas: ['VR/AR'], goals: 'Ship immersive prototype',
            experienceLevel: 'Student', bio: 'VR dev & hackathon fan.', location: 'Seattle', createdAt: new Date().toISOString(),
            connections: [], incomingRequests: [], outgoingRequests: [], contact: 'naomi@example.com'
          }
        ];
        persist({ users: samples, currentUserId: null });
        useUserBase.setState({ users: samples, user: null });
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
