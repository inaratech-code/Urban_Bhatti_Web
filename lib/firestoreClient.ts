import { getFirestore } from 'firebase/firestore';

import { app } from './firebaseClient';

export const firestoreClient = getFirestore(app);
