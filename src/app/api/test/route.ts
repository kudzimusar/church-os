import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse JSON' }, { status: 400 });
  }
}
