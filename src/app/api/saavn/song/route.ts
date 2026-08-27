import { NextRequest, NextResponse } from 'next/server';
import { saavnSongDetails } from '@/lib/saavn';

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'Missing query parameter: ids (comma-separated)' }, { status: 400 });
  }

  const idList = ids.split(',').filter(Boolean).slice(0, 50);

  try {
    const map = await saavnSongDetails(idList);
    const tracks = idList.map((id) => map.get(id)).filter(Boolean);
    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch song details', details: message }, { status: 500 });
  }
}
