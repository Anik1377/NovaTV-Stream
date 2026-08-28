import { type NextRequest, NextResponse } from 'next/server';

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vidsrc.cc https://vidsrc.icu https://multiembed.mov https://embed.su https://moviesapi.club https://vidsrc.xyz https://vidstreaming.io https://2embed.cc https://a.magsrv.com https://www.highperformanceformat.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://vidsrc.cc https://vidsrc.icu https://multiembed.mov https://embed.su https://moviesapi.club https://vidsrc.xyz https://vidstreaming.io https://2embed.cc https://vidsy.pw https://filemoon.sx https://vidsrc.to https://vidsrc.sbs https://vidsrc.pm https://vidsrc.pro https://vidlink.pro https://playembeds.com https://cinezo.org https://player.vidlove.cc https://vidlove.cc https://player.videasy.net https://player.videasy.to https://*.videasy.to https://*.onlinegames.io https://readcomicsonline.lol; img-src 'self' https://image.tmdb.org https://*.tmdb.org https://*.onlinegames.io https://www.onlinegames.io https://cdn.readcomicsonline.lol data: blob: https://a.magsrv.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://*.googleapis.com https://*.youtube.com https://api.mangadex.org https://uploads.mangadex.org *.mangadex.network https://api.videasy.net https://player.videasy.net https://player.videasy.to https://*.videasy.to https://*.onlinegames.io https://www.onlinegames.io https://readcomicsonline.lol https://cdn.readcomicsonline.lol https://a.magsrv.com; media-src 'self' blob: https://*.m3u8 https://*.mp4;");
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export async function middleware(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // If Supabase is not configured, pass through immediately
    if (!supabaseUrl || !supabaseKey) {
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      addSecurityHeaders(response);
      return response;
    }

    // Dynamic import to avoid bundling Supabase when not needed
    const { createClient } = await import('@/utils/supabase/middleware');
    const { supabase, response } = createClient(request);

    if (!supabase) {
      addSecurityHeaders(response);
      return response;
    }

    // Refresh the session so it doesn't expire
    await supabase.auth.getUser();

    addSecurityHeaders(response);
    return response;
  } catch (err) {
    console.error('Middleware error:', err);
    // On any error, pass through to avoid crashing the site
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    addSecurityHeaders(response);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logos, icons, games, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|logos/|icon-|logo|manifest|robots.txt|games/).*)',
  ],
};
