import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const localResult = dotenv.config({ path: '.env.local' });
if (localResult.error) {
  dotenv.config();
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in environment.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: npm run set-admin -- <firebase-uid>');
  process.exit(1);
}

getAuth()
  .setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log(`Admin role applied to UID: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to set admin role:', error);
    process.exit(1);
  });

