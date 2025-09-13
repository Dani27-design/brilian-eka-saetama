import { NextResponse } from 'next/server';

export async function GET() {
  // Simulate a server error
  throw new Error('This is a test 500 error - Internal Server Error');
}

export async function POST() {
  return NextResponse.json(
    { error: 'Internal Server Error', message: 'Test 500 error triggered' },
    { status: 500 }
  );
}