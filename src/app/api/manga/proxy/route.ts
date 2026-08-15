import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for images
const imageCache = new Map<string, { buffer: ArrayBuffer; contentType: string; expiry: number }>();

// Allowed domains for the proxy
const ALLOWED_HOSTS = [
  'mangadex.org',
  'uploads.mangadex.org',
  'mangadex.network', // *.mangadex.network - CDN for chapter pages
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith('.' + allowed)
  );
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url', { status: 400 });
  }

  // Decode the URL (may be double-encoded from encodeURIComponent)
  const url = decodeURIComponent(rawUrl);

  // Security: only allow MangaDex URLs
  try {
    const parsed = new URL(url);
    if (!isAllowedHost(parsed.hostname)) {
      return new NextResponse('Invalid URL host', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Check in-memory cache
  const cacheKey = url;
  const cached = imageCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return new NextResponse(cached.buffer, {
      headers: {
        'content-type': cached.contentType,
        'cache-control': `public, max-age=86400`,
        'x-cache': 'HIT',
      },
    });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Referer: 'https://mangadex.org/',
        'User-Agent': 'MangaReader/1.0',
      },
      // Don't follow redirects to non-allowed hosts
      redirect: 'follow',
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, {
        status: res.status,
      });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    // Cache the image
    imageCache.set(cacheKey, {
      buffer,
      contentType,
      expiry: Date.now() + CACHE_TTL,
    });

    // Evict old entries if cache grows too large (keep max 500)
    if (imageCache.size > 500) {
      const entries = [...imageCache.entries()];
      entries.sort((a, b) => a[1].expiry - b[1].expiry);
      for (let i = 0; i < 100; i++) {
        imageCache.delete(entries[i][0]);
      }
    }

    return new NextResponse(buffer, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400',
        'x-cache': 'MISS',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}
