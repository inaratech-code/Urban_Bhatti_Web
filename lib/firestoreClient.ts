import { getFirestore, type Firestore } from 'firebase/firestore';

import { app } from './firebaseClient';

// Only initialize Firestore if app is available
export const firestoreClient: Firestore | null = app ? getFirestore(app) : null;
