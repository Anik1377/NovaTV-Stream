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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/avif,image/jpg,image/png,image/*,*/*;q=0.8',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    // Longer cache for webp cover images from the comic CDN
    const isWebp = contentType.includes('webp');
    const cacheMaxAge = isWebp ? '604800' : '86400'; // 7 days for webp, 1 day otherwise

    return new NextResponse(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': `public, max-age=${cacheMaxAge}, stale-while-revalidate=86400`,
        'access-control-allow-origin': '*',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
