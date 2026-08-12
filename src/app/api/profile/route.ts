import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, ok, unauthorized, badRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, res: errRes } = await getSessionUser(req);
  if (errRes) return errRes;

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

export async function PUT(req: NextRequest) {
  const { user, res: errRes } = await getSessionUser(req);
  if (errRes) return errRes;

  try {
    const body = await req.json();
    const { name, bio, avatar } = body;

    if (avatar && !avatar.startsWith('http') && !avatar.startsWith('data:')) {
      return badRequest('Invalid avatar URL');
    }
    if (bio && bio.length > 200) {
      return badRequest('Bio must be 200 characters or less');
    }

    const updated = await db.user.update({
      where: { id: user!.id },
      data: {
        ...(name !== undefined ? { name: name || null } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(avatar !== undefined ? { avatar: avatar || null } : {}),
      },
    });

    return ok({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar,
      bio: updated.bio,
      createdAt: updated.createdAt,
    });
  } catch {
    return badRequest('Failed to update profile');
  }
}
