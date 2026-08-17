import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ok, badRequest } from '@/lib/auth';

export async function GET() {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (!supabase) return ok({ ...user!, stats: { watchHistoryCount: 0 } });

    const { count } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    return ok({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      avatar: user!.avatar,
      bio: user!.bio,
      accentColor: (user as Record<string, unknown>).accentColor as string | null ?? null,
      favoriteGenres: (user as Record<string, unknown>).favoriteGenres as string[] ?? [],
      adultEnabled: (user as Record<string, unknown>).adultEnabled as boolean ?? false,
      createdAt: user!.createdAt,
      stats: { watchHistoryCount: count || 0 },
    });
  } catch {
    return ok({ ...user!, stats: { watchHistoryCount: 0 } });
  }
}

export async function PUT(req: Request) {
  const { user, res: errRes } = await getSessionUser();
  if (errRes) return errRes;

  try {
    const body = await req.json();
    const { name, bio, avatar, accentColor, favoriteGenres, adultEnabled } = body;

    if (bio && bio.length > 200) {
      return badRequest('Bio must be 200 characters or less');
    }
    if (favoriteGenres && !Array.isArray(favoriteGenres)) {
      return badRequest('favoriteGenres must be an array');
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name || null;
    if (bio !== undefined) updates.bio = bio || null;
    if (avatar !== undefined) updates.avatar = avatar || 'hero';
    if (accentColor !== undefined) updates.accent_color = accentColor || null;
    if (favoriteGenres !== undefined) updates.favorite_genres = favoriteGenres;
    if (adultEnabled !== undefined) updates.adult_enabled = adultEnabled;

    if (supabase) {
      // Try updating the profiles table first
      const { error: tableError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id);

      // If table doesn't exist yet, fall back to user_metadata
      if (tableError && tableError.code === '42P01') {
        const metaUpdates: Record<string, unknown> = {};
        if (name !== undefined) metaUpdates.name = name || null;
        if (bio !== undefined) metaUpdates.bio = bio || null;
        if (avatar !== undefined) metaUpdates.avatar = avatar || 'hero';
        if (accentColor !== undefined) metaUpdates.accentColor = accentColor || null;
        if (favoriteGenres !== undefined) metaUpdates.favoriteGenres = favoriteGenres;
        if (adultEnabled !== undefined) metaUpdates.adultEnabled = adultEnabled;
        await supabase.auth.updateUser({ data: metaUpdates });
      }
    }

    // Also update local store via user_metadata as fallback
    if (supabase) {
      const metaUpdates: Record<string, unknown> = {};
      if (name !== undefined) metaUpdates.name = name || null;
      if (bio !== undefined) metaUpdates.bio = bio || null;
      if (avatar !== undefined) metaUpdates.avatar = avatar || 'hero';
      if (accentColor !== undefined) metaUpdates.accentColor = accentColor || null;
      if (favoriteGenres !== undefined) metaUpdates.favoriteGenres = favoriteGenres;
      if (adultEnabled !== undefined) metaUpdates.adultEnabled = adultEnabled;
      await supabase.auth.updateUser({ data: metaUpdates });
    }

    return ok({
      id: user!.id,
      email: user!.email,
      name: name !== undefined ? (name || null) : user!.name,
      avatar: avatar !== undefined ? (avatar || 'hero') : (user!.avatar || 'hero'),
      bio: bio !== undefined ? (bio || null) : user!.bio,
      accentColor: accentColor !== undefined ? (accentColor || null) : ((user as Record<string, unknown>).accentColor as string | null ?? null),
      favoriteGenres: favoriteGenres !== undefined ? favoriteGenres : ((user as Record<string, unknown>).favoriteGenres as string[] ?? []),
      adultEnabled: adultEnabled !== undefined ? adultEnabled : ((user as Record<string, unknown>).adultEnabled as boolean ?? false),
      createdAt: user!.createdAt,
    });
  } catch {
    return badRequest('Failed to update profile');
  }
}
