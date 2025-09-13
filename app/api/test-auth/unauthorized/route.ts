import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Unauthorized', 
      message: 'Authentication required to access this resource',
      code: 'unauthorized' 
    },
    { status: 401 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Unauthorized', 
      message: 'Invalid or expired authentication token',
      code: 'unauthorized' 
    },
    { status: 401 }
  );
}