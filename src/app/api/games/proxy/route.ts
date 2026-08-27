import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for GameDistribution HTML5 games.
 * Fetches the direct game file, strips all third-party SDK/ads scripts,
 * and serves clean game HTML from our domain.
 */

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { html: string; ts: number }>();

const GD_GAME_BASE = 'https://html5.gamedistribution.com/rvvASMiM';

function removeScriptsWithSrc(html: string, domainPatterns: string[]): string {
  // Match <script ... src="..."></script> and <script ... src="..." ...></script>
  // Also handles self-closing: <script src="..." /> (which shouldn't exist but just in case)
  const pattern = new RegExp(
    `<script\\s[^>]*?src=["']([^"']*)["'][^>]*>[\\s\\S]*?<\\/script>`,
    'gi'
  );
  return html.replace(pattern, (match, src: string) => {
    const lowerSrc = src.toLowerCase();
    for (const p of domainPatterns) {
      if (lowerSrc.includes(p.toLowerCase())) {
        return '';
      }
    }
    return match;
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gameId = searchParams.get('gameId');

  if (!gameId || !/^[a-f0-9]{32}$/.test(gameId)) {
    return NextResponse.json({ error: 'Invalid gameId' }, { status: 400 });
  }

  const cached = cache.get(gameId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new NextResponse(cached.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
      },
    });
  }

  try {
    const gameUrl = `${GD_GAME_BASE}/${gameId}/index.html`;
    const res = await fetch(gameUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Game not found', status: res.status }, { status: res.status });
    }

    let html = await res.text();

    // Remove all third-party SDK and tracking scripts
    const blockedDomains = [
      'gamedistribution.com',
      'assets.msn.com',
      'aeriagames.jp',
      'azrtrk.com',
      'azerion',
    ];

    html = removeScriptsWithSrc(html, blockedDomains);

    // Remove GD_OPTIONS init if present anywhere
    html = html.replace(/window\[["']GD_OPTIONS["']\][\s\S]*?;\s*\}/g, '');

    // Add <base> tag so relative URLs (JS, CSS, assets) resolve to GD CDN
    const baseHref = `${GD_GAME_BASE}/${gameId}/`;
    if (!html.includes('<base')) {
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
    }

    // Remove Yahoo/Aeria menu iframe header
    html = html.replace(/<header[^>]*id=["']menu-header["'][^>]*>[\s\S]*?<\/header>/gi, '');

    cache.set(gameId, { html, ts: Date.now() });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('Game proxy error:', gameId, err);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}
