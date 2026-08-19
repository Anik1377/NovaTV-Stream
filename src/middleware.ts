import { type NextRequest, NextResponse } from 'next/server';

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
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
