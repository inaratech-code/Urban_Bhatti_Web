import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

import { firebaseConfig } from './firebaseClient';

const ADMIN_APP_NAME = 'admin-dashboard';

function ensureAdminApp(): FirebaseApp | null {
  // Only initialize if we have the required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
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
      console.warn('Admin Firebase app initialization failed:', error);
      return null;
    }
  }
}

export const adminApp: FirebaseApp | null = ensureAdminApp();


