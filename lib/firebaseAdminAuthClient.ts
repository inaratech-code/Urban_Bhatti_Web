import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth';

import { adminApp } from './firebaseAdminClientApp';

export const firebaseAdminAuth = getAuth(adminApp);

if (typeof window !== 'undefined') {
  void setPersistence(firebaseAdminAuth, browserSessionPersistence).catch((error) => {
    console.error('Failed to set admin auth persistence', error);
  });
}


