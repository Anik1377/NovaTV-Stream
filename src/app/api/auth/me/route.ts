import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // If Supabase not configured, return null user without touching Prisma
    if (!supabase) {
      return NextResponse.json({ user: null });
    }

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ user: null });
    }

    // Lazy-import Prisma only when we actually have a Supabase user
    let user;
    try {
      const { db } = await import('@/lib/db');
      const meta = authUser.user_metadata || {};
      user = await db.user.upsert({
        where: { id: authUser.id },
        create: {
          id: authUser.id,
          email: authUser.email!,
          name: meta.name || null,
          avatar: meta.avatar || '🔴',
          bio: meta.bio || null,
        },
        update: {
          ...(meta.name !== undefined ? { name: meta.name || null } : {}),
          ...(meta.avatar !== undefined ? { avatar: meta.avatar || '🔴' } : {}),
          ...(meta.bio !== undefined ? { bio: meta.bio || null } : {}),
        },
      });
    } catch {
      // Prisma unavailable — return user data from Supabase only
      return NextResponse.json({
        user: {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || null,
          avatar: authUser.user_metadata?.avatar || '🔴',
          bio: authUser.user_metadata?.bio || null,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || '🔴',
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
