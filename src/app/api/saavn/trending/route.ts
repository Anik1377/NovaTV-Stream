import { NextRequest, NextResponse } from 'next/server';
import { getTrending } from '@/lib/saavn';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get('limit') || '25');
  const q = searchParams.get('q') || 'Top Hits 2025';

  try {
    const results = await getTrending(q, limit);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch trending songs', details: message },
      { status: 500 },
    );
  }
}
