import { NextResponse } from 'next/server';

export async function GET() {
  // Return invalid JSON that will cause parsing errors
  return new Response('{ invalid json syntax: missing quotes }', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST() {
  // Return invalid JSON
  return new Response('{ malformed: json, missing: "quotes" }', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}