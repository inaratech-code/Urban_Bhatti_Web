import { NextResponse } from 'next/server';

import { requireAdminUser } from '../../../../lib/firebaseAdminAuth';
import { getAdminDb } from '../../../../lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();
    const snapshot = await adminDb.collection('menuItems').orderBy('title').get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        _id: doc.id,
        title: data.title ?? 'Menu Item',
        description: data.description ?? '',
        price: data.price ?? 0,
        category: data.category ?? 'General',
        imageUrl: data.imageUrl ?? '',
        rating: data.rating ?? 4.5,
        isAvailable: data.isAvailable ?? true
      };
    });
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error(error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();
    const { title, description, price, category, imageUrl } = await request.json();

    if (!title || !description || !price || !category || !imageUrl) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const docRef = await adminDb.collection('menuItems').add({
      title,
      description,
      price,
      category,
      imageUrl,
      isAvailable: true,
      rating: 4.5
    });

    const created = await docRef.get();
    return NextResponse.json({ id: created.id, ...created.data() }, { status: 201 });
  } catch (error) {
    console.error(error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    console.log('PATCH request body:', body);
    console.log('Body type:', typeof body);
    console.log('Body keys:', Object.keys(body || {}));
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }
    
    const { id, ...payload } = body;
    
    if (!id) {
      console.error('Missing id in request body:', body);
      return NextResponse.json({ error: 'Menu item id is required' }, { status: 400 });
    }

    // Filter out undefined and null values - Firestore doesn't allow undefined
    const cleanPayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        cleanPayload[key] = value;
      }
    }

    console.log('Clean payload:', cleanPayload);

    if (Object.keys(cleanPayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const docRef = adminDb.collection('menuItems').doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Get current data
    const currentData = snapshot.data();
    console.log('Current data:', currentData);

    // Only update the fields in cleanPayload - don't include rating unless it's being updated
    console.log('Final update data:', cleanPayload);
    await docRef.update(cleanPayload);
    
    const updated = await docRef.get();
    const updatedData = updated.data();
    
    // Ensure response has all required fields with defaults
    const responseData: Record<string, any> = { 
      id: updated.id, 
      ...updatedData
    };
    
    // Ensure rating is never undefined in response
    if (responseData.rating === undefined) {
      responseData.rating = 4.5;
    }
    
    // Ensure isAvailable is never undefined in response
    if (responseData.isAvailable === undefined) {
      responseData.isAvailable = true;
    }
    
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminUser(request);
    const adminDb = await getAdminDb();
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Menu item id is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('menuItems').doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ message: 'Menu item deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}

