import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Registration is handled by Firebase Auth. This endpoint is disabled.' },
    { status: 410 }
  );
}

