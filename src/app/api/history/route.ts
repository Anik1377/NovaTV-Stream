import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 200);
    const offset = Math.max(0, Math.min(Number(url.searchParams.get('offset')) || 0, 500));
    const mediaType = url.searchParams.get('type'); // 'movie' | 'tv' | 'person'

    const where: Record<string, unknown> = { userId: authUser.id };
    if (mediaType) where.mediaType = mediaType;

    const [items, total] = await Promise.all([
      db.browseHistory.findMany({
        where,
        orderBy: { visitedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.browseHistory.count({ where }),
    ]);

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tmdbId, title, posterPath, mediaType, subtitle } = body;

    if (!tmdbId || !title || !mediaType) {
      return NextResponse.json({ error: 'tmdbId, title, and mediaType are required' }, { status: 400 });
    }

    if (typeof tmdbId !== 'number' || !Number.isInteger(tmdbId)) {
      return NextResponse.json({ error: 'Invalid tmdbId' }, { status: 400 });
    }

    if (!['movie', 'tv', 'person'].includes(mediaType)) {
      return NextResponse.json({ error: 'mediaType must be movie, tv, or person' }, { status: 400 });
    }

    // Upsert using the unique constraint
    const item = await db.browseHistory.upsert({
      where: {
        userId_tmdbId_mediaType: {
          userId: authUser.id,
          tmdbId,
          mediaType,
        },
      },
      create: {
        userId: authUser.id,
        tmdbId,
        title,
        posterPath: posterPath || null,
        mediaType,
        subtitle: subtitle || null,
      },
      update: {
        title,
        posterPath: posterPath || null,
        subtitle: subtitle || null,
        visitedAt: new Date(),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: 'Failed to record history' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      await db.browseHistory.delete({ where: { id, userId: authUser.id } });
      return NextResponse.json({ success: true });
    }

    // Clear all history
    await db.browseHistory.deleteMany({ where: { userId: authUser.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}
