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

// Initialize Firebase app
let app: FirebaseApp | null = null;

if (typeof window !== 'undefined') {
  // Check if we have valid Firebase config
  const hasValidConfig = firebaseConfig.apiKey && 
                         firebaseConfig.projectId && 
                         firebaseConfig.apiKey !== '' && 
                         firebaseConfig.projectId !== '' &&
                         !firebaseConfig.apiKey.includes('your-') &&
                         !firebaseConfig.projectId.includes('your-');
  
  if (hasValidConfig) {
    try {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase initialized successfully');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      app = null;
    }
  } else {
    // Debug: Log what's missing
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase config check failed:', {
        hasApiKey: !!firebaseConfig.apiKey,
        hasProjectId: !!firebaseConfig.projectId,
        apiKeyLength: firebaseConfig.apiKey?.length || 0,
        projectIdLength: firebaseConfig.projectId?.length || 0,
        apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
        projectId: firebaseConfig.projectId
      });
    }
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
