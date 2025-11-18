import { browserSessionPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth';

import { adminApp } from './firebaseAdminClientApp';

// Only initialize auth if adminApp is available
export const firebaseAdminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

if (typeof window !== 'undefined' && firebaseAdminAuth) {
  void setPersistence(firebaseAdminAuth, browserSessionPersistence).catch((error) => {
    console.error('Failed to set admin auth persistence', error);
  });
}


