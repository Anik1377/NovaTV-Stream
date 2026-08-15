import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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

    // Ensure local user exists and sync metadata
    const meta = authUser.user_metadata || {};
    const user = await db.user.upsert({
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
