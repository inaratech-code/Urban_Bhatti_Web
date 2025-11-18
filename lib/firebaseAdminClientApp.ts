import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

import { firebaseConfig } from './firebaseClient';

const ADMIN_APP_NAME = 'admin-dashboard';

function ensureAdminApp(): FirebaseApp | null {
  // Only initialize if we have the required config and we're in a browser
  if (typeof window === 'undefined' || !firebaseConfig.apiKey || !firebaseConfig.projectId ||
      firebaseConfig.apiKey === '' || firebaseConfig.projectId === '') {
    return null;
  }
  
  const existing = getApps().find((entry) => entry.name === ADMIN_APP_NAME);
  if (existing) {
    return existing;
  }
  try {
    return getApp(ADMIN_APP_NAME);
  } catch {
    try {
      return initializeApp(firebaseConfig, ADMIN_APP_NAME);
    } catch (error) {
      // Silently fail during build/SSR - Firebase will be initialized on client side
      return null;
    }
  }
}

export const adminApp: FirebaseApp | null = ensureAdminApp();


