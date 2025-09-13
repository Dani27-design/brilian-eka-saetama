import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Not Found', message: 'Test 404 error - Resource not found' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Not Found', message: 'Test 404 error triggered' },
    { status: 404 }
  );
}