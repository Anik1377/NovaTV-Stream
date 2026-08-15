import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/** Get the authenticated user via Supabase, ensure local Prisma User exists */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (!supabase) {
    return { user: null, res: unauthorized() };
  }

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return { user: null, res: unauthorized() };
  }

  // Get or create local Prisma user (for watch history relations)
  let user;
  try {
    const { db } = await import('@/lib/db');
    user = await db.user.findUnique({ where: { id: authUser.id } });

    if (!user) {
      user = await db.user.create({
        data: {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || null,
          avatar: authUser.user_metadata?.avatar || null,
          bio: authUser.user_metadata?.bio || null,
        },
      });
    } else {
      // Sync user_metadata → local DB
      const meta = authUser.user_metadata || {};
      const needsUpdate =
        (meta.name !== undefined && meta.name !== user.name) ||
        (meta.avatar !== undefined && meta.avatar !== user.avatar) ||
        (meta.bio !== undefined && meta.bio !== user.bio);
      if (needsUpdate) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            ...(meta.name !== undefined ? { name: meta.name || null } : {}),
            ...(meta.avatar !== undefined ? { avatar: meta.avatar || null } : {}),
            ...(meta.bio !== undefined ? { bio: meta.bio || null } : {}),
          },
        });
      }
    }
  } catch {
    // Prisma unavailable — return user from Supabase metadata only
    const meta = authUser.user_metadata || {};
    user = {
      id: authUser.id,
      email: authUser.email!,
      name: meta.name || null,
      avatar: meta.avatar || null,
      bio: meta.bio || null,
      createdAt: new Date(),
    };
  }

  return { user, res: null };
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
