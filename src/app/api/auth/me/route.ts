import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
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

    const meta = authUser.user_metadata || {};

    // Try getting full profile from Supabase profiles table
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        return NextResponse.json({
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name || meta.name || null,
            avatar: profile.avatar || meta.avatar || 'hero',
            bio: profile.bio || meta.bio || null,
            accentColor: profile.accent_color || meta.accentColor || null,
            favoriteGenres: profile.favorite_genres || meta.favoriteGenres || [],
            adultEnabled: profile.adult_enabled ?? meta.adultEnabled ?? false,
            createdAt: profile.created_at,
          },
        });
      }
    } catch {
      // profiles table doesn't exist yet — fall through
    }

    // Fallback to user_metadata
    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: meta.name || null,
        avatar: meta.avatar || 'hero',
        bio: meta.bio || null,
        accentColor: meta.accentColor || null,
        favoriteGenres: meta.favoriteGenres || [],
        adultEnabled: meta.adultEnabled ?? false,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
