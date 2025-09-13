import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Service Unavailable', message: 'Test 503 error - Service temporarily unavailable' },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Service Unavailable', message: 'Test 503 error triggered' },
    { status: 503 }
  );
}