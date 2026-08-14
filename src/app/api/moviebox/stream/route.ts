import { NextRequest, NextResponse } from 'next/server';
import { getMovieboxStream } from '@/lib/moviebox';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('id');
    const detailPath = searchParams.get('slug');
    const se = parseInt(searchParams.get('se') || '1');
    const ep = parseInt(searchParams.get('ep') || '1');
    if (!subjectId || !detailPath) {
      return NextResponse.json({ error: 'id and slug required' }, { status: 400 });
    }
    const data = await getMovieboxStream(subjectId, detailPath, se, ep);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Stream fetch failed' }, { status: 502 });
  }
}
