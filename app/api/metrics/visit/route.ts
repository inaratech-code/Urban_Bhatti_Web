import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

import { getAdminDb } from '../../../../lib/firebaseAdmin';

const METRICS_COLLECTION = 'metrics';
const VISITS_DOC = 'visits';

export async function POST() {
  try {
    const adminDb = await getAdminDb();
    const docRef = adminDb.collection(METRICS_COLLECTION).doc(VISITS_DOC);
    await docRef.set(
      {
        value: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    const snapshot = await docRef.get();
    const value = snapshot.exists ? (snapshot.data()?.value as number | undefined) ?? 0 : 0;

    return NextResponse.json({ value }, { status: 200 });
  } catch (error) {
    console.error('Failed to increment visit metric', error);
    return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
  }
}
