import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }

  // Only allow MangaDex / mangadex.org URLs for security
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('mangadex.org') && !parsed.hostname.endsWith('uploads.mangadex.org')) {
      return new NextResponse('Invalid URL host', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://mangadex.org/',
        'User-Agent': 'MangaReader/1.0',
      },
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
        'access-control-allow-origin': '*',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
