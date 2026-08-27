import { NextResponse } from 'next/server';
import { getMovieboxHome } from '@/lib/moviebox';

export async function GET() {
  try {
    const data = await getMovieboxHome();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch MovieBox home' }, { status: 502 });
  }
}
