import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Permission Denied', 
      message: 'You do not have permission to access this resource',
      code: 'permission-denied' 
    },
    { status: 403 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Permission Denied', 
      message: 'Insufficient permissions for this operation',
      code: 'permission-denied' 
    },
    { status: 403 }
  );
}