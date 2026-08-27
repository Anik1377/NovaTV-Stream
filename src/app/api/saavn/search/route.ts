import { NextRequest, NextResponse } from 'next/server';
import { searchSongs } from '@/lib/saavn';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required query parameter' },
      { status: 400 },
    );
  }

  try {
    const results = await searchSongs(query.trim(), limit);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to search songs', details: message },
      { status: 500 },
    );
  }
}
