import { NextRequest, NextResponse } from 'next/server';
import { getMovieboxCategory } from '@/lib/moviebox';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'RECOMMEND';
    const data = await getMovieboxCategory(8, page, 24, sort);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch animation' }, { status: 502 });
  }
}
