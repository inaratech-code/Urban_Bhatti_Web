'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  onIdTokenChanged,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';

import { firebaseAuth } from '../lib/firebaseAuthClient';
import { firebaseAdminAuth } from '../lib/firebaseAdminAuthClient';
import { HARDCODED_ADMIN_UIDS } from '../lib/adminUids';

type Role = 'admin' | 'guest';

type AuthContextValue = {
  user: FirebaseUser | null;
  role: Role | null;
  token: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshToken: (force?: boolean) => Promise<string | null>;
};

function createAuthModule(auth: Auth, contextName: string) {
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);

  function Provider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setRole(null);
          setToken(null);
          setLoading(false);
          return;
        }

        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          let claimRole = (tokenResult.claims.role as Role | undefined) ?? 'guest';
          if (HARDCODED_ADMIN_UIDS.has(firebaseUser.uid)) {
            claimRole = 'admin';
          }
          setUser(firebaseUser);
          setRole(claimRole);
          setToken(tokenResult.token);
        } catch (error) {
          console.error(`[${contextName}] Failed to get ID token`, error);
          setUser(firebaseUser);
          setRole('guest');
          setToken(null);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }, []);

    useEffect(() => {
      const interval = window.setInterval(() => {
        if (auth.currentUser) {
          auth.currentUser.getIdToken(true).then(setToken).catch(() => undefined);
        }
      }, 10 * 60 * 1000);

      return () => window.clearInterval(interval);
    }, []);

    const refreshToken = async (force?: boolean) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      try {
        const freshToken = await currentUser.getIdToken(force ?? false);
        setToken(freshToken);
        const tokenResult = await currentUser.getIdTokenResult();
        let claimRole = (tokenResult.claims.role as Role | undefined) ?? 'guest';
        if (HARDCODED_ADMIN_UIDS.has(currentUser.uid)) {
          claimRole = 'admin';
        }
        setRole(claimRole);
        return freshToken;
      } catch (error) {
        console.error(`[${contextName}] Failed to refresh token`, error);
        return null;
      }
    };

    const value = useMemo<AuthContextValue>(
      () => ({
        user,
        role,
        token,
        loading,
        signOut: async () => {
          await firebaseSignOut(auth);
          setUser(null);
          setRole(null);
          setToken(null);
        },
        refreshToken
      }),
      [loading, role, token, user]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  function useAuthInstance() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error(`useAuthInstance must be used within ${contextName}`);
    }
    return ctx;
  }

  return { Provider, useAuth: useAuthInstance };
}

// Create a dummy auth module when Firebase is not configured
const createDummyAuthModule = (contextName: string) => {
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  function Provider({ children }: { children: ReactNode }) {
    const value = useMemo<AuthContextValue>(
      () => ({
        user: null,
        role: null,
        token: null,
        loading: false,
        signOut: async () => {},
        refreshToken: async () => null
      }),
      []
    );
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  
  function useAuthInstance() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error(`useAuthInstance must be used within ${contextName}`);
    }
    return ctx;
  }
  
  return { Provider, useAuth: useAuthInstance };
};

const defaultAuthModule = firebaseAuth 
  ? createAuthModule(firebaseAuth, 'AuthProvider')
  : createDummyAuthModule('AuthProvider');
  
const adminAuthModule = firebaseAdminAuth
  ? createAuthModule(firebaseAdminAuth, 'AdminAuthProvider')
  : createDummyAuthModule('AdminAuthProvider');

export const AuthProvider = defaultAuthModule.Provider;
export const useAuth = defaultAuthModule.useAuth;

export const AdminAuthProvider = adminAuthModule.Provider;
export const useAdminAuth = adminAuthModule.useAuth;
