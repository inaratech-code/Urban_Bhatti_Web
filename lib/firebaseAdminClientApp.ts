import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

import { firebaseConfig } from './firebaseClient';

const ADMIN_APP_NAME = 'admin-dashboard';

function ensureAdminApp(): FirebaseApp {
  const existing = getApps().find((entry) => entry.name === ADMIN_APP_NAME);
  if (existing) {
    return existing;
  }
  try {
    return getApp(ADMIN_APP_NAME);
  } catch {
    return initializeApp(firebaseConfig, ADMIN_APP_NAME);
  }
}

export const adminApp: FirebaseApp = ensureAdminApp();


