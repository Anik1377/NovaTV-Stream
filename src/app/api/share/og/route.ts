import { NextRequest, NextResponse } from 'next/server';

async function proxyImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const title = sp.get('title') || 'StreamVault';
  const year = sp.get('year') || '';
  const rating = sp.get('rating') || '';
  const g1 = sp.get('g1') || '';
  const g2 = sp.get('g2') || '';
  const g3 = sp.get('g3') || '';
  const poster = sp.get('poster') || '';
  const backdrop = sp.get('backdrop') || '';
  const runtime = sp.get('runtime') || '';
  const mediaType = sp.get('type') || 'movie';

  const genres = [g1, g2, g3].filter(Boolean);

  let posterHref = '';
  if (poster) {
    const buf = await proxyImage(`https://image.tmdb.org/t/p/w342${poster}`);
    if (buf) posterHref = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }

  let backdropHref = '';
  if (backdrop) {
    const buf = await proxyImage(`https://image.tmdb.org/t/p/w1280${backdrop}`);
    if (buf) backdropHref = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }

  const shortTitle = title.length > 38 ? title.slice(0, 36) + '…' : title;
  const badge = mediaType === 'tv' ? 'TV SERIES' : 'MOVIE';
  const metaX = 280;
  let metaOffset = 0;

  let ratingSvg = '';
  if (rating && parseFloat(rating) > 0) {
    ratingSvg = `<text x="${metaX + metaOffset}" y="230" fill="#fbbf24" font-size="20" font-family="system-ui">★ ${esc(rating)}</text>`;
    metaOffset += 80;
  }
  let yearSvg = '';
  if (year) {
    yearSvg = `<text x="${metaX + metaOffset}" y="230" fill="rgba(255,255,255,0.4)" font-size="20" font-family="system-ui">${esc(year)}</text>`;
    metaOffset += 80;
  }
  let runtimeSvg = '';
  if (runtime) {
    runtimeSvg = `<text x="${metaX + metaOffset}" y="230" fill="rgba(255,255,255,0.4)" font-size="20" font-family="system-ui">${esc(runtime)}</text>`;
  }

  const genrePills = genres.map((g, i) => {
    const short = g.length > 14 ? g.slice(0, 12) + '…' : g;
    return `<rect x="${280 + i * 130}" y="260" width="120" height="30" rx="6" fill="rgba(255,255,255,0.08)" /><text x="${280 + i * 130 + 60}" y="280" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="14" font-weight="500" font-family="system-ui">${esc(short)}</text>`;
  }).join('');

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#0f0f0f"/><stop offset="100%" stop-color="#1a0a0a"/>
      </linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="630" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="70%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.9)"/>
      </linearGradient>
      <clipPath id="pc"><rect x="60" y="115" width="180" height="270" rx="12"/></clipPath>
      <filter id="sh"><feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="rgba(0,0,0,0.5)"/></filter>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    ${backdropHref ? `<g opacity="0.3"><image href="${backdropHref}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMidSlice"/></g><rect width="1200" height="630" fill="url(#fade)"/>` : ''}
    <g filter="url(#sh)"><g clip-path="url(#pc)">
      ${posterHref ? `<image href="${posterHref}" x="60" y="115" width="180" height="270" preserveAspectRatio="xMidYMidSlice"/>` : `<rect x="60" y="115" width="180" height="270" fill="rgba(255,255,255,0.06)"/>`}
    </g></g>
    <rect x="60" y="115" width="180" height="270" rx="12" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="980" y="60" width="160" height="32" rx="6" fill="#e50914"/>
    <text x="1060" y="82" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="system-ui" letter-spacing="2">${badge}</text>
    <text x="${metaX}" y="200" fill="white" font-size="48" font-weight="800" font-family="system-ui" letter-spacing="-0.5">${esc(shortTitle)}</text>
    ${ratingSvg}${yearSvg}${runtimeSvg}
    ${genrePills}
    <rect x="280" y="360" width="200" height="48" rx="12" fill="#e50914"/>
    <text x="380" y="390" text-anchor="middle" fill="white" font-size="16" font-weight="700" font-family="system-ui">▶  Watch Now</text>
    <g transform="translate(280,520)">
      <rect width="28" height="28" rx="6" fill="#e50914"/>
      <text x="14" y="20" text-anchor="middle" fill="white" font-size="16" font-family="system-ui">▶</text>
      <text x="38" y="19" fill="rgba(255,255,255,0.9)" font-size="18" font-weight="700" font-family="system-ui" letter-spacing="1">StreamVault</text>
      <text x="38" y="38" fill="rgba(255,255,255,0.35)" font-size="13" font-family="system-ui">Free Movies &amp; TV Shows</text>
    </g>
    <rect x="60" y="560" width="80" height="3" rx="1.5" fill="#e50914" opacity="0.6"/>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
