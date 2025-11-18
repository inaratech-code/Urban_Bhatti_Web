'use server';

import { NextResponse } from 'next/server';

import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAdminUser } from '../../../../lib/firebaseAdminAuth';
import { HARDCODED_ADMIN_UIDS } from '../../../../lib/adminUids';

const COLLECTIONS = {
  orders: 'orders',
  menuItems: 'menuItems',
  offers: 'offers',
  metrics: 'metrics',
  users: 'users'
} as const;

type CollectionName = keyof typeof COLLECTIONS;

export async function DELETE(request: Request) {
  try {
    await requireAdminUser(request);

    const url = new URL(request.url);
    const collectionParam = url.searchParams.get('collection');
    const confirm = url.searchParams.get('confirm');

    if (!confirm || confirm !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=true to proceed.' },
        { status: 400 }
      );
    }

    if (!collectionParam) {
      return NextResponse.json(
        { error: 'Collection parameter required. Use ?collection=<collectionName>' },
        { status: 400 }
      );
    }

    const collectionName = collectionParam as CollectionName;

    if (!COLLECTIONS[collectionName]) {
      return NextResponse.json(
        { error: `Invalid collection. Allowed: ${Object.keys(COLLECTIONS).join(', ')}` },
        { status: 400 }
      );
    }

    // Protect users collection - all users must be preserved
    if (collectionName === 'users') {
      return NextResponse.json(
        { error: 'Users collection is protected. All user accounts (admin and regular) are preserved and cannot be deleted.' },
        { status: 403 }
      );
    }

    const adminDb = await getAdminDb();
    const collection = adminDb.collection(COLLECTIONS[collectionName]);

    // Get all documents
    const snapshot = await collection.get();

    if (snapshot.empty) {
      return NextResponse.json({
        message: `Collection '${collectionName}' is already empty.`,
        deleted: 0
      });
    }

    // Delete all documents in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deletedCount = 0;
    const docs = snapshot.docs;

    // Process in batches
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = adminDb.batch();
      const batchDocs = docs.slice(i, i + batchSize);

      batchDocs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
    }

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} document(s) from '${collectionName}' collection.`,
      deleted: deletedCount,
      collection: collectionName
    });
  } catch (error) {
    console.error('Failed to clean database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to clean database';
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET endpoint to list collections and their document counts
export async function GET(request: Request) {
  try {
    await requireAdminUser(request);

    const adminDb = await getAdminDb();
    const stats: Record<string, number> = {};

    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
      try {
        if (key === 'users') {
          // For users collection, count admin vs regular users separately
          const allUsersSnapshot = await adminDb.collection(collectionName).get();
          const totalUsers = allUsersSnapshot.size;
          const adminUsers = allUsersSnapshot.docs.filter((doc) => 
            HARDCODED_ADMIN_UIDS.has(doc.id)
          ).length;
          const regularUsers = totalUsers - adminUsers;
          stats[key] = totalUsers;
          stats[`${key}_admin`] = adminUsers;
          stats[`${key}_regular`] = regularUsers;
        } else {
          const snapshot = await adminDb.collection(collectionName).count().get();
          stats[key] = snapshot.data().count;
        }
      } catch (error) {
        console.error(`Failed to count ${collectionName}:`, error);
        stats[key] = -1; // Error indicator
      }
    }

    return NextResponse.json({
      collections: stats,
      message: 'Use DELETE /api/admin/cleanup?collection=<name>&confirm=true to delete a collection'
    });
  } catch (error) {
    console.error('Failed to get database stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get database stats';
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

