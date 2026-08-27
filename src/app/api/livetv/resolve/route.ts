import { NextRequest, NextResponse } from 'next/server';

const verifyCache = new Map<string, { ok: boolean; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Validate URL
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs allowed' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const proxyUrl = `/api/livetv/proxy?url=${encodeURIComponent(url)}`;

  // Check cache for recent verification
  const cached = verifyCache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json({
      type: 'hls',
      hlsUrl: url,
      proxiedHlsUrl: proxyUrl,
      reachable: cached.ok,
    });
  }

  // Verify stream is reachable
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const ok = res.ok;
    verifyCache.set(url, { ok, expiry: Date.now() + CACHE_TTL });
    if (verifyCache.size > 200) {
      const firstKey = verifyCache.keys().next().value;
      if (firstKey) verifyCache.delete(firstKey);
    }

    return NextResponse.json({
      type: 'hls',
      hlsUrl: url,
      proxiedHlsUrl: proxyUrl,
      reachable: ok,
    });
  } catch {
    return NextResponse.json({
      type: 'hls',
      hlsUrl: url,
      proxiedHlsUrl: proxyUrl,
      reachable: false,
      error: 'Stream unreachable',
    });
  }
}
