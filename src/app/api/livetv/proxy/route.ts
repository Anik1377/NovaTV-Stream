import { NextRequest, NextResponse } from 'next/server';

// CORS proxy for HLS streams and M3U8 manifests
const PROXY_CACHE = new Map<string, { data: ArrayBuffer; contentType: string; expiry: number }>();
const CACHE_TTL = 30 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only http/https URLs allowed' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const isManifest = url.endsWith('.m3u8');
  if (isManifest) {
    const cached = PROXY_CACHE.get(url);
    if (cached && cached.expiry > Date.now()) {
      return new NextResponse(cached.data, {
        headers: {
          'Content-Type': cached.contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    if (isManifest) {
      PROXY_CACHE.set(url, { data: buffer, contentType, expiry: Date.now() + CACHE_TTL });
      if (PROXY_CACHE.size > 100) {
        const firstKey = PROXY_CACHE.keys().next().value;
        if (firstKey) PROXY_CACHE.delete(firstKey);
      }
    }

    // For M3U8 manifests, rewrite relative URLs to go through proxy
    let responseBody = buffer;
    if (contentType.includes('mpegURL') || contentType.includes('text/') || isManifest) {
      const text = new TextDecoder().decode(buffer);
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const proxyBase = '/api/livetv/proxy?url=';

      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        // Skip comments, empty lines, and absolute URLs
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('http')) return line;
        // Rewrite relative URLs
        const absoluteUrl = baseUrl + trimmed;
        return proxyBase + encodeURIComponent(absoluteUrl);
      });

      let rewritten = rewrittenLines.join('\n');

      // Also rewrite URIs in KEY and MAP tags
      rewritten = rewritten.replace(
        /(URI=")([^"]+)(")/g,
        (_match, pre: string, uri: string, post: string) => {
          const absoluteUrl = uri.startsWith('http') ? uri : baseUrl + uri;
          return pre + proxyBase + encodeURIComponent(absoluteUrl) + post;
        }
      );

      responseBody = new TextEncoder().encode(rewritten).buffer;
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': isManifest ? 'public, max-age=30' : 'no-cache',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Proxy error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
