// This file gives you a single Auth instance to use throughout your app
import { getAuth, setPersistence, browserSessionPersistence, type Auth } from 'firebase/auth';

import { app } from './firebaseClient';

// Only initialize auth if app is available
export const firebaseAuth: Auth | null = app ? getAuth(app) : null;

if (typeof window !== 'undefined' && firebaseAuth) {
  void setPersistence(firebaseAuth, browserSessionPersistence).catch((error) => {
    console.error('Failed to set auth persistence', error);
  });
}
