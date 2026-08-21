import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url', { status: 400 });
  }

  const url = decodeURIComponent(rawUrl);

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'Only HTTP(S) URLs are allowed' }, { status: 400 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ComicReader/1.0',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400',
        'access-control-allow-origin': '*'
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
