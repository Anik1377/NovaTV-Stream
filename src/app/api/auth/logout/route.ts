import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
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
