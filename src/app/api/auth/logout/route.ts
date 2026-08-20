import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (supabase) {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
