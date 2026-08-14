import { NextRequest, NextResponse } from 'next/server';
import { suggestMoviebox } from '@/lib/moviebox';

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q');
    if (!q) return NextResponse.json({ suggestions: [] });
    const data = await suggestMoviebox(q);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
