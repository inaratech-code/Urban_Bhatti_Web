// This file gives you a single Auth instance to use throughout your app
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';

import { app } from './firebaseClient';

export const firebaseAuth = getAuth(app);

if (typeof window !== 'undefined') {
  void setPersistence(firebaseAuth, browserSessionPersistence).catch((error) => {
    console.error('Failed to set auth persistence', error);
  });
}
