import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/** Get the authenticated user from session cookie, or return null response */
export async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get('sv_session')?.value;
  if (!token) return { user: null, res: unauthorized() };

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } });
    const res = unauthorized();
    res.cookies.set('sv_session', '', { maxAge: 0, path: '/' });
    return { user: null, res };
  }

  return { user: session.user, res: null };
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function ok(data: unknown) {
  return NextResponse.json(data);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
