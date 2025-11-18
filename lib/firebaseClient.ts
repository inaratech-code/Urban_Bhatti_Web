import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Only initialize Firebase if we have the required API key and we're in a browser
// This prevents build errors when environment variables are not set
let app: FirebaseApp | null = null;
if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId && 
    firebaseConfig.apiKey !== '' && firebaseConfig.projectId !== '') {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    // Silently fail during build/SSR - Firebase will be initialized on client side
    app = null;
  }
}

let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && app) {
  isSupported()
    .then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { app, analytics };