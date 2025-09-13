import { NextResponse } from 'next/server';

export async function GET() {
  // Simulate a long delay that would cause a timeout
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
  
  return NextResponse.json(
    { message: 'This response should timeout before reaching here' }
  );
}

export async function POST() {
  // Simulate a long delay
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  return NextResponse.json(
    { message: 'This response should timeout before reaching here' }
  );
}