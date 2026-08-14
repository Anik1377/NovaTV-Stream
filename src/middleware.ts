import { type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response } = createClient(request);

  // NOTE: Avoid writing any logic between createClient and
  // the final return. A simple mistake could make it very hard
  // to debug issues with users being randomly logged out.

  // IMPORTANT: If you need to check auth, do it like this:
  // const { supabase } = createClient(request);
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   return NextResponse.redirect(url);
  // }

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
