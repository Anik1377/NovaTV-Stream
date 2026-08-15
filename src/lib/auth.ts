import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt?: string;
}

/** Get the authenticated user via Supabase, with profile data */
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

  const meta = authUser.user_metadata || {};

  // Try getting profile from Supabase profiles table
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      return {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name || meta.name || null,
          avatar: profile.avatar || meta.avatar || '🔴',
          bio: profile.bio || meta.bio || null,
          createdAt: profile.created_at,
        },
        res: null,
      };
    }
  } catch {
    // profiles table might not exist yet — fall through to metadata
  }

  // Fallback: use user_metadata
  return {
    user: {
      id: authUser.id,
      email: authUser.email!,
      name: meta.name || null,
      avatar: meta.avatar || '🔴',
      bio: meta.bio || null,
    },
    res: null,
  };
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
