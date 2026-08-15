import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // If Supabase is not configured, just pass through
  if (!supabase) {
    return response;
  }

  // Refresh the session so it doesn't expire
  await supabase.auth.getUser();

  return response;
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
