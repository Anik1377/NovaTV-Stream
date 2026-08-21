import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getSessionUser, ok, badRequest } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return ok([]);

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', user!.id)
      .order('watched_at', { ascending: false })
      .limit(limit);

    if (error) return ok([]);
    return ok(data || []);
  } catch {
    return ok([]);
  }
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

    if (typeof tmdbId !== 'number' || !Number.isInteger(tmdbId)) {
      return badRequest('Invalid tmdbId');
    }
    if (!['movie', 'tv'].includes(mediaType)) {
      return badRequest('Invalid mediaType');
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return badRequest('Service unavailable');

    // Upsert: check if same tmdbId+season+episode exists
    const { data: existing } = await supabase
      .from('watch_history')
      .select('id')
      .eq('user_id', user!.id)
      .eq('tmdb_id', tmdbId)
      .eq('season', season ?? null)
      .eq('episode', episode ?? null)
      .limit(1);

    if (existing && existing.length > 0) {
      const { data } = await supabase
        .from('watch_history')
        .update({ watched_at: new Date().toISOString() })
        .eq('id', existing[0].id)
        .select()
        .single();
      return ok(data);
    }

    const { data, error } = await supabase
      .from('watch_history')
      .insert({
        user_id: user!.id,
        tmdb_id: tmdbId,
        title,
        poster_path: posterPath || null,
        media_type: mediaType,
        season: season ?? null,
        episode: episode ?? null,
      })
      .select()
      .single();

    if (error) return ok({});
    return ok(data);
  } catch {
    return ok({});
  }
}

export async function DELETE(req: NextRequest) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return badRequest('Service unavailable');

    if (id) {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) return ok({ success: true });
      return ok({ success: true });
    }

    // Clear all history
    await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', user!.id);
    return ok({ success: true });
  } catch {
    return ok({ success: true });
  }
}