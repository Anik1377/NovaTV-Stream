import { NextRequest, NextResponse } from 'next/server';
import { getMovieboxDetail } from '@/lib/moviebox';

export async function GET(req: NextRequest) {
  try {
    const slug = new URL(req.url).searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    const data = await getMovieboxDetail(slug);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 502 });
  }
}
