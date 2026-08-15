import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // If Supabase is not configured, pass through immediately
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.next({
        request: { headers: request.headers },
      });
    }

    // Dynamic import to avoid bundling Supabase when not needed
    const { createClient } = await import('@/utils/supabase/middleware');
    const { supabase, response } = createClient(request);

    if (!supabase) {
      return response;
    }

    // Refresh the session so it doesn't expire
    await supabase.auth.getUser();

    return response;
  } catch (err) {
    console.error('Middleware error:', err);
    // On any error, pass through to avoid crashing the site
    return NextResponse.next({
      request: { headers: request.headers },
    });
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
