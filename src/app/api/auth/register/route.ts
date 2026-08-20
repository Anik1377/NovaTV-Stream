import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!supabase) {
      return NextResponse.json({ error: 'Authentication service not configured' }, { status: 503 });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name || null,
          avatar: '🔴',
          bio: null,
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Registration failed' }, { status: 400 });
    }

    const authUser = data.user;

    // Create local user record
    try {
      const { db } = await import('@/lib/db');
      await db.user.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          email: authUser.email!,
          name: name || null,
          avatar: '🔴',
          bio: null,
        },
        update: { email: authUser.email! },
      });
    } catch (err) {
      console.error('Prisma upsert failed during register:', err);
    }

    // If email confirmation is required, user won't have a session yet
    const session = data.session;

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: name || null,
        avatar: '🔴',
        bio: null,
      },
      emailConfirmationRequired: !session,
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
