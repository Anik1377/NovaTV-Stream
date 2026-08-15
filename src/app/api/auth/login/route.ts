import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!supabase) {
      return NextResponse.json({ error: 'Authentication service not configured' }, { status: 503 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      if (msg.includes('email not confirmed')) {
        return NextResponse.json({ error: 'Please confirm your email first' }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Ensure local user record exists
    const authUser = data.user;
    try {
      const { db } = await import('@/lib/db');
      await db.user.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || null,
          avatar: authUser.user_metadata?.avatar || null,
          bio: authUser.user_metadata?.bio || null,
        },
        update: {
          email: authUser.email!,
        },
      });
    } catch {
      // Prisma unavailable — continue anyway
    }

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || null,
        avatar: authUser.user_metadata?.avatar || null,
        bio: authUser.user_metadata?.bio || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
