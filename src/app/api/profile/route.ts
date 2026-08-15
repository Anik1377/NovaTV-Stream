import { getSessionUser, ok, unauthorized, badRequest } from '@/lib/auth';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  const { db } = await import('@/lib/db');
  const historyCount = await db.watchHistory.count({ where: { userId: user!.id } });

  return ok({
    id: user!.id,
    email: user!.email,
    name: user!.name,
    avatar: user!.avatar,
    bio: user!.bio,
    createdAt: user!.createdAt,
    stats: { watchHistoryCount: historyCount },
  });
}

export async function PUT(req: Request) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const body = await req.json();
    const { name, bio, avatar } = body;

    if (avatar && !avatar.startsWith('http') && !avatar.startsWith('data:') && avatar.length > 4) {
      return badRequest('Invalid avatar');
    }
    if (bio && bio.length > 200) {
      return badRequest('Bio must be 200 characters or less');
    }

    // Update Supabase user_metadata
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (supabase) {
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name || null;
      if (bio !== undefined) updates.bio = bio || null;
      if (avatar !== undefined) updates.avatar = avatar || '🔴';

      await supabase.auth.updateUser({
        data: updates,
      });
    }

    // Update local Prisma user
    const { db } = await import('@/lib/db');
    const updated = await db.user.update({
      where: { id: user!.id },
      data: {
        ...(name !== undefined ? { name: name || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(avatar !== undefined ? { avatar: avatar || '🔴' } : {}),
      },
    });

    return ok({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar || '🔴',
      bio: updated.bio,
      createdAt: updated.createdAt,
    });
  } catch {
    return badRequest('Failed to update profile');
  }
}
