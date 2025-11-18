import { NextResponse } from 'next/server';

function deprecated() {
  return NextResponse.json(
    { error: 'NextAuth has been replaced by Firebase Auth. This endpoint is disabled.' },
    { status: 410 }
  );
}

export const GET = deprecated;
export const POST = deprecated;

