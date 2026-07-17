'use client';

import { createContext, useContext } from 'react';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  avatarUrl?: string | null;
  isOnboarded: boolean;
  branchId?: string | null;
}

export interface UserContextValue {
  user: SessionUser;
  isAdmin: boolean;
  isHR: boolean;
  isCEO: boolean;
  isOwner: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ value, children }: { value: UserContextValue; children: React.ReactNode }) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Access the authenticated user provided from the server layout. */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    // Safe fallback: pages that are not wrapped (e.g. error boundaries) won't crash.
    return {
      user: { id: '', name: '', email: '', role: 'Employee', department: '', designation: '', isOnboarded: true },
      isAdmin: false,
      isHR: false,
      isCEO: false,
      isOwner: false,
    };
  }
  return ctx;
}
