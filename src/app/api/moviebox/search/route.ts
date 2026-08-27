import { NextRequest, NextResponse } from 'next/server';
import { searchMoviebox } from '@/lib/moviebox';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
    const data = await searchMoviebox(q, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 502 });
  }
}
