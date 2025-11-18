'use server';

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.warn('FIREBASE credentials are not fully configured. Firestore features may fail.', {
    projectIdMissing: !projectId,
    clientEmailMissing: !clientEmail,
    privateKeyMissing: !privateKey
  });
}

let adminApp: App | null = null;

function ensureAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0]!;
    return adminApp;
  }

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    return adminApp;
  }

  adminApp = initializeApp();
  return adminApp;
}

ensureAdminApp();

export async function getAdminDb() {
  return getFirestore(ensureAdminApp());
}

