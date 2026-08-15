import { getSessionUser, ok, unauthorized, badRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  const history = await db.watchHistory.findMany({
    where: { userId: user!.id },
    orderBy: { watchedAt: 'desc' },
    take: limit,
  });

  return ok(history);
}

export async function POST(req: Request) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const body = await req.json();
    const { tmdbId, title, posterPath, mediaType, season, episode } = body;

    if (!tmdbId || !title || !mediaType) {
      return badRequest('tmdbId, title, and mediaType are required');
    }

    // Upsert: update watchedAt if same tmdbId+season+episode exists
    const existing = await db.watchHistory.findFirst({
      where: {
        userId: user!.id,
        tmdbId,
        season: season ?? null,
        episode: episode ?? null,
      },
    });

    if (existing) {
      const updated = await db.watchHistory.update({
        where: { id: existing.id },
        data: { watchedAt: new Date() },
      });
      return ok(updated);
    }

    const entry = await db.watchHistory.create({
      data: {
        userId: user!.id,
        tmdbId,
        title,
        posterPath: posterPath || null,
        mediaType,
        season: season ?? null,
        episode: episode ?? null,
      },
    });

    return ok(entry);
  } catch {
    return badRequest('Failed to record watch history');
  }
}

export async function DELETE(req: NextRequest) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      const entry = await db.watchHistory.findFirst({ where: { id, userId: user!.id } });
      if (!entry) return badRequest('Not found');
      await db.watchHistory.delete({ where: { id } });
      return ok({ success: true });
    }

    // Clear all history
    await db.watchHistory.deleteMany({ where: { userId: user!.id } });
    return ok({ success: true });
  } catch {
    return badRequest('Failed to delete');
  }
}
